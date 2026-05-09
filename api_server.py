from __future__ import annotations

import base64
import json
import os
import re
import secrets
import threading
import time
import uuid
import unicodedata
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from collections import deque
from datetime import datetime, timezone, timedelta
from pathlib import Path
from dataclasses import dataclass
from typing import Any, Deque, Optional, Tuple, TYPE_CHECKING

from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.collection import Collection
from werkzeug.security import check_password_hash, generate_password_hash

if TYPE_CHECKING:
    from sklearn.pipeline import Pipeline
else:
    Pipeline = Any  # runtime typing only


ROOT = Path(__file__).resolve().parent
MODEL_CACHE = ROOT / "letter_model.joblib"


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _env_float(name: str, default: float) -> float:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        return float(raw)
    except ValueError:
        return default

# Fail fast on unsupported Python versions to avoid confusing NumPy/OpenCV build errors.
if sys.version_info >= (3, 14):
    raise RuntimeError(
        "Unsupported Python version for this project. "
        "Use Python 3.11 or 3.12 (3.13 may work). "
        f"Detected: {sys.version.split()[0]}"
    )

# Landmark features are pixel x,y; scale must match training (typical webcam ~640×480).
INFERENCE_FRAME_W = 640
INFERENCE_FRAME_H = 480
# Low threshold used only for live UI display (faster, may be less accurate).
MIN_LETTER_DISPLAY_CONFIDENCE = 0.3
# TFLite softmax peak used only for live UI display.
MIN_KEYPOINT_DISPLAY_CONFIDENCE = 0.2
# Higher thresholds for stable/commit logic.
MIN_LETTER_COMMIT_CONFIDENCE = 0.5
MIN_KEYPOINT_COMMIT_CONFIDENCE = 0.34
# Consecutive agreeing frames required before appending to transcript (lower = faster, noisier).
LETTER_COMMIT_STREAK = _env_int("LETTER_COMMIT_STREAK", 3)
# Prevents repeated auto-commit of same held sign (seconds).
SAME_LETTER_COOLDOWN_SECONDS = 0.9
# User must hold a stable letter this long before auto-commit.
AUTO_COMMIT_HOLD_SECONDS = _env_float("AUTO_COMMIT_HOLD_SECONDS", 1.4)
# Keep current prediction for brief tracking dropouts (flicker reduction).
NO_DETECTION_GRACE_FRAMES = 5
# Require local consensus before feeding auto-commit streak.
LETTER_STABILITY_WINDOW = 5
LETTER_STABILITY_MIN_COUNT = _env_int("LETTER_STABILITY_MIN_COUNT", 2)


def _mirror_and_resize_bgr(frame_bgr: Any, w: int, h: int) -> Any:
    """
    Selfie mirror + resize to inference size.
    Falls back to Pillow when OpenCV rejects NumPy buffers (broken cv2/numpy ABI on some Windows venvs).
    """
    import cv2
    import numpy as np

    try:
        out = cv2.flip(frame_bgr, 1)
        return cv2.resize(out, (w, h), interpolation=cv2.INTER_AREA)
    except cv2.error:
        from PIL import Image

        arr = np.asarray(frame_bgr, dtype=np.uint8)
        if arr.ndim != 3 or arr.shape[2] != 3:
            raise ValueError("expected HxWx3 BGR frame") from None
        rgb = arr[:, :, ::-1]
        im = Image.fromarray(rgb)
        im = im.transpose(Image.FLIP_LEFT_RIGHT).resize((w, h), Image.Resampling.BILINEAR)
        out_rgb = np.asarray(im, dtype=np.uint8)
        return out_rgb[:, :, ::-1].copy()


app = Flask(__name__)
# CORS: this API is called from multiple deployed frontends (Vercel, local dev, etc).
# We don't rely on cookies; auth is via bearer tokens, so we can safely allow any origin.
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Session-Id"],
        }
    },
    supports_credentials=False,
)

logs: Deque[str] = deque(maxlen=400)
_mongo_client: Optional[MongoClient] = None

# Exposed in /api/status and /api/health when ready: keypoint_tflite | sklearn_legacy | failed
SIGN_DETECTOR_KIND: str = "loading"
_RUNNING_ON_VERCEL = bool(os.getenv("VERCEL", "").strip())


def _vision_runtime_ok() -> tuple[bool, str]:
    """
    Best-effort import check for the CV/ML stack used by camera/sign detection.

    Auth + non-vision endpoints should still work when this fails.
    """
    try:
        import numpy as np  # noqa: F401
    except Exception as exc:
        return (
            False,
            "Vision runtime unavailable: NumPy failed to import "
            f"({type(exc).__name__}: {exc}). "
            "This usually means a broken/ABI-mismatched wheel on the server. "
            "Recreate the venv and ensure Python 3.11/3.12 with numpy==1.26.4.",
        )
    try:
        import cv2  # noqa: F401
    except Exception as exc:
        return (
            False,
            "Vision runtime unavailable: OpenCV failed to import "
            f"({type(exc).__name__}: {exc}). "
            "Install a compatible opencv-python wheel or use a container image with the needed system libs.",
        )
    try:
        import mediapipe  # noqa: F401
    except Exception as exc:
        return (
            False,
            "Vision runtime unavailable: MediaPipe failed to import "
            f"({type(exc).__name__}: {exc}). "
            "Ensure mediapipe and protobuf versions are compatible (protobuf<5 for mediapipe 0.10.x).",
        )
    return True, ""


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def add_log(message: str, session_id: Optional[str] = None) -> None:
    prefix = f"[{session_id[:8]}] " if session_id else ""
    logs.append(f"[{utc_now_iso()}] {prefix}{message}")


def _mongo_enabled() -> bool:
    return bool(os.getenv("DATABASE_URL", "").strip())


