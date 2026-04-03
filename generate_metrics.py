"""
generate_metrics.py
───────────────────
Generates all evaluation metric images for the trained Kannada
Speech Emotion Recognition model.

Outputs saved to  metrics/
  ├── 01_dataset_distribution.png
  ├── 02_confusion_matrix_raw.png
  ├── 03_confusion_matrix_normalized.png
  ├── 04_per_class_metrics.png
  ├── 05_roc_curves.png
  ├── 06_precision_recall_curves.png
  └── 07_metrics_summary.png
"""

import os, random, glob
import numpy as np
import torch
import torch.nn as nn
import torchaudio
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.gridspec import GridSpec
from transformers import Wav2Vec2Processor, Wav2Vec2Model
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, f1_score, precision_score, recall_score,
    confusion_matrix, classification_report,
    roc_curve, auc,
    precision_recall_curve, average_precision_score,
)
from sklearn.preprocessing import label_binarize
from tqdm import tqdm

# ── Reproducibility ────────────────────────────────────────────────────────────
SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
torch.cuda.manual_seed_all(SEED)

# ── Config ─────────────────────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
DATA_DIR      = os.path.join(BASE_DIR, "processed_audio")
MODELS_DIR    = os.path.join(BASE_DIR, "models")
PROCESSOR_DIR = os.path.join(MODELS_DIR, "processor")
MODEL_PATH    = os.path.join(MODELS_DIR, "emotion_model.pt")
OUT_DIR       = os.path.join(BASE_DIR, "metrics")
os.makedirs(OUT_DIR, exist_ok=True)

LABEL2ID = {"angry": 0, "fear": 1, "happy": 2, "neutral": 3, "sad": 4}
ID2LABEL = {v: k for k, v in LABEL2ID.items()}
CLASSES  = [ID2LABEL[i] for i in range(5)]
NUM_CLASSES = 5

SAMPLE_RATE = 16000
MAX_LENGTH  = SAMPLE_RATE * 4   # 4 s
BATCH_SIZE  = 8
DROPOUT     = 0.3

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Device: {DEVICE}")

# Colour palette — one per class
PALETTE = ["#e74c3c", "#9b59b6", "#2ecc71", "#3498db", "#f39c12"]
CLASS_COLORS = {c: PALETTE[i] for i, c in enumerate(CLASSES)}


# ═══════════════════════════════════════════════════════════════════════════════
# Model definition  (must match train_emotion_model.py exactly)
# ═══════════════════════════════════════════════════════════════════════════════
class Wav2Vec2Classifier(nn.Module):
    def __init__(self, num_classes: int, dropout: float = 0.3):
        super().__init__()
        self.wav2vec2  = Wav2Vec2Model.from_pretrained("facebook/wav2vec2-base")
        hidden         = self.wav2vec2.config.hidden_size  # 768
        self.classifier = nn.Sequential(
            nn.Linear(hidden, 128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, num_classes),
        )

    def forward(self, input_values, attention_mask=None):
        outputs = self.wav2vec2(input_values, attention_mask=attention_mask)
        pooled  = outputs.last_hidden_state.mean(dim=1)
        return self.classifier(pooled)


# ═══════════════════════════════════════════════════════════════════════════════
# Dataset helpers
# ═══════════════════════════════════════════════════════════════════════════════
def build_file_list():
    files, labels = [], []
    for emotion, lid in LABEL2ID.items():
        wavs = glob.glob(os.path.join(DATA_DIR, emotion, "*.wav"))
        files.extend(wavs)
        labels.extend([lid] * len(wavs))
    return files, labels


def load_audio(path):
    waveform, sr = torchaudio.load(path)
    if sr != SAMPLE_RATE:
        waveform = torchaudio.functional.resample(waveform, sr, SAMPLE_RATE)
    if waveform.shape[0] > 1:
        waveform = waveform.mean(dim=0, keepdim=True)
    L = waveform.shape[-1]
    if L < MAX_LENGTH:
        waveform = torch.nn.functional.pad(waveform, (0, MAX_LENGTH - L))
    else:
        waveform = waveform[:, :MAX_LENGTH]
    return waveform.squeeze().numpy()


