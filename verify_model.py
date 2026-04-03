"""
Model verification — tests N random samples per emotion directly
via the predictor (no API overhead) and prints a confusion matrix.
"""
import sys, random, glob, json
sys.path.insert(0, "backend")

from ml.predictor import predict

EMOTIONS    = ["angry", "fear", "happy", "neutral", "sad"]
N_PER_CLASS = 30          # samples to test per emotion
SEED        = 42

random.seed(SEED)

# ── Collect random samples ────────────────────────────────────────────────────
samples = []   # list of (true_label, file_path)
for emotion in EMOTIONS:
    files = glob.glob(f"processed_audio/{emotion}/*.wav")
    if not files:
        print(f"[WARN] No files found for '{emotion}'")
        continue
    picked = random.sample(files, min(N_PER_CLASS, len(files)))
    for f in picked:
        samples.append((emotion, f))

total = len(samples)
print(f"\nVerifying {total} samples ({N_PER_CLASS} per class, seed={SEED}) ...\n")

# ── Run predictions ────────────────────────────────────────────────────────────
# confusion[true][predicted] = count
confusion = {e: {p: 0 for p in EMOTIONS} for e in EMOTIONS}
errors     = []

for i, (true_label, path) in enumerate(samples, 1):
    print(f"\r  {i}/{total}", end="", flush=True)
    try:
        result    = predict(path)
        pred      = result["emotion"]
        conf      = result["confidence"]
        confusion[true_label][pred] += 1
        if pred != true_label:
            errors.append((true_label, pred, conf, path.split("\\")[-1]))
    except Exception as exc:
        errors.append((true_label, "ERROR", 0, f"{path} → {exc}"))

print(f"\r  Done!{' '*20}\n")

# ── Per-class accuracy ─────────────────────────────────────────────────────────
print("=" * 65)
print("  PER-CLASS ACCURACY")
print("=" * 65)
correct_total = 0
for e in EMOTIONS:
    row     = confusion[e]
    n       = sum(row.values())
    correct = row.get(e, 0)
    acc     = correct / n * 100 if n else 0
    bar     = "█" * int(acc / 5)
    correct_total += correct
    print(f"  {e:<8}  {correct:2d}/{n:2d}  {acc:5.1f}%  {bar}")

overall = correct_total / total * 100
print("=" * 65)
print(f"  OVERALL    {correct_total}/{total}  {overall:.1f}%")
print()

# ── Confusion matrix ──────────────────────────────────────────────────────────
print("=" * 65)
print("  CONFUSION MATRIX  (rows = actual, cols = predicted)")
print("=" * 65)

col_w = 8
header = f"  {'':8s}" + "".join(f"{e:>{col_w}}" for e in EMOTIONS)
print(header)
print("  " + "─" * (8 + col_w * len(EMOTIONS)))
for true_e in EMOTIONS:
    row_str = f"  {true_e:<8}"
    for pred_e in EMOTIONS:
        count = confusion[true_e][pred_e]
        cell  = str(count) if count else "."
        # Highlight diagonal (correct predictions)
        row_str += f"{cell:>{col_w}}"
    total_row = sum(confusion[true_e].values())
    row_str += f"  | n={total_row}"
    print(row_str)
print()

# ── Misclassifications ────────────────────────────────────────────────────────
if errors:
    print("=" * 65)
    print(f"  MISCLASSIFICATIONS ({len(errors)} total)")
    print("=" * 65)
    for true_e, pred_e, conf, fname in errors[:20]:   # show at most 20
        print(f"  {true_e:<8} -> {pred_e:<8}  ({conf:.1f}%)  {fname}")
    if len(errors) > 20:
        print(f"  ... and {len(errors)-20} more")

print()