def _db():
    global _mongo_client
    uri = os.getenv("DATABASE_URL", "").strip()
    if not uri:
        return None
    if _mongo_client is None:
        _mongo_client = MongoClient(uri, serverSelectionTimeoutMS=8000)
    return _mongo_client.get_default_database()


def _users_col() -> Optional[Collection]:
    db = _db()
    return None if db is None else db["users"]


def _gestures_col() -> Optional[Collection]:
    db = _db()
    return None if db is None else db["gestures"]


def _logs_col() -> Optional[Collection]:
    db = _db()
    return None if db is None else db["interpretation_logs"]


def _doc_id(doc: dict) -> str:
    return str(doc.get("_id", ""))


def _user_public(doc: dict) -> dict:
    first = str(doc.get("firstName", "")).strip()
    last = str(doc.get("lastName", "")).strip()
    fallback = str(doc.get("name", "")).strip()
    name = f"{first} {last}".strip() or fallback or "Unknown"
    role = str(doc.get("role", "viewer")).strip().lower()
    if role not in {"admin", "moderator", "viewer", "user"}:
        role = "viewer"
    status = str(doc.get("status", "Active")).strip()
    if status not in {"Active", "Invited", "Disabled"}:
        status = "Active"
    joined_raw = doc.get("createdAt")
    if isinstance(joined_raw, datetime):
        joined_at = joined_raw.strftime("%Y-%m-%d")
    else:
        joined_at = str(joined_raw or "")[:10] or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return {
        "id": _doc_id(doc),
        "name": name,
        "email": str(doc.get("email", "")).strip().lower(),
        "role": "viewer" if role == "user" else role,
        "status": status,
        "joinedAt": joined_at,
        "profileCompleted": bool(doc.get("profileCompleted", False)),
    }


def _gesture_public(doc: dict) -> dict:
    updated = doc.get("updatedAt")
    if isinstance(updated, datetime):
        updated_at = updated.isoformat()
    else:
        updated_at = str(updated or utc_now_iso())
    return {
        "_id": _doc_id(doc),
        "name": str(doc.get("name", "")),
        "category": str(doc.get("category", "")),
        "difficulty": str(doc.get("difficulty", "Beginner")),
        "status": str(doc.get("status", "Active")),
        "updatedAt": updated_at,
    }


def _admin_log_public(doc: dict) -> dict:
    created = doc.get("createdAt")
    if isinstance(created, datetime):
        created_at = created.isoformat()
    else:
        created_at = str(created or utc_now_iso())
    return {
        "_id": _doc_id(doc),
        "user": str(doc.get("user", "Unknown")),
        "type": str(doc.get("type", "Live Interpretation")),
        "status": str(doc.get("status", "Completed")),
        "createdAt": created_at,
        "duration": str(doc.get("duration", "0m 00s")),
    }


def _extract_bearer_user() -> Optional[dict]:
    users = _users_col()
    if users is None:
        return None
    auth = request.headers.get("Authorization", "").strip()
    if not auth.startswith("Bearer "):
        return None
    token = auth.split(" ", 1)[1].strip()
    if not token:
        return None
    return users.find_one({"authToken": token})


def _record_admin_log(event_type: str, status: str, user: str = "system", duration: str = "0m 00s") -> None:
    col = _logs_col()
    if col is None:
        return
    col.insert_one(
        {
            "user": user,
            "type": event_type,
            "status": status,
            "duration": duration,
            "createdAt": datetime.now(timezone.utc),
        }
    )


