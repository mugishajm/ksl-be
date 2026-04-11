from __future__ import annotations

import base64
import json
import os
import threading
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Deque, Optional, Tuple

import cv2
import joblib
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

import hand_detector2 as hdm


ROOT = Path(__file__).resolve().parent
MODEL_CACHE = ROOT / "letter_model.joblib"

# Landmark features are pixel x,y; scale must match training (typical webcam ~640×480).
INFERENCE_FRAME_W = 640
INFERENCE_FRAME_H = 480
# Below this probability the UI shows no letter (tune down slightly for harder letters).
MIN_LETTER_CONFIDENCE = 0.58
# TFLite softmax peak (supportbackend keypoint model); typically a bit lower than sklearn probs.
MIN_KEYPOINT_CONFIDENCE = 0.42
# Consecutive agreeing frames required before appending to transcript (lower = faster, noisier).
LETTER_COMMIT_STREAK = 10

app = Flask(__name__)
CORS(app)

logs: Deque[str] = deque(maxlen=400)

# Exposed in /api/status and /api/health when ready: keypoint_tflite | sklearn_legacy | failed
SIGN_DETECTOR_KIND: str = "loading"


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def add_log(message: str) -> None:
    logs.append(f"[{utc_now_iso()}] {message}")


def load_letter_model() -> Pipeline:
    if MODEL_CACHE.exists():
        model = joblib.load(MODEL_CACHE)
        add_log("Loaded cached letter model.")
        return model

    data = pd.read_csv(ROOT / "hand_signals.csv")
    data = data.loc[:, ~data.columns.str.contains("^Unnamed")]
    x_data = data.drop("letter", axis=1).astype(np.float32)
    y_data = data["letter"]

    model = Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            (
                "classifier",
                LogisticRegression(
                    solver="saga",
                    max_iter=2000,
                    n_jobs=1,
                    random_state=42,
                ),
            ),
        ]
    )
    model.fit(x_data, y_data)
    joblib.dump(model, MODEL_CACHE)
    add_log(f"Model trained on {len(x_data)} samples and cached.")
    return model


class DetectionSession:
    def __init__(
        self,
        legacy_model: Optional[Pipeline],
        keypoint_engine: Any,
    ) -> None:
        """
        Either `keypoint_engine` (supportbackend TFLite + normalized landmarks) or
        `legacy_model` (sklearn on raw pixel landmarks) must be set.
        """
        self.legacy_model = legacy_model
        self.keypoint_engine = keypoint_engine
        self.detector: Optional[hdm.handDetector] = None
        if legacy_model is not None:
            self.detector = hdm.handDetector(
                mode=True,
                max_hands=1,
                detection_con=0.5,
                track_con=0.5,
            )
        self.lock = threading.Lock()
        self.active = False
        self.mode = "letter"
        self.started_at: Optional[datetime] = None
        self.detected_text = ""
        self.current_letter = ""
        self.current_confidence = 0.0
        self.letter_buffer: list[str] = []

    def start(self, mode: str) -> bool:
        if self.active:
            return False
        self.mode = mode
        self.started_at = datetime.now(timezone.utc)
        self.detected_text = ""
        self.current_letter = ""
        self.current_confidence = 0.0
        self.letter_buffer = []
        self.active = True
        add_log(f"Detection session started in {mode} mode.")
        return True

    def stop(self) -> None:
        self.active = False
        self.started_at = None
        add_log("Detection session stopped.")

    def clear_text(self) -> None:
        with self.lock:
            self.detected_text = ""
            self.letter_buffer = []
        add_log("Detected text cleared.")

    def process_frame(self, frame_bgr: np.ndarray) -> None:
        if not self.active:
            return

        with self.lock:
            # Match `letter_interpreter.py` / supportbackend: mirrored webcam (selfie view).
            frame_bgr = cv2.flip(frame_bgr, 1)
            frame_bgr = cv2.resize(
                frame_bgr,
                (INFERENCE_FRAME_W, INFERENCE_FRAME_H),
                interpolation=cv2.INTER_AREA,
            )

            if self.keypoint_engine is not None:
                letter, max_prob = self.keypoint_engine.predict_frame(
                    frame_bgr, INFERENCE_FRAME_W, INFERENCE_FRAME_H
                )
                if not letter:
                    self.current_letter = ""
                    self.current_confidence = max_prob
                    self.letter_buffer = []
                    return
                if max_prob <= MIN_KEYPOINT_CONFIDENCE:
                    self.current_letter = ""
                    self.current_confidence = max_prob
                    return
                predicted_letter = letter
                self.current_letter = predicted_letter
                self.current_confidence = max_prob
                if self.letter_buffer and self.letter_buffer[-1] == predicted_letter:
                    self.letter_buffer.append(predicted_letter)
                else:
                    self.letter_buffer = [predicted_letter]
                if len(self.letter_buffer) >= LETTER_COMMIT_STREAK:
                    self.detected_text += predicted_letter
                    self.letter_buffer = []
                return

            assert self.legacy_model is not None and self.detector is not None
            processed = self.detector.find_hands(frame_bgr, draw=False)
            landmarks = self.detector.find_position(processed, draw=False)

            if not landmarks or len(landmarks) != 1:
                self.current_letter = ""
                self.current_confidence = 0.0
                self.letter_buffer = []
                return

            lm_list = landmarks[0][1]
            location_vector = np.array([coord for lm in lm_list for coord in lm[1:3]]).reshape(
                1, -1
            )
            probabilities = self.legacy_model.predict_proba(location_vector)
            max_prob = float(np.max(probabilities))

            if max_prob <= MIN_LETTER_CONFIDENCE:
                self.current_letter = ""
                self.current_confidence = max_prob
                return

            predicted_letter = str(self.legacy_model.predict(location_vector)[0])
            self.current_letter = predicted_letter
            self.current_confidence = max_prob
            if self.letter_buffer and self.letter_buffer[-1] == predicted_letter:
                self.letter_buffer.append(predicted_letter)
            else:
                self.letter_buffer = [predicted_letter]
            if len(self.letter_buffer) >= LETTER_COMMIT_STREAK:
                self.detected_text += predicted_letter
                self.letter_buffer = []


