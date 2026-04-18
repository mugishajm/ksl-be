from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import mediapipe as mp
import pandas as pd


INFERENCE_W = 640
INFERENCE_H = 480

# Extra samples for commonly confused handshapes.
CONFUSION_BOOST_LETTERS = {"m", "n", "t", "u", "v", "r", "s", "a", "e"}


def _solutions_module():
    sol = getattr(mp, "solutions", None)
    if sol is not None:
        return sol
    import mediapipe.python.solutions as mp_solutions  # type: ignore

    return mp_solutions


def _iter_letter_dirs(dataset_root: Path):
    for child in sorted(dataset_root.iterdir()):
        if not child.is_dir():
            continue
        name = child.name.strip().lower()
        # Keep only single-letter classes for the current letter recognizer.
        if len(name) == 1 and "a" <= name <= "z":
            yield child, name


def _extract_row(hands, image_path: Path):
    image = cv2.imread(str(image_path))
    if image is None:
        return None
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    result = hands.process(rgb)
    if not result.multi_hand_landmarks:
        return None
    lm = result.multi_hand_landmarks[0].landmark
    row = []
    for p in lm:
        row.extend([p.x * INFERENCE_W, p.y * INFERENCE_H])
    return row


def _image_paths(letter_dir: Path) -> list[Path]:
    paths = [
        *letter_dir.glob("*.jpg"),
        *letter_dir.glob("*.jpeg"),
        *letter_dir.glob("*.png"),
    ]
    return sorted(paths)


def _sample_paths(paths: list[Path], target: int) -> list[Path]:
    if target <= 0 or len(paths) <= target:
        return paths
    # Spread selection across folder instead of taking first N only.
    step = len(paths) / float(target)
    out = []
    i = 0.0
    while len(out) < target and int(i) < len(paths):
        out.append(paths[int(i)])
        i += step
    return out


def build_landmark_csv(
    dataset_root: Path,
    output_csv: Path,
    max_per_letter: int,
    confusion_boost: int,
) -> None:
    mp_hands = _solutions_module().hands
    rows: list[list[float | str]] = []

    with mp_hands.Hands(
        static_image_mode=True,
        max_num_hands=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as hands:
        for letter_dir, letter in _iter_letter_dirs(dataset_root):
            accepted = 0
            all_paths = _image_paths(letter_dir)
            target = max_per_letter
            if letter in CONFUSION_BOOST_LETTERS:
                target = max_per_letter + confusion_boost
            selected_paths = _sample_paths(all_paths, target)
            checked = len(selected_paths)
            print(f"Processing {letter}: {checked} selected images...", flush=True)
            for image_path in selected_paths:
                row = _extract_row(hands, image_path)
                if row is None:
                    continue
                rows.append([*row, letter])
                accepted += 1
            print(
                f"{letter}: kept {accepted} / {checked} images "
                f"(target {target if target > 0 else 'all'})",
                flush=True,
            )

    cols = []
    for i in range(21):
        cols.extend([f"{i}x", f"{i}y"])
    cols.append("letter")

    out_df = pd.DataFrame(rows, columns=cols)
    output_csv.parent.mkdir(parents=True, exist_ok=True)
    out_df.to_csv(output_csv, index=False)
    print(f"Saved {len(out_df)} rows -> {output_csv}", flush=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert ksldata ASL image folders into landmark CSV for backend training."
    )
    parser.add_argument(
        "--dataset-root",
        default="ksldata/asl_alphabet_train_50",
        help="Path containing A-Z image subfolders.",
    )
    parser.add_argument(
        "--output",
        default="hand_signals_ksldata.csv",
        help="Output CSV path.",
    )
    parser.add_argument(
        "--max-per-letter",
        type=int,
        default=300,
        help="Max accepted images per letter (0 = no limit).",
    )
    parser.add_argument(
        "--confusion-boost",
        type=int,
        default=120,
        help="Extra target samples for confusion-prone letters (m,n,t,u,v,r,s,a,e).",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    build_landmark_csv(
        dataset_root=Path(args.dataset_root).resolve(),
        output_csv=Path(args.output).resolve(),
        max_per_letter=args.max_per_letter,
        confusion_boost=args.confusion_boost,
    )