def load_letter_model() -> Pipeline:
    # Heavy dependencies are imported lazily so the module can be deployed in a
    # "Vercel-lite" configuration without bundling large wheels.
    import joblib
    import numpy as np
    import csv
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import StandardScaler

    if MODEL_CACHE.exists():
        model = joblib.load(MODEL_CACHE)
        add_log("Loaded cached letter model.")
        return model

    csv_path = ROOT / "hand_signals.csv"
    with open(csv_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            raise RuntimeError("hand_signals.csv is empty or missing headers.")
        if "letter" not in reader.fieldnames:
            raise RuntimeError("hand_signals.csv is missing required 'letter' column.")
        feature_cols = [
            c
            for c in reader.fieldnames
            if c != "letter" and not str(c).startswith("Unnamed")
        ]
        if not feature_cols:
            raise RuntimeError("hand_signals.csv has no feature columns.")
        x_rows: list[list[float]] = []
        y_rows: list[str] = []
        for row in reader:
            y_rows.append(str((row.get("letter") or "")).strip().lower())
            x_rows.append([float(row.get(c, 0.0) or 0.0) for c in feature_cols])

    x_data = np.asarray(x_rows, dtype=np.float32)
    y_data = np.asarray(y_rows, dtype=str)

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
            import hand_detector2 as hdm
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
        self.last_committed_letter = ""
        self.last_commit_at: Optional[datetime] = None
        self.no_detection_frames = 0
        self.recent_letters: Deque[str] = deque(maxlen=LETTER_STABILITY_WINDOW)
        self.hold_letter = ""
        self.hold_started_at: Optional[datetime] = None

    def start(self, mode: str, session_id: str) -> bool:
        if self.active:
            return False
        self.mode = mode
        self.started_at = datetime.now(timezone.utc)
        self.detected_text = ""
        self.current_letter = ""
        self.current_confidence = 0.0
        self.letter_buffer = []
        self.last_committed_letter = ""
        self.last_commit_at = None
        self.no_detection_frames = 0
        self.recent_letters.clear()
        self.hold_letter = ""
        self.hold_started_at = None
        self.active = True
        add_log(f"Detection session started in {mode} mode.", session_id=session_id)
        return True

    def stop(self, session_id: Optional[str] = None) -> None:
        self.active = False
        self.started_at = None
        add_log("Detection session stopped.", session_id=session_id)

    def clear_text(self) -> None:
        with self.lock:
            self.detected_text = ""
            self.letter_buffer = []
            self.last_committed_letter = ""
            self.last_commit_at = None
            self.no_detection_frames = 0
            self.recent_letters.clear()
            self.hold_letter = ""
            self.hold_started_at = None
        add_log("Detected text cleared.")

    def _can_commit_letter(self, predicted_letter: str) -> bool:
        """
        Avoid repeated commits from one held hand pose.
        Allows immediate commit for a different letter, but rate-limits same-letter repeats.
        """
        if predicted_letter != self.last_committed_letter:
            return True
        if self.last_commit_at is None:
            return True
        elapsed = (datetime.now(timezone.utc) - self.last_commit_at).total_seconds()
        return elapsed >= SAME_LETTER_COOLDOWN_SECONDS

    def _record_committed_letter(self, predicted_letter: str) -> None:
        self.detected_text += predicted_letter
        self.last_committed_letter = predicted_letter
        self.last_commit_at = datetime.now(timezone.utc)
        self.letter_buffer = []
        self.hold_letter = ""
        self.hold_started_at = None

    def _stable_letter(self, predicted_letter: str) -> Optional[str]:
        self.recent_letters.append(predicted_letter)
        counts = Counter(self.recent_letters)
        letter, count = counts.most_common(1)[0]
        if count >= LETTER_STABILITY_MIN_COUNT:
            return letter
        return None

    def _handle_detection_miss(self, confidence: float = 0.0) -> None:
        self.current_confidence = confidence
        self.no_detection_frames += 1
        if self.no_detection_frames >= NO_DETECTION_GRACE_FRAMES:
            self.current_letter = ""
            self.letter_buffer = []
            self.recent_letters.clear()
            self.hold_letter = ""
            self.hold_started_at = None

    def _update_hold_and_maybe_commit(self, stable_letter: str) -> None:
        now = datetime.now(timezone.utc)
        if self.hold_letter != stable_letter:
            self.hold_letter = stable_letter
            self.hold_started_at = now
            return
        if self.hold_started_at is None:
            self.hold_started_at = now
            return
        hold_seconds = (now - self.hold_started_at).total_seconds()
        if hold_seconds >= AUTO_COMMIT_HOLD_SECONDS and self._can_commit_letter(stable_letter):
            self._record_committed_letter(stable_letter)

    def hold_progress(self) -> float:
        if not self.hold_letter or self.hold_started_at is None:
            return 0.0
        held = (datetime.now(timezone.utc) - self.hold_started_at).total_seconds()
        return max(0.0, min(held / AUTO_COMMIT_HOLD_SECONDS, 1.0))

    def process_frame(self, frame_bgr: np.ndarray) -> None:
        import numpy as np

        if not self.active:
            return

        # Match `letter_interpreter.py` / supportbackend: mirrored webcam (selfie view).
        frame_bgr = _mirror_and_resize_bgr(
            frame_bgr, INFERENCE_FRAME_W, INFERENCE_FRAME_H
        )

        if self.keypoint_engine is not None:
            # Shared engine serializes internally; do not hold per-session lock during inference.
            letter, max_prob = self.keypoint_engine.predict_frame(
                frame_bgr, INFERENCE_FRAME_W, INFERENCE_FRAME_H
            )
            with self.lock:
                if not self.active:
                    return
                if not letter:
                    self._handle_detection_miss(max_prob)
                    return
                if max_prob <= MIN_KEYPOINT_DISPLAY_CONFIDENCE:
                    self._handle_detection_miss(max_prob)
                    return
                predicted_letter = letter
                self.no_detection_frames = 0
                self.current_confidence = max_prob
                self.current_letter = predicted_letter
                if max_prob <= MIN_KEYPOINT_COMMIT_CONFIDENCE:
                    self.letter_buffer = []
                    self.recent_letters.clear()
                    self.hold_letter = ""
                    self.hold_started_at = None
                    return
                stable_letter = self._stable_letter(predicted_letter)
                self.current_letter = stable_letter or predicted_letter
                if not stable_letter:
                    self.letter_buffer = []
                    return
                if self.letter_buffer and self.letter_buffer[-1] == stable_letter:
                    self.letter_buffer.append(stable_letter)
                else:
                    self.letter_buffer = [stable_letter]
                if len(self.letter_buffer) >= LETTER_COMMIT_STREAK:
                    self._update_hold_and_maybe_commit(stable_letter)
            return

        with self.lock:
            assert self.legacy_model is not None and self.detector is not None
            processed = self.detector.find_hands(frame_bgr, draw=False)
            landmarks = self.detector.find_position(processed, draw=False)

            if not landmarks or len(landmarks) != 1:
                self._handle_detection_miss(0.0)
                return

            lm_list = landmarks[0][1]
            location_vector = np.array([coord for lm in lm_list for coord in lm[1:3]]).reshape(
                1, -1
            )
            probabilities = self.legacy_model.predict_proba(location_vector)
            max_prob = float(np.max(probabilities))

            if max_prob <= MIN_LETTER_DISPLAY_CONFIDENCE:
                self._handle_detection_miss(max_prob)
                return

            predicted_letter = str(self.legacy_model.predict(location_vector)[0])
            self.no_detection_frames = 0
            self.current_confidence = max_prob
            self.current_letter = predicted_letter
            if max_prob <= MIN_LETTER_COMMIT_CONFIDENCE:
                self.letter_buffer = []
                self.recent_letters.clear()
                self.hold_letter = ""
                self.hold_started_at = None
                return
            stable_letter = self._stable_letter(predicted_letter)
            self.current_letter = stable_letter or predicted_letter
            if not stable_letter:
                self.letter_buffer = []
                return
            if self.letter_buffer and self.letter_buffer[-1] == stable_letter:
                self.letter_buffer.append(stable_letter)
            else:
                self.letter_buffer = [stable_letter]
            if len(self.letter_buffer) >= LETTER_COMMIT_STREAK:
                self._update_hold_and_maybe_commit(stable_letter)


# Shared model + MediaPipe/TFLite engine (one process-wide instance). Per-user state lives in _sessions.
_session: Optional[DetectionSession] = None
_load_error: Optional[str] = None
_model_ready = threading.Event()
_sessions_lock = threading.Lock()


@dataclass
class SessionEntry:
    sess: DetectionSession
    last_seen: datetime
    in_flight: bool = False
    last_frame_at_mono: float = 0.0


_sessions: dict[str, SessionEntry] = {}
_SESSION_TTL_SECONDS = _env_int("SESSION_TIMEOUT_SECONDS", 15 * 60)
# Cap concurrent inference sessions (alias MAX_SESSIONS for ops docs).
_MAX_ACTIVE_SESSIONS = _env_int("MAX_ACTIVE_SESSIONS", _env_int("MAX_SESSIONS", 100))
_MIN_FRAME_INTERVAL_SECONDS = _env_float("MIN_FRAME_INTERVAL_SECONDS", 0.14)
_MAX_FRAME_BYTES = _env_int("MAX_FRAME_BYTES", 1_800_000)


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
        ok, msg = _vision_runtime_ok()
        if not ok:
            _load_error = msg
            SIGN_DETECTOR_KIND = "failed"
            add_log(f"Model load skipped: {msg}")
            return
        sess = _try_keypoint_session()
        if sess is not None:
            _session = sess
            SIGN_DETECTOR_KIND = "keypoint_tflite"
            add_log("Using TFLite keypoint classifier (supportbackend pipeline).")
        else:
            enable_legacy = os.getenv("ENABLE_SKLEARN_FALLBACK", "0").lower() in (
                "1",
                "true",
                "yes",
            )
            if not enable_legacy:
                raise RuntimeError(
                    "Sign model unavailable: keypoint ASL engine could not start "
                    "(install tensorflow for the TFLite runtime), and the sklearn "
                    "fallback is disabled. To enable the fallback, set "
                    "ENABLE_SKLEARN_FALLBACK=1 and install the legacy deps."
                )
            model = load_letter_model()
            _session = DetectionSession(model, None)
            SIGN_DETECTOR_KIND = "sklearn_legacy"
            add_log(
                "Using scikit-learn letter model (letter_model.joblib / hand_signals)."
            )
        add_log("Model ready — you can start a session from the UI.")
    except Exception as exc:
        _load_error = str(exc)
        SIGN_DETECTOR_KIND = "failed"
        add_log(f"Model load failed: {exc}")
    finally:
        _model_ready.set()


def _e2e_mock_model_install() -> None:
    """
    Smoke tests / CI: skip TensorFlow/MediaPipe import chain.
    Set KSL_E2E_MOCK=1 before importing this module (see tools/test_multisession_api.py).
    """
    global _session, _load_error, SIGN_DETECTOR_KIND

    class _MockKeypointEngine:
        def predict_frame(self, frame_bgr: object, frame_w: int, frame_h: int) -> tuple[str, float]:
            return "a", 0.95

    _load_error = None
    SIGN_DETECTOR_KIND = "e2e_mock"
    _session = DetectionSession(None, _MockKeypointEngine())
    add_log("KSL_E2E_MOCK=1 — mock keypoint engine (API session tests only).")
    _model_ready.set()


if os.getenv("KSL_E2E_MOCK", "").strip().lower() in ("1", "true", "yes"):
    _e2e_mock_model_install()
elif _RUNNING_ON_VERCEL:
    _load_error = (
        "Sign detection is disabled on Vercel because the required CV/ML "
        "dependencies exceed the 500MB serverless storage limit."
    )
    SIGN_DETECTOR_KIND = "failed"
    _model_ready.set()
else:
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


def _new_session_id() -> str:
    return uuid.uuid4().hex


def _get_session_id() -> str:
    sid = request.headers.get("X-Session-Id", "").strip()
    if not sid:
        sid = request.args.get("session_id", "").strip()
    if not sid:
        sid = (request.get_json(silent=True) or {}).get("session_id", "")
        sid = str(sid).strip()
    return sid


def _purge_expired_sessions() -> None:
    """Remove TTL-expired sessions. Must be called with _sessions_lock held."""
    now = datetime.now(timezone.utc)
    expired: list[str] = []
    for sid, entry in list(_sessions.items()):
        age = (now - entry.last_seen).total_seconds()
        if age >= _SESSION_TTL_SECONDS:
            expired.append(sid)
    for sid in expired:
        ent = _sessions.pop(sid, None)
        if ent is not None and ent.sess.active:
            ent.sess.stop(session_id=sid)


def _resume_session_hint_from_body() -> str:
    """
    Optional idempotency hint for POST /api/start ONLY (not from X-Session-Id).
    Prevents stray headers from pinning new starts to stale or foreign ids.
    """
    payload = request.get_json(silent=True) or {}
    for key in ("resume_session_id", "session_id"):
        sid = str(payload.get(key, "")).strip()
        if sid:
            return sid
    return ""


def _get_or_404_session() -> Tuple[Optional[DetectionSession], Optional[str], int]:
    """
    Returns (session, error_message, http_status).
    """
    sess, err, phase = _backend_state()
    if phase == "loading":
        return None, "Model is still loading.", 503
    if phase == "failed":
        return None, err or "Model failed to load.", 503
    assert sess is not None
    sid = _get_session_id()
    if not sid:
        return None, "Missing session_id. Call /api/start first.", 400
    with _sessions_lock:
        entry = _sessions.get(sid)
        if entry is None:
            return None, "Unknown or expired session_id. Call /api/start again.", 404
        entry.last_seen = datetime.now(timezone.utc)
        return entry.sess, None, 200


def _frame_gate_begin(sid: str) -> tuple[bool, str]:
    """
    Controls per-session frame concurrency and rate.
    Returns (accepted, reason) where reason is one of:
      - "ok"
      - "busy"      -> a previous frame is still being processed
      - "throttled" -> frames are arriving too quickly
      - "missing"   -> session expired/missing
    """
    now_mono = time.monotonic()
    with _sessions_lock:
        entry = _sessions.get(sid)
        if entry is None:
            return False, "missing"
        if entry.in_flight:
            return False, "busy"
        elapsed = now_mono - entry.last_frame_at_mono
        if elapsed < _MIN_FRAME_INTERVAL_SECONDS:
            return False, "throttled"
        entry.in_flight = True
        entry.last_seen = datetime.now(timezone.utc)
        return True, "ok"


def _frame_gate_end(sid: str) -> None:
    with _sessions_lock:
        entry = _sessions.get(sid)
        if entry is not None:
            entry.in_flight = False
            entry.last_frame_at_mono = time.monotonic()


def _cleanup_sessions_worker() -> None:
    while True:
        try:
            with _sessions_lock:
                before = len(_sessions)
                _purge_expired_sessions()
                removed = before - len(_sessions)
            if removed:
                add_log(f"Cleaned up {removed} idle sessions.")
        except Exception:
            # Cleanup is best-effort; never crash the server.
            pass
        finally:
            threading.Event().wait(60)


threading.Thread(target=_cleanup_sessions_worker, daemon=True, name="session-cleaner").start()


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
                    "status": "idle",
                    "mode": "letter",
                    "started_at": None,
                    "error": err,
                    "backend": "failed",
                    "sign_detector": SIGN_DETECTOR_KIND,
                }
            ),
            200,
        )
    # Backend ready; session is per-user (requires session_id).
    sid = _get_session_id()
    if not sid:
        return (
            jsonify(
                {
                    "status": "idle",
                    "mode": "letter",
                    "started_at": None,
                    "backend": "ready",
                    "sign_detector": SIGN_DETECTOR_KIND,
                    "needs_session": True,
                }
            ),
            200,
        )
    with _sessions_lock:
        entry = _sessions.get(sid)
    if entry is None:
        return (
            jsonify(
                {
                    "status": "idle",
                    "mode": "letter",
                    "started_at": None,
                    "backend": "ready",
                    "sign_detector": SIGN_DETECTOR_KIND,
                    "error": "Unknown or expired session_id. Start again.",
                }
            ),
            200,
        )
    s = entry.sess
    with s.lock:
        return (
            jsonify(
                {
                    "status": "running" if s.active else "idle",
                    "mode": s.mode,
                    "started_at": s.started_at.isoformat() if s.started_at else None,
                    "backend": "ready",
                    "sign_detector": SIGN_DETECTOR_KIND,
                }
            ),
            200,
        )