_session: Optional[DetectionSession] = None
_load_error: Optional[str] = None
_model_ready = threading.Event()


def _try_keypoint_session() -> Optional[DetectionSession]:
    if os.getenv("USE_LEGACY_SIGN_MODEL", "0").lower() in ("1", "true", "yes"):
        add_log("USE_LEGACY_SIGN_MODEL set — using sklearn letter model only.")
        return None
    try:
        from keypoint_asl_engine import KeypointAslEngine, asl_keypoint_assets_exist
    except Exception as exc:
        add_log(f"Keypoint ASL not loaded (import): {exc}")
        return None
    if not asl_keypoint_assets_exist(ROOT):
        return None
    try:
        eng = KeypointAslEngine(ROOT)
        add_log(
            f"Keypoint ASL engine ready (supportbackend, TFLite via {eng.runtime_name})."
        )
        return DetectionSession(None, eng)
    except Exception as exc:
        add_log(f"Keypoint ASL not loaded (init): {exc}")
        return None


def _load_model_worker() -> None:
    global _session, _load_error, SIGN_DETECTOR_KIND
    try:
        SIGN_DETECTOR_KIND = "loading"
        add_log("Loading sign model (first run may train and take a minute)...")
        sess = _try_keypoint_session()
        if sess is not None:
            _session = sess
            SIGN_DETECTOR_KIND = "keypoint_tflite"
            add_log("Using TFLite keypoint classifier (supportbackend pipeline).")
        else:
            model = load_letter_model()
            _session = DetectionSession(model, None)
            SIGN_DETECTOR_KIND = "sklearn_legacy"
            add_log("Using scikit-learn letter model (letter_model.joblib / hand_signals).")
        add_log("Model ready — you can start a session from the UI.")
    except Exception as exc:
        _load_error = str(exc)
        SIGN_DETECTOR_KIND = "failed"
        add_log(f"Model load failed: {exc}")
    finally:
        _model_ready.set()


threading.Thread(target=_load_model_worker, daemon=True, name="model-loader").start()


def _backend_state() -> Tuple[Optional[DetectionSession], Optional[str], str]:
    """
    Returns (session, error, phase).
    phase: 'loading' | 'failed' | 'ready'
    """
    if not _model_ready.is_set():
        return None, None, "loading"
    if _load_error is not None:
        return None, _load_error, "failed"
    assert _session is not None
    return _session, None, "ready"