# ═══════════════════════════════════════════════════════════════════════════════
# Run inference on test set
# ═══════════════════════════════════════════════════════════════════════════════
def run_inference(model, processor, test_files, test_labels):
    model.eval()
    all_preds, all_probs, all_true = [], [], []

    for i in range(0, len(test_files), BATCH_SIZE):
        batch_files  = test_files[i : i + BATCH_SIZE]
        batch_labels = test_labels[i : i + BATCH_SIZE]

        audios = [load_audio(f) for f in batch_files]
        inputs = processor(
            audios,
            sampling_rate=SAMPLE_RATE,
            return_tensors="pt",
            padding=True,
            return_attention_mask=True,
        )
        input_values   = inputs.input_values.to(DEVICE)
        attention_mask = inputs.attention_mask.to(DEVICE)

        with torch.no_grad():
            logits = model(input_values, attention_mask=attention_mask)
        probs  = torch.softmax(logits, dim=1).cpu().numpy()
        preds  = probs.argmax(axis=1)

        all_preds.extend(preds.tolist())
        all_probs.extend(probs.tolist())
        all_true.extend(batch_labels)

        print(f"\r  Inference {min(i + BATCH_SIZE, len(test_files))}/{len(test_files)}", end="", flush=True)

    print()
    return np.array(all_true), np.array(all_preds), np.array(all_probs)


# ═══════════════════════════════════════════════════════════════════════════════
# Plotting helpers
# ═══════════════════════════════════════════════════════════════════════════════
STYLE = {
    "figure.facecolor": "#1a1a2e",
    "axes.facecolor":   "#16213e",
    "axes.edgecolor":   "#4a4a6a",
    "axes.labelcolor":  "#e0e0f0",
    "xtick.color":      "#c0c0d0",
    "ytick.color":      "#c0c0d0",
    "text.color":       "#e0e0f0",
    "grid.color":       "#2a2a4a",
    "grid.alpha":       0.5,
    "font.family":      "DejaVu Sans",
}

def apply_style():
    plt.rcParams.update(STYLE)


# ── 1. Dataset Distribution ───────────────────────────────────────────────────
def plot_distribution(all_labels):
    apply_style()
    counts = {c: all_labels.count(LABEL2ID[c]) for c in CLASSES}

    fig, ax = plt.subplots(figsize=(9, 5))
    bars = ax.bar(CLASSES, [counts[c] for c in CLASSES],
                  color=[CLASS_COLORS[c] for c in CLASSES],
                  width=0.6, edgecolor="#ffffff22", linewidth=0.8)

    for bar, cls in zip(bars, CLASSES):
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width() / 2, h + 5,
                str(int(h)), ha="center", va="bottom", fontsize=11, fontweight="bold")

    ax.set_title("Dataset Distribution by Emotion", fontsize=15, fontweight="bold", pad=14)
    ax.set_xlabel("Emotion Class", fontsize=12)
    ax.set_ylabel("Sample Count", fontsize=12)
    ax.set_ylim(0, max(counts.values()) * 1.18)
    ax.grid(axis="y", linestyle="--")
    ax.spines[["top", "right"]].set_visible(False)

    total = sum(counts.values())
    ax.text(0.98, 0.97, f"Total samples: {total}", transform=ax.transAxes,
            ha="right", va="top", fontsize=10, color="#aaaacc")

    fig.tight_layout()
    path = os.path.join(OUT_DIR, "01_dataset_distribution.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved: {path}")