@app.get("/api/logs")
def get_admin_logs() -> tuple[str, int]:
    col = _logs_col()
    if col is None:
        return jsonify([]), 200
    items = [_admin_log_public(d) for d in col.find().sort("createdAt", -1).limit(500)]
    return jsonify(items), 200


@app.get("/api/pipeline-logs")
def get_logs() -> tuple[str, int]:
    return jsonify({"logs": list(logs)}), 200


@app.get("/api/users")
def users_list() -> tuple[str, int]:
    col = _users_col()
    if col is None:
        return jsonify([]), 200
    users = [_user_public(d) for d in col.find().sort("createdAt", -1)]
    return jsonify(users), 200


@app.post("/api/users/invite")
def users_invite() -> tuple[str, int]:
    col = _users_col()
    if col is None:
        return jsonify({"error": "DATABASE_URL is not configured."}), 503
    payload = request.get_json(silent=True) or {}
    name = str(payload.get("name", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    role = str(payload.get("role", "viewer")).strip().lower()
    if not name or not email:
        return jsonify({"error": "name and email are required"}), 400
    if role not in {"admin", "moderator", "viewer"}:
        role = "viewer"
    if col.find_one({"email": email}):
        return jsonify({"error": "User already exists"}), 409
    now = datetime.now(timezone.utc)
    doc = {
        "name": name,
        "firstName": name.split(" ", 1)[0],
        "lastName": name.split(" ", 1)[1] if " " in name else "",
        "email": email,
        "role": role,
        "status": "Invited",
        "createdAt": now,
        "profileCompleted": False,
    }
    result = col.insert_one(doc)
    saved = col.find_one({"_id": result.inserted_id}) or doc
    _record_admin_log("User Invite", "Completed", user=name, duration="0m 01s")
    return jsonify(_user_public(saved)), 201


@app.put("/api/users/<user_id>")
def users_update(user_id: str) -> tuple[str, int]:
    col = _users_col()
    if col is None:
        return jsonify({"error": "DATABASE_URL is not configured."}), 503
    payload = request.get_json(silent=True) or {}
    updates: dict[str, Any] = {}
    if "role" in payload:
        role = str(payload.get("role", "")).strip().lower()
        if role in {"admin", "moderator", "viewer"}:
            updates["role"] = role
    if "status" in payload:
        status = str(payload.get("status", "")).strip()
        if status in {"Active", "Invited", "Disabled"}:
            updates["status"] = status
    if not updates:
        return jsonify({"error": "No valid updates provided"}), 400
    from bson import ObjectId

    try:
        oid = ObjectId(user_id)
    except Exception:
        return jsonify({"error": "Invalid user id"}), 400
    col.update_one({"_id": oid}, {"$set": updates})
    saved = col.find_one({"_id": oid})
    if saved is None:
        return jsonify({"error": "User not found"}), 404
    _record_admin_log("User Update", "Completed", user=str(saved.get("name", "Unknown")), duration="0m 01s")
    return jsonify(_user_public(saved)), 200


@app.delete("/api/users/<user_id>")
def users_delete(user_id: str) -> tuple[str, int]:
    col = _users_col()
    if col is None:
        return jsonify({"error": "DATABASE_URL is not configured."}), 503
    from bson import ObjectId

    try:
        oid = ObjectId(user_id)
    except Exception:
        return jsonify({"error": "Invalid user id"}), 400
    existing = col.find_one({"_id": oid})
    if existing is None:
        return jsonify({"error": "User not found"}), 404
    col.delete_one({"_id": oid})
    _record_admin_log("User Delete", "Completed", user=str(existing.get("name", "Unknown")), duration="0m 01s")
    return jsonify({"ok": True}), 200


@app.get("/api/gestures")
def gestures_list() -> tuple[str, int]:
    col = _gestures_col()
    if col is None:
        return jsonify([]), 200
    items = [_gesture_public(d) for d in col.find().sort("updatedAt", -1)]
    return jsonify(items), 200


@app.post("/api/gestures")
def gestures_create() -> tuple[str, int]:
    col = _gestures_col()
    if col is None:
        return jsonify({"error": "DATABASE_URL is not configured."}), 503
    payload = request.get_json(silent=True) or {}
    name = str(payload.get("name", "")).strip()
    category = str(payload.get("category", "")).strip()
    difficulty = str(payload.get("difficulty", "Beginner")).strip()
    status = str(payload.get("status", "Active")).strip()
    if not name or not category:
        return jsonify({"error": "name and category are required"}), 400
    if difficulty not in {"Beginner", "Intermediate", "Advanced"}:
        difficulty = "Beginner"
    if status not in {"Active", "Draft", "Archived"}:
        status = "Active"
    now = datetime.now(timezone.utc)
    doc = {
        "name": name,
        "category": category,
        "difficulty": difficulty,
        "status": status,
        "updatedAt": now,
    }
    result = col.insert_one(doc)
    saved = col.find_one({"_id": result.inserted_id}) or doc
    _record_admin_log("Gesture Create", "Completed", user="admin", duration="0m 01s")
    return jsonify(_gesture_public(saved)), 201


@app.get("/api/reports/stats")
def reports_stats() -> tuple[str, int]:
    users_col = _users_col()
    logs_col = _logs_col()
    range_key = str(request.args.get("range", "30d"))
    if range_key == "7d":
        days = 7
    elif range_key == "90d":
        days = 90
    else:
        days = 30
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=days)

    active_users = 0
    if users_col is not None:
        active_users = users_col.count_documents({"status": {"$ne": "Disabled"}})

    logs: list[dict] = []
    if logs_col is not None:
        logs = list(logs_col.find({"createdAt": {"$gte": start}}).sort("createdAt", 1))
    total_interpretations = len(logs)
    completed = sum(1 for x in logs if str(x.get("status", "")).lower() == "completed")
    average_accuracy = 100.0 if total_interpretations == 0 else (completed / total_interpretations) * 100.0

    interpretations_data: list[dict[str, Any]] = []
    accuracy_data: list[dict[str, Any]] = []
    if total_interpretations > 0:
        by_day: dict[str, list[dict]] = {}
        for item in logs:
            created = item.get("createdAt")
            if isinstance(created, datetime):
                key = created.strftime("%Y-%m-%d")
            else:
                key = str(created)[:10]
            by_day.setdefault(key, []).append(item)
        for key in sorted(by_day.keys()):
            day_items = by_day[key]
            total = len(day_items)
            day_completed = sum(1 for d in day_items if str(d.get("status", "")).lower() == "completed")
            acc = 100.0 if total == 0 else (day_completed / total) * 100.0
            label = key[5:]
            interpretations_data.append({"label": label, "total": total})
            accuracy_data.append({"label": label, "accuracy": round(acc, 2)})

    return (
        jsonify(
            {
                "totalInterpretations": total_interpretations,
                "averageAccuracy": f"{average_accuracy:.1f}",
                "activeUsers": active_users,
                "interpretationsData": interpretations_data,
                "accuracyData": accuracy_data,
            }
        ),
        200,
    )


@app.get("/api/reports/recent-users")
def reports_recent_users() -> tuple[str, int]:
    col = _users_col()
    if col is None:
        return jsonify([]), 200
    docs = list(col.find().sort("createdAt", -1).limit(10))
    out = []
    for d in docs:
        created = d.get("createdAt")
        if isinstance(created, datetime):
            joined_label = created.strftime("%b %d, %Y")
        else:
            joined_label = str(created or "")
        first = str(d.get("firstName", "")).strip()
        last = str(d.get("lastName", "")).strip()
        name = f"{first} {last}".strip() or str(d.get("name", "Unknown")).strip()
        out.append(
            {
                "id": _doc_id(d),
                "name": name,
                "email": str(d.get("email", "")).strip().lower(),
                "role": str(d.get("role", "viewer")).strip().lower(),
                "joinedLabel": joined_label,
            }
        )
    return jsonify(out), 200


@app.post("/api/auth/signup")
def auth_signup() -> tuple[str, int]:
    col = _users_col()
    if col is None:
        return jsonify({"message": "DATABASE_URL is not configured."}), 503
    payload = request.get_json(silent=True) or {}
    first = str(payload.get("firstName", "")).strip()
    last = str(payload.get("lastName", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))
    if not first or not last or not email or len(password) < 6:
        return jsonify({"message": "Missing or invalid signup fields."}), 400
    if col.find_one({"email": email}):
        return jsonify({"message": "Email already registered."}), 409
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    doc = {
        "firstName": first,
        "lastName": last,
        "name": f"{first} {last}".strip(),
        "email": email,
        "passwordHash": generate_password_hash(password),
        "role": "viewer",
        "status": "Active",
        "profileCompleted": False,
        "authToken": token,
        "createdAt": now,
    }
    result = col.insert_one(doc)
    saved = col.find_one({"_id": result.inserted_id}) or doc
    _record_admin_log("Signup", "Completed", user=saved.get("name", "Unknown"), duration="0m 01s")
    return jsonify({"token": token, "user": _user_public(saved)}), 201


@app.post("/api/auth/login")
def auth_login() -> tuple[str, int]:
    col = _users_col()
    if col is None:
        return jsonify({"message": "DATABASE_URL is not configured."}), 503
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))
    if not email or not password:
        return jsonify({"message": "Email and password are required."}), 400
    user = col.find_one({"email": email})
    if user is None:
        return jsonify({"message": "Invalid credentials."}), 401
    if not check_password_hash(str(user.get("passwordHash", "")), password):
        return jsonify({"message": "Invalid credentials."}), 401
    token = secrets.token_urlsafe(32)
    col.update_one({"_id": user["_id"]}, {"$set": {"authToken": token}})
    user["authToken"] = token
    _record_admin_log("Login", "Completed", user=user.get("name", "Unknown"), duration="0m 01s")
    return jsonify({"token": token, "user": _user_public(user)}), 200