@app.get("/api/health")
def health() -> tuple[str, int]:
    _, err, phase = _backend_state()
    if phase == "loading":
        return (
            jsonify(
                {
                    "ok": True,
                    "status": "loading",
                    "timestamp": utc_now_iso(),
                    "sign_detector": "loading",
                }
            ),
            200,
        )
    if phase == "failed":
        return (
            jsonify(
                {
                    "ok": False,
                    "error": err,
                    "timestamp": utc_now_iso(),
                    "sign_detector": SIGN_DETECTOR_KIND,
                }
            ),
            503,
        )
    return (
        jsonify(
            {
                "ok": True,
                "status": "ready",
                "timestamp": utc_now_iso(),
                "sign_detector": SIGN_DETECTOR_KIND,
            }
        ),
        200,
    )


@app.get("/api/status")
def status() -> tuple[str, int]:
    sess, err, phase = _backend_state()
    if phase == "loading":
        return (
            jsonify(
                {
                    "status": "idle",
                    "mode": "letter",
                    "started_at": None,
                    "backend": "loading",
                    "sign_detector": "loading",
                }
            ),
            200,
        )
    if phase == "failed":
        return (
            jsonify(
                {
                    "error": err,
                    "backend": "failed",
                    "sign_detector": SIGN_DETECTOR_KIND,
                }
            ),
            503,
        )
    assert sess is not None
    return (
        jsonify(
            {
                "status": "running" if sess.active else "idle",
                "mode": sess.mode,
                "started_at": sess.started_at.isoformat() if sess.started_at else None,
                "backend": "ready",
                "sign_detector": SIGN_DETECTOR_KIND,
            }
        ),
        200,
    )


@app.get("/api/logs")
def get_logs() -> tuple[str, int]:
    return jsonify({"logs": list(logs)}), 200


@app.get("/api/prediction")
def get_prediction() -> tuple[str, int]:
    sess, err, phase = _backend_state()
    if phase == "loading":
        return (
            jsonify(
                {
                    "text": "",
                    "current_letter": "",
                    "confidence": 0.0,
                    "status": "idle",
                    "mode": "letter",
                    "backend": "loading",
                }
            ),
            200,
        )
    if phase == "failed":
        return jsonify({"error": err}), 503
    assert sess is not None
    with sess.lock:
        return (
            jsonify(
                {
                    "text": sess.detected_text,
                    "current_letter": sess.current_letter,
                    "confidence": sess.current_confidence,
                    "status": "running" if sess.active else "idle",
                    "mode": sess.mode,
                    "backend": "ready",
                }
            ),
            200,
        )


@app.post("/api/clear")
def clear_prediction() -> tuple[str, int]:
    sess, err, phase = _backend_state()
    if phase == "loading":
        return jsonify({"error": "Model is still loading."}), 503
    if phase == "failed":
        return jsonify({"error": err}), 503
    assert sess is not None
    sess.clear_text()
    return jsonify({"ok": True}), 200


@app.post("/api/commit-letter")
def commit_letter() -> tuple[str, int]:
    """Append the current detected letter to the transcript (manual, like tapping a key)."""
    sess, err, phase = _backend_state()
    if phase == "loading":
        return jsonify({"error": "Model is still loading."}), 503
    if phase == "failed":
        return jsonify({"error": err}), 503
    assert sess is not None
    if not sess.active:
        return jsonify({"error": "Session is not running. Start the camera first."}), 409
    with sess.lock:
        ch = (sess.current_letter or "").strip().lower()
        if not ch or len(ch) != 1 or not ch.isalpha():
            return (
                jsonify(
                    {
                        "error": (
                            "No letter to add yet. Hold your sign until a letter "
                            "appears above the confidence bar."
                        )
                    }
                ),
                400,
            )
        sess.detected_text += ch
        sess.letter_buffer = []
        text = sess.detected_text
    return jsonify({"ok": True, "text": text}), 200


@app.post("/api/commit-space")
def commit_space() -> tuple[str, int]:
    """Append a space to the transcript."""
    sess, err, phase = _backend_state()
    if phase == "loading":
        return jsonify({"error": "Model is still loading."}), 503
    if phase == "failed":
        return jsonify({"error": err}), 503
    assert sess is not None
    if not sess.active:
        return jsonify({"error": "Session is not running."}), 409
    with sess.lock:
        sess.detected_text += " "
        sess.letter_buffer = []
        text = sess.detected_text
    return jsonify({"ok": True, "text": text}), 200