# ── 2 & 3. Confusion Matrices ─────────────────────────────────────────────────
def plot_confusion_matrix(y_true, y_pred, normalize=False):
    apply_style()
    cm = confusion_matrix(y_true, y_pred)
    if normalize:
        cm_plot = cm.astype(float) / cm.sum(axis=1, keepdims=True) * 100
        fmt     = ".1f"
        suffix  = "%"
        title   = "Confusion Matrix  (Normalized, %)"
        fname   = "03_confusion_matrix_normalized.png"
        cmap    = "magma"
    else:
        cm_plot = cm
        fmt     = "d"
        suffix  = ""
        title   = "Confusion Matrix  (Raw Counts)"
        fname   = "02_confusion_matrix_raw.png"
        cmap    = "Blues"

    fig, ax = plt.subplots(figsize=(8, 6.5))
    im = ax.imshow(cm_plot, cmap=cmap, aspect="auto", vmin=0)
    cbar = fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    cbar.ax.yaxis.set_tick_params(color="#c0c0d0")
    plt.setp(cbar.ax.yaxis.get_ticklabels(), color="#c0c0d0")

    ax.set_xticks(range(NUM_CLASSES))
    ax.set_yticks(range(NUM_CLASSES))
    ax.set_xticklabels([c.capitalize() for c in CLASSES], fontsize=11)
    ax.set_yticklabels([c.capitalize() for c in CLASSES], fontsize=11)
    ax.set_xlabel("Predicted Label", fontsize=12, labelpad=8)
    ax.set_ylabel("True Label",      fontsize=12, labelpad=8)
    ax.set_title(title, fontsize=14, fontweight="bold", pad=12)

    thresh = cm_plot.max() / 2
    for i in range(NUM_CLASSES):
        for j in range(NUM_CLASSES):
            val  = cm_plot[i, j]
            text = f"{val:{fmt}}{suffix}"
            col  = "white" if val < thresh else "#111111"
            ax.text(j, i, text, ha="center", va="center",
                    fontsize=10, fontweight="bold", color=col)

    fig.tight_layout()
    path = os.path.join(OUT_DIR, fname)
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved: {path}")


# ── 4. Per-Class Metrics Bar Chart ────────────────────────────────────────────
def plot_per_class_metrics(y_true, y_pred):
    apply_style()
    precision = precision_score(y_true, y_pred, average=None, zero_division=0)
    recall    = recall_score(   y_true, y_pred, average=None, zero_division=0)
    f1        = f1_score(       y_true, y_pred, average=None, zero_division=0)

    x     = np.arange(NUM_CLASSES)
    width = 0.26

    fig, ax = plt.subplots(figsize=(11, 6))
    b1 = ax.bar(x - width, precision * 100, width, label="Precision",
                color="#3498db", edgecolor="#ffffff22")
    b2 = ax.bar(x,          recall    * 100, width, label="Recall",
                color="#2ecc71", edgecolor="#ffffff22")
    b3 = ax.bar(x + width,  f1        * 100, width, label="F1-Score",
                color="#e74c3c", edgecolor="#ffffff22")

    for bars in (b1, b2, b3):
        for bar in bars:
            h = bar.get_height()
            ax.text(bar.get_x() + bar.get_width() / 2, h + 0.5,
                    f"{h:.1f}", ha="center", va="bottom", fontsize=8, color="#ddddee")

    ax.set_xticks(x)
    ax.set_xticklabels([c.capitalize() for c in CLASSES], fontsize=11)
    ax.set_ylabel("Score (%)", fontsize=12)
    ax.set_title("Per-Class Precision / Recall / F1-Score", fontsize=14,
                 fontweight="bold", pad=12)
    ax.set_ylim(0, 115)
    ax.grid(axis="y", linestyle="--")
    ax.legend(fontsize=11, framealpha=0.3, loc="upper right")
    ax.spines[["top", "right"]].set_visible(False)

    # Weighted averages annotation
    wav_p = precision_score(y_true, y_pred, average="weighted", zero_division=0) * 100
    wav_r = recall_score(   y_true, y_pred, average="weighted", zero_division=0) * 100
    wav_f = f1_score(       y_true, y_pred, average="weighted", zero_division=0) * 100
    ax.text(0.01, 0.97,
            f"Weighted avg →  P: {wav_p:.1f}%  R: {wav_r:.1f}%  F1: {wav_f:.1f}%",
            transform=ax.transAxes, ha="left", va="top",
            fontsize=9, color="#aaaacc",
            bbox=dict(boxstyle="round,pad=0.3", fc="#0d0d1a", ec="#3a3a5a", alpha=0.8))

    fig.tight_layout()
    path = os.path.join(OUT_DIR, "04_per_class_metrics.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved: {path}")