@app.post("/api/profile/complete")
def complete_profile() -> tuple[str, int]:
    col = _users_col()
    if col is None:
        return jsonify({"message": "DATABASE_URL is not configured."}), 503
    user = _extract_bearer_user()
    if user is None:
        return jsonify({"message": "Unauthorized."}), 401
    payload = request.get_json(silent=True) or {}
    updates = {
        "profileCompleted": True,
        "userType": str(payload.get("userType", "")).strip(),
        "purpose": str(payload.get("purpose", "")).strip(),
        "communicationMode": str(payload.get("communicationMode", "")).strip(),
        "institution": str(payload.get("institution", "")).strip(),
        "address": str(payload.get("address", "")).strip(),
        "additionalInfo": str(payload.get("additionalInfo", "")).strip(),
        "updatedAt": datetime.now(timezone.utc),
    }
    col.update_one({"_id": user["_id"]}, {"$set": updates})
    saved = col.find_one({"_id": user["_id"]}) or user
    _record_admin_log("Profile Complete", "Completed", user=saved.get("name", "Unknown"), duration="0m 01s")
    return jsonify({"ok": True, "user": _user_public(saved)}), 200


@app.get("/api/prediction")
def get_prediction() -> tuple[str, int]:
    sid = _get_session_id()
    if not sid:
        return (
            jsonify(
                {
                    "error": "Missing session_id. Send X-Session-Id header or ?session_id=.",
                }
            ),
            400,
        )
    sess, err_msg, code = _get_or_404_session()
    if sess is None:
        # Keep UI polling stable: return 200 with backend info, but include error.
        if code == 503 and err_msg == "Model is still loading.":
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
        if code == 503:
            return (
                jsonify(
                    {
                        "text": "",
                        "current_letter": "",
                        "confidence": 0.0,
                        "status": "idle",
                        "mode": "letter",
                        "backend": "failed",
                        "error": err_msg,
                    }
                ),
                200,
            )
        return (
            jsonify(
                {
                    "text": "",
                    "current_letter": "",
                    "confidence": 0.0,
                    "status": "idle",
                    "mode": "letter",
                    "backend": "ready",
                    "error": err_msg,
                }
            ),
            200,
        )
    with sess.lock:
        return (
            jsonify(
                {
                    "text": sess.detected_text,
                    "current_letter": sess.current_letter,
                    "confidence": sess.current_confidence,
                    "hold_progress": sess.hold_progress(),
                    "hold_seconds_required": AUTO_COMMIT_HOLD_SECONDS,
                    "status": "running" if sess.active else "idle",
                    "mode": sess.mode,
                    "backend": "ready",
                }
            ),
            200,
        )