@app.post("/api/start")
def start() -> tuple[str, int]:
    sess, err, phase = _backend_state()
    if phase == "loading":
        return (
            jsonify(
                {"error": "Model is still loading. Wait a few seconds and try again."}
            ),
            503,
        )
    if phase == "failed":
        return jsonify({"error": err}), 503
    assert sess is not None
    payload = request.get_json(silent=True) or {}
    mode = payload.get("mode", "letter")
    if mode not in {"letter", "word"}:
        return jsonify({"error": "Mode must be 'letter' or 'word'."}), 400
    if sess.active:
        return jsonify({"error": "Session already running."}), 409
    if not sess.start(mode):
        return jsonify({"error": "Unable to start session."}), 500
    return jsonify({"ok": True, "mode": mode}), 200


@app.post("/api/stop")
def stop() -> tuple[str, int]:
    sess, err, phase = _backend_state()
    if phase in ("loading", "failed"):
        return jsonify({"ok": True, "was_running": False}), 200
    assert sess is not None
    if sess.active:
        sess.stop()
        return jsonify({"ok": True, "was_running": True}), 200
    return jsonify({"ok": True, "was_running": False}), 200


@app.post("/api/analyze-frame")
def analyze_frame() -> tuple[str, int]:
    sess, err, phase = _backend_state()
    if phase == "loading":
        return jsonify({"error": "Model is still loading."}), 503
    if phase == "failed":
        return jsonify({"error": err}), 503
    assert sess is not None
    if not sess.active:
        return jsonify({"error": "Session is not running."}), 409

    data = request.get_json(silent=True) or {}
    frame_data = data.get("image")
    if not isinstance(frame_data, str) or "," not in frame_data:
        return jsonify({"error": "Invalid image payload."}), 400

    try:
        encoded = frame_data.split(",", 1)[1]
        binary = base64.b64decode(encoded)
        decoded = np.frombuffer(binary, dtype=np.uint8)
    except Exception:
        return jsonify({"error": "Invalid image encoding."}), 400

    frame = cv2.imdecode(decoded, cv2.IMREAD_COLOR)
    if frame is None:
        return jsonify({"error": "Could not decode frame."}), 400

    sess.process_frame(frame)
    with sess.lock:
        return (
            jsonify(
                {
                    "ok": True,
                    "text": sess.detected_text,
                    "current_letter": sess.current_letter,
                    "confidence": sess.current_confidence,
                }
            ),
            200,
        )


_commons_url_cache: dict[str, Optional[str]] = {}

# Expand common ligatures to manual-alphabet letters (finger spelling).
_LIGATURE_TO_ASCII: dict[str, str] = {
    "\u0153": "oe",  # œ
    "\u0152": "OE",
    "\u00e6": "ae",  # æ
    "\u00c6": "AE",
    "\u00df": "ss",  # ß
}


def _ascii_manual_letter(ch: str) -> Optional[str]:
    """Single Unicode letter → a–z for ASL manual alphabet, or None."""
    if len(ch) != 1 or not ch.isalpha() or ch in _LIGATURE_TO_ASCII:
        return None
    norm = unicodedata.normalize("NFD", ch)
    base = "".join(c for c in norm if unicodedata.category(c) != "Mn")
    if not base:
        return None
    low = base[0].lower()
    if "a" <= low <= "z":
        return low
    return None


def _manual_units_for_char(ch: str) -> Optional[list[str]]:
    """
    One user character → manual-alphabet units: list of 'a'-'z', or [' '] for whitespace.
    None → punctuation or unsupported alphabetic character.
    """
    if ch.isspace():
        return [" "]
    lig = _LIGATURE_TO_ASCII.get(ch)
    if lig:
        out = [c.lower() for c in lig if "a" <= c.lower() <= "z"]
        return out if out else None
    one = _ascii_manual_letter(ch)
    if one:
        return [one]
    if ch.isalpha():
        return None
    return None