# ── 5. ROC Curves (One-vs-Rest) ────────────────────────────────────────────────
def plot_roc_curves(y_true, y_probs):
    apply_style()
    y_bin = label_binarize(y_true, classes=list(range(NUM_CLASSES)))

    fig, ax = plt.subplots(figsize=(8, 6.5))
    ax.plot([0, 1], [0, 1], ":", color="#555577", linewidth=1.2, label="Random (AUC = 0.50)")

    for i, cls in enumerate(CLASSES):
        fpr, tpr, _ = roc_curve(y_bin[:, i], y_probs[:, i])
        roc_auc     = auc(fpr, tpr)
        ax.plot(fpr, tpr, color=PALETTE[i], linewidth=2,
                label=f"{cls.capitalize()}  (AUC = {roc_auc:.3f})")

    ax.set_xlabel("False Positive Rate", fontsize=12)
    ax.set_ylabel("True Positive Rate",  fontsize=12)
    ax.set_title("ROC Curves — One-vs-Rest per Class", fontsize=14,
                 fontweight="bold", pad=12)
    ax.legend(fontsize=10, framealpha=0.3, loc="lower right")
    ax.grid(linestyle="--")
    ax.spines[["top", "right"]].set_visible(False)

    fig.tight_layout()
    path = os.path.join(OUT_DIR, "05_roc_curves.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved: {path}")


# ── 6. Precision-Recall Curves ────────────────────────────────────────────────
def plot_pr_curves(y_true, y_probs):
    apply_style()
    y_bin = label_binarize(y_true, classes=list(range(NUM_CLASSES)))

    fig, ax = plt.subplots(figsize=(8, 6.5))

    for i, cls in enumerate(CLASSES):
        prec, rec, _ = precision_recall_curve(y_bin[:, i], y_probs[:, i])
        ap           = average_precision_score(y_bin[:, i], y_probs[:, i])
        ax.plot(rec, prec, color=PALETTE[i], linewidth=2,
                label=f"{cls.capitalize()}  (AP = {ap:.3f})")

    ax.set_xlabel("Recall",    fontsize=12)
    ax.set_ylabel("Precision", fontsize=12)
    ax.set_title("Precision-Recall Curves per Class", fontsize=14,
                 fontweight="bold", pad=12)
    ax.legend(fontsize=10, framealpha=0.3, loc="lower left")
    ax.grid(linestyle="--")
    ax.spines[["top", "right"]].set_visible(False)

    fig.tight_layout()
    path = os.path.join(OUT_DIR, "06_precision_recall_curves.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved: {path}")