@app.post("/api/clear")
def clear_prediction() -> tuple[str, int]:
    sess, err_msg, code = _get_or_404_session()
    if sess is None:
        return jsonify({"error": err_msg}), code
    sess.clear_text()
    return jsonify({"ok": True}), 200


@app.post("/api/commit-letter")
def commit_letter() -> tuple[str, int]:
    """Append the current detected letter to the transcript (manual, like tapping a key)."""
    sess, err_msg, code = _get_or_404_session()
    if sess is None:
        return jsonify({"error": err_msg}), code
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
        sess.last_committed_letter = ch
        sess.last_commit_at = datetime.now(timezone.utc)
        sess.letter_buffer = []
        text = sess.detected_text
    return jsonify({"ok": True, "text": text}), 200


@app.post("/api/commit-space")
def commit_space() -> tuple[str, int]:
    """Append a space to the transcript."""
    sess, err_msg, code = _get_or_404_session()
    if sess is None:
        return jsonify({"error": err_msg}), code
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
    # Do NOT read X-Session-Id here: apiFetch always sends it and would pin every
    # new browser to the same id. Only JSON body may resume an existing session.
    hint = _resume_session_hint_from_body()
    sid = hint or _new_session_id()

    with _sessions_lock:
        _purge_expired_sessions()
        # Idempotent start: same client resumes with resume_session_id in body.
        existing = _sessions.get(sid)
        if existing is not None and existing.sess.active:
            existing.last_seen = datetime.now(timezone.utc)
            return (
                jsonify(
                    {
                        "ok": True,
                        "mode": existing.sess.mode,
                        "session_id": sid,
                        "already_running": True,
                    }
                ),
                200,
            )
        if len(_sessions) >= _MAX_ACTIVE_SESSIONS:
            return (
                jsonify(
                    {
                        "error": (
                            "Server is busy. Too many active sessions right now. "
                            "Please retry in a few seconds."
                        )
                    }
                ),
                429,
            )

    # Create per-user session bound to the already-loaded model assets.
    # We clone a new DetectionSession that shares the underlying model/engine references.
    new_sess = DetectionSession(sess.legacy_model, sess.keypoint_engine)
    if not new_sess.start(mode, session_id=sid):
        # Defensive fallback, should not happen for fresh sessions.
        return jsonify({"ok": True, "mode": mode, "session_id": sid, "already_running": True}), 200
    with _sessions_lock:
        _sessions[sid] = SessionEntry(
            sess=new_sess,
            last_seen=datetime.now(timezone.utc),
            in_flight=False,
            last_frame_at_mono=0.0,
        )
    return jsonify({"ok": True, "mode": mode, "session_id": sid}), 200


