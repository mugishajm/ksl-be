"""
ASL letter recognition using the same pipeline as supportbackend:
MediaPipe Hands → wrist-relative normalized landmarks → TFLite keypoint classifier.

Based on: supportbackend/American-Sign-Language-Detection (app.py + keypoint_classifier).

Runtime: prefers `tensorflow` (broad wheel support); uses `tflite_runtime` if TF is absent.
"""

from __future__ import annotations

import copy
import csv
import itertools
from pathlib import Path
from typing import Any, List, Tuple

import cv2
import mediapipe as mp
import numpy as np

try:
    import tflite_runtime.interpreter as tflite_rt  # type: ignore[import-untyped]
except ImportError:  # pragma: no cover
    tflite_rt = None

try:
    import tensorflow as tf
except ImportError:  # pragma: no cover
    tf = None


def _solutions_module():
    """
    MediaPipe package layouts differ by build:
    - classic: mediapipe.solutions (via mp.solutions)
    - some newer/minimal wheels: mediapipe.python.solutions only
    """
    sol = getattr(mp, "solutions", None)
    if sol is not None:
        return sol
    try:
        import mediapipe.python.solutions as mp_solutions  # type: ignore
    except Exception as exc:
        raise RuntimeError(
            "MediaPipe solutions API is unavailable in this environment."
        ) from exc
    return mp_solutions


def _asl_bundle_root(repo_root: Path) -> Path:
    return repo_root / "supportbackend" / "American-Sign-Language-Detection"


def asl_keypoint_assets_exist(repo_root: Path) -> bool:
    base = _asl_bundle_root(repo_root)
    tflite = base / "model" / "keypoint_classifier" / "keypoint_classifier.tflite"
    labels = base / "model" / "keypoint_classifier" / "keypoint_classifier_label.csv"
    return tflite.is_file() and labels.is_file()


def calc_landmark_list(
    image: np.ndarray, landmarks: object
) -> List[List[int]]:
    image_width, image_height = image.shape[1], image.shape[0]
    landmark_point: List[List[int]] = []
    for _, landmark in enumerate(landmarks.landmark):
        lx = min(int(landmark.x * image_width), image_width - 1)
        ly = min(int(landmark.y * image_height), image_height - 1)
        landmark_point.append([lx, ly])
    return landmark_point


def pre_process_landmark(landmark_list: List[List[int]]) -> List[float]:
    temp = copy.deepcopy(landmark_list)
    base_x, base_y = 0, 0
    for index, landmark_point in enumerate(temp):
        if index == 0:
            base_x, base_y = landmark_point[0], landmark_point[1]
        temp[index][0] = temp[index][0] - base_x
        temp[index][1] = temp[index][1] - base_y
    flat = list(itertools.chain.from_iterable(temp))
    max_value = max(list(map(abs, flat)), default=0.0)
    if max_value < 1e-9:
        return [0.0] * len(flat)
    return [n / max_value for n in flat]


def load_keypoint_labels(labels_path: Path) -> List[str]:
    with open(labels_path, encoding="utf-8-sig") as f:
        return [row[0].strip() for row in csv.reader(f) if row and row[0].strip()]


def _make_interpreter(model_path: Path) -> Tuple[Any, str]:
    """Returns (interpreter, implementation name for logging)."""
    path_str = str(model_path)
    # Prefer TensorFlow first — tflite-runtime often has no wheel for newer Python versions.
    if tf is not None:
        interp = tf.lite.Interpreter(model_path=path_str, num_threads=1)
        return interp, "tensorflow"
    if tflite_rt is not None:
        interp = tflite_rt.Interpreter(model_path=path_str, num_threads=1)
        return interp, "tflite_runtime"
    raise RuntimeError(
        "Install tensorflow or tflite-runtime to load the keypoint ASL model "
        "(pip install tensorflow)"
    )


class KeypointAslEngine:
    """TFLite keypoint classifier + MediaPipe (matches supportbackend app.py)."""

    def __init__(self, repo_root: Path) -> None:
        self._base = _asl_bundle_root(repo_root)
        tflite_path = self._base / "model" / "keypoint_classifier" / "keypoint_classifier.tflite"
        labels_path = self._base / "model" / "keypoint_classifier" / "keypoint_classifier_label.csv"

        self._labels = load_keypoint_labels(labels_path)
        self._interpreter, self.runtime_name = _make_interpreter(tflite_path)
        self._interpreter.allocate_tensors()
        self._in_idx = self._interpreter.get_input_details()[0]["index"]
        self._out_idx = self._interpreter.get_output_details()[0]["index"]

        solutions = _solutions_module()
        self._hands = solutions.hands.Hands(
            static_image_mode=True,
            max_num_hands=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5,
        )

    def predict_frame(
        self,
        frame_bgr: np.ndarray,
        frame_w: int,
        frame_h: int,
    ) -> Tuple[str, float]:
        """
        frame_bgr: already flipped + resized to (frame_w, frame_h).
        Returns (letter_lowercase, confidence in [0,1]).
        """
        image_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        image_rgb.flags.writeable = False
        results = self._hands.process(image_rgb)
        image_rgb.flags.writeable = True

        if not results.multi_hand_landmarks:
            return "", 0.0

        hand_landmarks = results.multi_hand_landmarks[0]
        landmark_list = calc_landmark_list(frame_bgr, hand_landmarks)
        processed = pre_process_landmark(landmark_list)
        if len(processed) != 42:
            return "", 0.0

        inp = np.array([processed], dtype=np.float32)
        self._interpreter.set_tensor(self._in_idx, inp)
        self._interpreter.invoke()
        out = np.squeeze(self._interpreter.get_tensor(self._out_idx))

        if out.ndim == 0:
            return "", 0.0
        idx = int(np.argmax(out))
        conf = float(np.max(out))
        if not (0 <= idx < len(self._labels)):
            return "", conf
        letter = self._labels[idx].lower()
        return letter, conf