def _commons_image_url_for_sign_letter(letter: str) -> Optional[str]:
    """Resolve Wikimedia Commons file URL for ASL manual alphabet SVG (A–Z)."""
    ch = letter.upper()
    if not ("A" <= ch <= "Z"):
        return None
    filename = f"Sign_language_{ch}.svg"
    if filename in _commons_url_cache:
        return _commons_url_cache[filename]

    title = f"File:{filename}"
    encoded = urllib.parse.quote(title)
    api_url = (
        "https://commons.wikimedia.org/w/api.php?"
        f"action=query&titles={encoded}&prop=imageinfo&iiprop=url&format=json"
    )
    try:
        req = urllib.request.Request(
            api_url,
            headers={"User-Agent": "SignLanguageInterpreter/1.0 (local; educational)"},
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        pages = payload.get("query", {}).get("pages", {})
        for _pid, page in pages.items():
            infos = page.get("imageinfo")
            if infos:
                url = infos[0].get("url")
                if isinstance(url, str) and url.startswith("http"):
                    _commons_url_cache[filename] = url
                    return url
    except (OSError, ValueError, TypeError, json.JSONDecodeError, urllib.error.URLError):
        pass
    _commons_url_cache[filename] = None
    return None


@app.post("/api/text-to-sign")
def text_to_sign() -> tuple[str, int]:
    """
    Latin text (English, French, Kinyarwanda, etc.) → ASL manual alphabet (finger spelling).
    Accented letters map to base A–Z; œ→O+E, æ→A+E, ß→S+S.
    """
    payload = request.get_json(silent=True) or {}
    text = payload.get("text", "")
    if not isinstance(text, str):
        return jsonify({"error": "text must be a string"}), 400

    items: list[dict] = []
    for i, ch in enumerate(text):
        units = _manual_units_for_char(ch)
        if units is None:
            items.append({"kind": "other", "value": ch, "sourceIndex": i})
            continue
        if units == [" "]:
            items.append({"kind": "space", "sourceIndex": i})
            continue
        for low in units:
            url = _commons_image_url_for_sign_letter(low)
            items.append(
                {
                    "kind": "letter",
                    "value": low,
                    "label": low.upper(),
                    "imageUrl": url,
                    "sourceIndex": i,
                }
            )

    return (
        jsonify(
            {
                "items": items,
                "note": (
                    "ASL manual alphabet (A–Z) reference images. "
                    "Accents map to base letters; œ→O+E, æ→A+E. "
                    "ASL is not a word-for-word translation of French or Kinyarwanda. "
                    "J and Z use motion in real ASL; this view is static finger spelling."
                ),
            }
        ),
        200,
    )


def _translate_en_to_target(text: str, target: str) -> Optional[str]:
    """
    Best-effort translation via MyMemory (free tier, network required).
    target: 'fr' | 'rw'
    """
    if target not in ("fr", "rw"):
        return None
    stripped = text.strip()
    if not stripped:
        return stripped
    chunk = stripped[:450]
    api_url = (
        "https://api.mymemory.translated.net/get?"
        + urllib.parse.urlencode({"q": chunk, "langpair": f"en|{target}"})
    )
    try:
        req = urllib.request.Request(
            api_url,
            headers={"User-Agent": "SignLanguageInterpreter/1.0 (local; educational)"},
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        data = payload.get("responseData") or {}
        translated = data.get("translatedText")
        if isinstance(translated, str) and translated.strip():
            return translated.strip()
    except (OSError, ValueError, TypeError, json.JSONDecodeError, urllib.error.URLError):
        pass
    return None


@app.post("/api/translate")
def translate_detected() -> tuple[str, int]:
    """
    Translate model output (treated as English letters/words) to French or Kinyarwanda.
    """
    payload = request.get_json(silent=True) or {}
    text = payload.get("text", "")
    target = payload.get("target", "en")
    if not isinstance(text, str):
        return jsonify({"error": "text must be a string"}), 400
    if not isinstance(target, str) or target not in ("en", "fr", "rw"):
        return jsonify({"error": "target must be en, fr, or rw"}), 400
    if target == "en":
        return jsonify({"text": text, "fallback": False}), 200
    translated = _translate_en_to_target(text, target)
    if translated is None:
        return (
            jsonify(
                {
                    "text": text,
                    "fallback": True,
                    "message": (
                        "Translation unavailable (offline, quota, or unsupported). "
                        "Showing detected text as recognized from signs."
                    ),
                }
            ),
            200,
        )
    return jsonify({"text": translated, "fallback": False}), 200


if __name__ == "__main__":
    host = os.getenv("API_HOST", "127.0.0.1")
    port = int(os.getenv("API_PORT", "5000"))
    debug = os.getenv("API_DEBUG", "0") == "1"
    app.run(host=host, port=port, debug=debug, threaded=True, use_reloader=False)
