"""
prepare_dataset.py
Scans ravdess and kannada_emotion datasets, extracts emotion labels,
and saves a shuffled CSV index: dataset_index.csv
"""

import os
import glob
import random
import pandas as pd

# ── Paths (relative to this script's location) ──────────────────────────────
BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
RAVDESS_DIR  = os.path.join(BASE_DIR, "datasets", "ravdess")
KANNADA_DIR  = os.path.join(BASE_DIR, "datasets", "kannada_emotion")
OUTPUT_CSV   = os.path.join(BASE_DIR, "dataset_index.csv")

# ── Emotion mappings ─────────────────────────────────────────────────────────
# RAVDESS: emotion is the 3rd segment (index 2) in the 7-part filename
#   e.g.  03-01-05-01-02-02-12.wav  → '05' → angry
RAVDESS_EMOTION_MAP = {
    "01": "neutral",
    "03": "happy",
    "04": "sad",
    "05": "angry",
    "06": "fear",
}

# kannada_emotion: emotion is the 2nd segment (index 1) in the 3-part filename
#   e.g.  01-03-04.wav  → '03' → happy
KANNADA_EMOTION_MAP = {
    "01": "neutral",
    "03": "happy",
    "04": "sad",
    "05": "angry",
    "06": "fear",
}

# ── Collect RAVDESS files ────────────────────────────────────────────────────
records = []

ravdess_files = glob.glob(os.path.join(RAVDESS_DIR, "**", "*.wav"), recursive=True)
print(f"[RAVDESS] Found {len(ravdess_files)} .wav files")

for path in ravdess_files:
    name   = os.path.splitext(os.path.basename(path))[0]
    parts  = name.split("-")
    if len(parts) < 7:
        continue                           # not a valid RAVDESS filename
    code = parts[2]                        # 3rd segment = emotion
    emotion = RAVDESS_EMOTION_MAP.get(code)
    if emotion is None:
        continue                           # ignore calm, disgust, surprised, etc.
    records.append({"file_path": path, "emotion": emotion})

# ── Collect kannada_emotion files ────────────────────────────────────────────
kannada_files = glob.glob(os.path.join(KANNADA_DIR, "*.wav"))
print(f"[kannada_emotion] Found {len(kannada_files)} .wav files")

for path in kannada_files:
    name   = os.path.splitext(os.path.basename(path))[0]
    parts  = name.split("-")
    if len(parts) < 2:
        continue
    code = parts[1]                        # 2nd segment = emotion
    emotion = KANNADA_EMOTION_MAP.get(code)
    if emotion is None:
        continue
    records.append({"file_path": path, "emotion": emotion})

# ── Build DataFrame, shuffle, save ──────────────────────────────────────────
df = pd.DataFrame(records, columns=["file_path", "emotion"])
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

print(f"\nTotal samples after filtering: {len(df)}")
print("\nSamples per emotion class:")
print(df["emotion"].value_counts().to_string())

df.to_csv(OUTPUT_CSV, index=False)
print(f"\nSaved → {OUTPUT_CSV}")