# ── 7. Metrics Summary Card ───────────────────────────────────────────────────
def plot_summary(y_true, y_pred):
    apply_style()
    acc       = accuracy_score(y_true, y_pred) * 100
    f1_weighted = f1_score(y_true, y_pred, average="weighted", zero_division=0) * 100
    f1_macro    = f1_score(y_true, y_pred, average="macro",    zero_division=0) * 100
    prec_w      = precision_score(y_true, y_pred, average="weighted", zero_division=0) * 100
    rec_w       = recall_score(   y_true, y_pred, average="weighted", zero_division=0) * 100

    per_class_acc = []
    cm = confusion_matrix(y_true, y_pred)
    for i in range(NUM_CLASSES):
        row_sum = cm[i].sum()
        per_class_acc.append(cm[i, i] / row_sum * 100 if row_sum else 0)

    fig = plt.figure(figsize=(12, 7))
    fig.patch.set_facecolor("#1a1a2e")
    gs  = GridSpec(2, 2, figure=fig, hspace=0.45, wspace=0.35)

    # ─ top-left: overall gauges
    ax1 = fig.add_subplot(gs[0, 0])
    ax1.set_facecolor("#0d1030")
    metrics_text = [
        ("Overall Accuracy",    acc,        "#2ecc71"),
        ("Weighted F1",         f1_weighted,"#3498db"),
        ("Macro F1",            f1_macro,   "#9b59b6"),
        ("Weighted Precision",  prec_w,     "#e67e22"),
        ("Weighted Recall",     rec_w,      "#1abc9c"),
    ]
    ax1.set_xlim(0, 1)
    ax1.set_ylim(-0.5, len(metrics_text) - 0.5)
    ax1.axis("off")
    ax1.set_title("Overall Metrics", fontsize=12, fontweight="bold", pad=8)
    for row_i, (label, val, col) in enumerate(reversed(metrics_text)):
        y = row_i
        ax1.barh([y], [val / 100], color=col, alpha=0.3, height=0.55)
        ax1.text(0.01, y, label, va="center", fontsize=9, color="#ccccee")
        ax1.text(0.99, y, f"{val:.2f}%", va="center", ha="right",
                 fontsize=10, fontweight="bold", color=col)

    # ─ top-right: per-class accuracy radar / bar
    ax2 = fig.add_subplot(gs[0, 1])
    bars = ax2.barh(
        [c.capitalize() for c in CLASSES],
        per_class_acc,
        color=[CLASS_COLORS[c] for c in CLASSES],
        edgecolor="#ffffff11",
    )
    for bar, val in zip(bars, per_class_acc):
        ax2.text(min(val + 1, 98), bar.get_y() + bar.get_height() / 2,
                 f"{val:.1f}%", va="center", fontsize=9, fontweight="bold")
    ax2.set_xlim(0, 110)
    ax2.set_title("Per-Class Accuracy", fontsize=12, fontweight="bold", pad=8)
    ax2.set_xlabel("Accuracy (%)", fontsize=10)
    ax2.grid(axis="x", linestyle="--")
    ax2.spines[["top", "right"]].set_visible(False)

    # ─ bottom: classification report table
    ax3 = fig.add_subplot(gs[1, :])
    ax3.axis("off")
    ax3.set_title("Classification Report", fontsize=12, fontweight="bold", pad=8)

    prec_arr = precision_score(y_true, y_pred, average=None, zero_division=0)
    rec_arr  = recall_score(   y_true, y_pred, average=None, zero_division=0)
    f1_arr   = f1_score(       y_true, y_pred, average=None, zero_division=0)
    support  = np.bincount(np.array(y_true), minlength=NUM_CLASSES)

    col_labels = ["Class", "Precision", "Recall", "F1-Score", "Support"]
    table_data = [
        [c.capitalize(), f"{prec_arr[i]*100:.2f}%",
         f"{rec_arr[i]*100:.2f}%", f"{f1_arr[i]*100:.2f}%", str(support[i])]
        for i, c in enumerate(CLASSES)
    ]
    table_data.append(["──────", "──────", "──────", "──────", "──────"])
    table_data.append([
        "Weighted Avg",
        f"{prec_w:.2f}%", f"{rec_w:.2f}%", f"{f1_weighted:.2f}%",
        str(len(y_true))
    ])

    tbl = ax3.table(
        cellText=col_labels,
        cellLoc="center",
        loc="upper center",
        bbox=[0, 0, 1, 1],
    )
    tbl = ax3.table(
        cellText=table_data,
        colLabels=col_labels,
        cellLoc="center",
        loc="upper center",
        bbox=[0, 0, 1, 1],
    )
    tbl.auto_set_font_size(False)
    tbl.set_fontsize(10)
    for (row, col), cell in tbl.get_celld().items():
        cell.set_facecolor("#111133" if row % 2 == 0 else "#0d0d2a")
        cell.set_edgecolor("#3a3a5a")
        cell.set_text_props(color="#e0e0f0")
        if row == 0:
            cell.set_facecolor("#1a1a4a")
            cell.set_text_props(color="#ffffff", fontweight="bold")

    fig.suptitle("Kannada Speech Emotion Recognition — Model Metrics",
                 fontsize=15, fontweight="bold", y=1.01, color="#ffffff")

    path = os.path.join(OUT_DIR, "07_metrics_summary.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved: {path}")