@app.post("/api/stop")
def stop() -> tuple[str, int]:
    sess, err_msg, code = _get_or_404_session()
    if sess is None:
        # Stop should be idempotent for the UI.
        return jsonify({"ok": True, "was_running": False, "error": err_msg}), 200
    sid = _get_session_id()
    if sess.active:
        sess.stop(session_id=sid)
    if sid:
        with _sessions_lock:
            _sessions.pop(sid, None)
    return jsonify({"ok": True, "was_running": True}), 200


@app.post("/api/analyze-frame")
def analyze_frame() -> tuple[str, int]:
    if _RUNNING_ON_VERCEL:
        return (
            jsonify(
                {
                    "error": (
                        "Frame analysis is disabled on Vercel (serverless storage limit). "
                        "Deploy the ML backend to a container host."
                    )
                }
            ),
            501,
        )
    sid = _get_session_id()
    if not sid:
        return (
            jsonify(
                {
                    "error": "Missing session_id. Send X-Session-Id header, JSON session_id, or call /api/start first.",
                    "hint": "Include session_id in JSON body or X-Session-Id header.",
                }
            ),
            400,
        )

    data = request.get_json(silent=True)
    if data is None:
        return (
            jsonify(
                {
                    "error": "Invalid or empty JSON body. Expected {\"image\": \"data:image/jpeg;base64,...\", \"session_id\": \"...\"}.",
                }
            ),
            400,
        )

    frame_data = data.get("image")
    if frame_data is None:
        return (
            jsonify(
                {
                    "error": "Missing image field. Send a data URL string in JSON key \"image\" (e.g. data:image/jpeg;base64,...).",
                }
            ),
            400,
        )
    if not isinstance(frame_data, str):
        return (
            jsonify(
                {
                    "error": f"Invalid image type: expected string, got {type(frame_data).__name__}.",
                }
            ),
            400,
        )
    if "," not in frame_data:
        return (
            jsonify(
                {
                    "error": "Invalid image format: expected data URL with a comma (data:image/jpeg;base64,...).",
                }
            ),
            400,
        )

    sess, err_msg, code = _get_or_404_session()
    if sess is None:
        return jsonify({"error": err_msg}), code
    if not sess.active:
        return jsonify({"error": "Session is not running."}), 409

    accepted, reason = _frame_gate_begin(sid)
    if not accepted:
        if reason == "missing":
            return jsonify({"error": "Unknown or expired session_id. Call /api/start again."}), 404
        with sess.lock:
            return (
                jsonify(
                    {
                        "ok": True,
                        "skipped": True,
                        "skip_reason": reason,
                        "text": sess.detected_text,
                        "current_letter": sess.current_letter,
                        "confidence": sess.current_confidence,
                        "hold_progress": sess.hold_progress(),
                        "hold_seconds_required": AUTO_COMMIT_HOLD_SECONDS,
                    }
                ),
                200,
            )

    try:
        try:
            import numpy as np
            encoded = frame_data.split(",", 1)[1]
            binary = base64.b64decode(encoded)
            if len(binary) > _MAX_FRAME_BYTES:
                return (
                    jsonify(
                        {
                            "error": (
                                f"Frame too large ({len(binary)} bytes). "
                                "Reduce image resolution/quality."
                            )
                        }
                    ),
                    413,
                )
            # ascontiguousarray: some OpenCV builds reject ndarray views from frombuffer
            decoded = np.ascontiguousarray(
                np.frombuffer(binary, dtype=np.uint8), dtype=np.uint8
            )
        except Exception as exc:
            return (
                jsonify(
                    {
                        "error": "Invalid image encoding (base64 decode failed).",
                        "detail": str(exc),
                    }
                ),
                400,
            )

        import cv2

        frame = None
        try:
            if decoded.size:
                frame = cv2.imdecode(decoded, cv2.IMREAD_COLOR)
        except cv2.error:
            frame = None
        if frame is None:
            # Some Windows installs ship OpenCV wheels incompatible with NumPy buffers; Pillow decodes reliably.
            try:
                from io import BytesIO

                from PIL import Image

                im = Image.open(BytesIO(binary)).convert("RGB")
                rgb = np.asarray(im, dtype=np.uint8)
                # BGR for downstream cv2.flip / resize (avoid cv2.cvtColor when cv2/numpy ABI is broken)
                frame = rgb[:, :, ::-1].copy()
            except Exception as exc2:
                return (
                    jsonify(
                        {
                            "error": "Could not decode frame as image.",
                            "detail": str(exc2),
                        }
                    ),
                    400,
                )

        sess.process_frame(frame)
        with sess.lock:
            return (
                jsonify(
                    {
                        "ok": True,
                        "text": sess.detected_text,
                        "current_letter": sess.current_letter,
                        "confidence": sess.current_confidence,
                        "hold_progress": sess.hold_progress(),
                        "hold_seconds_required": AUTO_COMMIT_HOLD_SECONDS,
                    }
                ),
                200,
            )
    finally:
        _frame_gate_end(sid)


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
    # Hosted platforms (Render/Fly/etc.) require binding to 0.0.0.0 and the
    # platform-provided PORT environment variable.
    port_env = os.getenv("PORT")
    host = "0.0.0.0" if port_env else os.getenv("API_HOST", "0.0.0.0")
    port_raw = port_env or os.getenv("API_PORT", "5000")
    try:
        port = int(port_raw)
    except ValueError:
        port = 5000
    debug = os.getenv("API_DEBUG", "0") == "1"
    app.run(host=host, port=port, debug=debug, threaded=True, use_reloader=False)
