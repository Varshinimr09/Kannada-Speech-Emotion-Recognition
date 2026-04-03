"""
preprocess_audio.py
Loads every file listed in dataset_index.csv, normalises it to
16 kHz mono / 4 s, and saves it under processed_audio/<emotion>/.
"""

import os
import numpy as np
import pandas as pd
import librosa
import soundfile as sf
from tqdm import tqdm

# ── Config ───────────────────────────────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
INPUT_CSV    = os.path.join(BASE_DIR, "dataset_index.csv")
OUTPUT_DIR   = os.path.join(BASE_DIR, "processed_audio")
SAMPLE_RATE  = 16000
DURATION_SEC = 4
TARGET_LEN   = SAMPLE_RATE * DURATION_SEC   # 64 000 samples
EMOTIONS     = ["sad", "fear", "happy", "angry", "neutral"]

# ── Create output folders ─────────────────────────────────────────────────────
for emotion in EMOTIONS:
    os.makedirs(os.path.join(OUTPUT_DIR, emotion), exist_ok=True)

# ── Load index ────────────────────────────────────────────────────────────────
df = pd.read_csv(INPUT_CSV)
print(f"Loaded {len(df)} rows from {INPUT_CSV}\n")

# ── Process ───────────────────────────────────────────────────────────────────
stats   = {e: 0 for e in EMOTIONS}
skipped = 0

for _, row in tqdm(df.iterrows(), total=len(df), desc="Processing"):
    file_path = row["file_path"]
    emotion   = row["emotion"]

    if emotion not in EMOTIONS:
        skipped += 1
        continue

    if not os.path.isfile(file_path):
        print(f"\n  [SKIP] File not found: {file_path}")
        skipped += 1
        continue

    try:
        # 1. Load + resample to 16 kHz mono
        audio, _ = librosa.load(file_path, sr=SAMPLE_RATE, mono=True)

        # 2. Trim leading/trailing silence (top_db=25 keeps quiet speech)
        audio, _ = librosa.effects.trim(audio, top_db=25)

        # 3. Pad or truncate to exactly TARGET_LEN samples
        if len(audio) < TARGET_LEN:
            pad = TARGET_LEN - len(audio)
            audio = np.pad(audio, (0, pad), mode="constant")
        else:
            audio = audio[:TARGET_LEN]

        # 4. Build output path
        orig_name  = os.path.basename(file_path)          # e.g. 03-01-05-01-02-02-12.wav
        out_name   = f"{emotion}_{orig_name}"              # e.g. angry_03-01-05-...wav
        out_path   = os.path.join(OUTPUT_DIR, emotion, out_name)

        # 5. Save as 16-bit PCM WAV
        sf.write(out_path, audio, SAMPLE_RATE, subtype="PCM_16")
        stats[emotion] += 1

    except Exception as exc:
        print(f"\n  [ERROR] {file_path}: {exc}")
        skipped += 1

# ── Summary ───────────────────────────────────────────────────────────────────
total = sum(stats.values())
print(f"\n{'─'*40}")
print(f"  Total processed : {total}")
print(f"  Skipped / errors: {skipped}")
print(f"{'─'*40}")
print("  Samples per emotion:")
for emotion, count in stats.items():
    print(f"    {emotion:<10} {count}")
print(f"{'─'*40}")
print(f"\nSaved to → {OUTPUT_DIR}")