# ═══════════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════════
def main():
    print("\n" + "═" * 60)
    print("  Kannada SER — Metrics Generator")
    print("═" * 60)

    # ── 1. Rebuild the same test split as training (same seed, same ratios)
    all_files, all_labels = [], []
    for emotion, lid in LABEL2ID.items():
        wavs = glob.glob(os.path.join(DATA_DIR, emotion, "*.wav"))
        all_files.extend(wavs)
        all_labels.extend([lid] * len(wavs))

    print(f"\nTotal samples in processed_audio: {len(all_files)}")
    for lid, lname in ID2LABEL.items():
        print(f"  {lname:<10} {all_labels.count(lid)}")

    # 80 / 10 / 10  stratified
    _, tmp_f, _, tmp_l = train_test_split(
        all_files, all_labels, test_size=0.20,
        stratify=all_labels, random_state=SEED
    )
    test_files, _, test_labels, _ = train_test_split(
        tmp_f, tmp_l, test_size=0.50,
        stratify=tmp_l, random_state=SEED
    )
    print(f"\nTest set size: {len(test_files)} samples")

    # ── 2. Plot 01: dataset distribution (whole dataset)
    print("\n[1/7] Dataset distribution ...")
    plot_distribution(all_labels)

    # ── 3. Load model
    print("\n[Model] Loading processor ...")
    processor = Wav2Vec2Processor.from_pretrained(PROCESSOR_DIR)

    print("[Model] Loading Wav2Vec2Classifier ...")
    model = Wav2Vec2Classifier(NUM_CLASSES, DROPOUT).to(DEVICE)
    state = torch.load(MODEL_PATH, map_location=DEVICE)
    model.load_state_dict(state)
    model.eval()
    print("[Model] Loaded OK")

    # ── 4. Inference on test set
    print(f"\n[Inference] Running on {len(test_files)} test samples ...")
    y_true, y_pred, y_probs = run_inference(model, processor, test_files, test_labels)
    print(f"  Test Accuracy : {accuracy_score(y_true, y_pred)*100:.2f}%")
    print(f"  Weighted F1   : {f1_score(y_true, y_pred, average='weighted')*100:.2f}%\n")

    # ── 5. Generate all plots
    print("[2/7] Confusion matrix (raw) ...")
    plot_confusion_matrix(y_true, y_pred, normalize=False)

    print("[3/7] Confusion matrix (normalized) ...")
    plot_confusion_matrix(y_true, y_pred, normalize=True)

    print("[4/7] Per-class precision / recall / F1 ...")
    plot_per_class_metrics(y_true, y_pred)

    print("[5/7] ROC curves ...")
    plot_roc_curves(y_true, y_probs)

    print("[6/7] Precision-Recall curves ...")
    plot_pr_curves(y_true, y_probs)

    print("[7/7] Metrics summary card ...")
    plot_summary(y_true, y_pred)

    print("\n" + "═" * 60)
    print(f"  All images saved to:  {OUT_DIR}")
    print("═" * 60 + "\n")


if __name__ == "__main__":
    main()
