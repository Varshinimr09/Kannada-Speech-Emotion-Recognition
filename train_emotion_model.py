"""
train_emotion_model.py
Speech Emotion Recognition using Wav2Vec2 fine-tuning.
Trains on processed_audio/ and saves to models/
"""

import os
import random
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
import torchaudio
import torchaudio.transforms as T
from transformers import Wav2Vec2Processor, Wav2Vec2Model
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, f1_score, confusion_matrix, classification_report
)
from tqdm import tqdm
import glob

# ── Reproducibility ───────────────────────────────────────────────────────────
SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
torch.cuda.manual_seed_all(SEED)

# ── Config ────────────────────────────────────────────────────────────────────
BASE_DIR       = os.path.dirname(os.path.abspath(__file__))
DATA_DIR       = os.path.join(BASE_DIR, "processed_audio")
MODELS_DIR     = os.path.join(BASE_DIR, "models")
PROCESSOR_DIR  = os.path.join(MODELS_DIR, "processor")
MODEL_PATH     = os.path.join(MODELS_DIR, "emotion_model.pt")

LABEL2ID = {"angry": 0, "fear": 1, "happy": 2, "neutral": 3, "sad": 4}
ID2LABEL = {v: k for k, v in LABEL2ID.items()}
NUM_CLASSES   = 5

SAMPLE_RATE   = 16000
MAX_LENGTH    = SAMPLE_RATE * 4   # 4 seconds

BATCH_SIZE    = 8
FREEZE_EPOCHS = 3
TOTAL_EPOCHS  = 30          # extended for better convergence
LR_ENCODER    = 1e-5        # slow — pretrained weights
LR_CLASSIFIER = 3e-4        # fast — new head
WEIGHT_DECAY  = 0.01
GRAD_CLIP     = 1.0
DROPOUT       = 0.3

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {DEVICE}")
if DEVICE.type == "cuda":
    print(f"  GPU: {torch.cuda.get_device_name(0)}")
    print(f"  VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")

os.makedirs(MODELS_DIR, exist_ok=True)

# ── Build file list ───────────────────────────────────────────────────────────
def build_file_list():
    files, labels = [], []
    for emotion, label_id in LABEL2ID.items():
        folder = os.path.join(DATA_DIR, emotion)
        wavs = glob.glob(os.path.join(folder, "*.wav"))
        files.extend(wavs)
        labels.extend([label_id] * len(wavs))
    return files, labels


# ── Augmentation helpers ──────────────────────────────────────────────────────
def add_noise(waveform, snr_db=(10, 40)):
    snr    = random.uniform(*snr_db)
    sig_pw = waveform.pow(2).mean()
    if sig_pw < 1e-10:
        return waveform
    noise_pw = sig_pw / (10 ** (snr / 10))
    noise    = torch.randn_like(waveform) * noise_pw.sqrt()
    return waveform + noise

def random_gain(waveform, low=0.7, high=1.3):
    gain = random.uniform(low, high)
    return waveform * gain

def pitch_shift(waveform, sr, semitones=(-3, 3)):
    n = random.randint(*semitones)
    if n == 0:
        return waveform
    effects = [["pitch", str(n * 100)], ["rate", str(sr)]]
    try:
        shifted, _ = torchaudio.sox_effects.apply_effects_tensor(
            waveform, sr, effects, channels_first=True
        )
        return shifted
    except Exception:
        return waveform

def time_stretch(waveform, sr, rate_range=(0.85, 1.15)):
    rate = random.uniform(*rate_range)
    effects = [["tempo", f"{rate:.3f}"], ["rate", str(sr)]]
    try:
        stretched, _ = torchaudio.sox_effects.apply_effects_tensor(
            waveform, sr, effects, channels_first=True
        )
        return stretched
    except Exception:
        return waveform

def augment(waveform, sr):
    """Apply random augmentations (each with 50% chance)."""
    if random.random() < 0.5:
        waveform = add_noise(waveform)
    if random.random() < 0.5:
        waveform = random_gain(waveform)
    if random.random() < 0.4:
        waveform = pitch_shift(waveform, sr)
    if random.random() < 0.4:
        waveform = time_stretch(waveform, sr)
    return waveform


# ── Dataset ───────────────────────────────────────────────────────────────────
class EmotionDataset(Dataset):
    def __init__(self, files, labels, processor, augment_flag=False):
        self.files        = files
        self.labels       = labels
        self.processor    = processor
        self.augment_flag = augment_flag

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        path  = self.files[idx]
        label = self.labels[idx]

        waveform, sr = torchaudio.load(path)

        # Resample if needed
        if sr != SAMPLE_RATE:
            waveform = torchaudio.functional.resample(waveform, sr, SAMPLE_RATE)

        # Mono
        if waveform.shape[0] > 1:
            waveform = waveform.mean(dim=0, keepdim=True)

        # Augment (training only)
        if self.augment_flag:
            waveform = augment(waveform, SAMPLE_RATE)

        # Pad or trim to MAX_LENGTH
        length = waveform.shape[-1]
        if length < MAX_LENGTH:
            waveform = torch.nn.functional.pad(waveform, (0, MAX_LENGTH - length))
        else:
            waveform = waveform[:, :MAX_LENGTH]

        # Flatten to 1D numpy for processor
        audio_np = waveform.squeeze().numpy()

        inputs = self.processor(
            audio_np,
            sampling_rate=SAMPLE_RATE,
            return_tensors="pt",
            padding=True,
            return_attention_mask=True,
        )
        input_values   = inputs.input_values.squeeze(0)
        attention_mask = inputs.attention_mask.squeeze(0)

        return input_values, attention_mask, torch.tensor(label, dtype=torch.long)


def collate_fn(batch):
    input_values, attention_masks, labels = zip(*batch)
    max_len        = max(iv.shape[-1] for iv in input_values)
    padded_inputs  = torch.stack([
        torch.nn.functional.pad(iv, (0, max_len - iv.shape[-1]))
        for iv in input_values
    ])
    padded_masks   = torch.stack([
        torch.nn.functional.pad(am, (0, max_len - am.shape[-1]))
        for am in attention_masks
    ])
    return padded_inputs, padded_masks, torch.stack(labels)


# ── Model ─────────────────────────────────────────────────────────────────────
class Wav2Vec2Classifier(nn.Module):
    def __init__(self, num_classes: int, dropout: float = 0.3):
        super().__init__()
        self.wav2vec2 = Wav2Vec2Model.from_pretrained("facebook/wav2vec2-base")
        hidden = self.wav2vec2.config.hidden_size   # 768

        self.classifier = nn.Sequential(
            nn.Linear(hidden, 128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, num_classes),
        )

    def freeze_encoder(self):
        for param in self.wav2vec2.parameters():
            param.requires_grad = False

    def unfreeze_encoder(self):
        for param in self.wav2vec2.parameters():
            param.requires_grad = True

    def forward(self, input_values, attention_mask=None):
        outputs  = self.wav2vec2(input_values, attention_mask=attention_mask)
        # Mean pooling over time dimension
        hidden   = outputs.last_hidden_state          # (B, T, 768)
        pooled   = hidden.mean(dim=1)                  # (B, 768)
        logits   = self.classifier(pooled)             # (B, num_classes)
        return logits


# ── Train one epoch ───────────────────────────────────────────────────────────
def train_epoch(model, loader, optimizer, criterion, scaler):
    model.train()
    total_loss, correct, total = 0.0, 0, 0

    for input_values, attention_masks, labels in tqdm(loader, desc="  Train", leave=False):
        input_values   = input_values.to(DEVICE)
        attention_masks = attention_masks.to(DEVICE)
        labels         = labels.to(DEVICE)

        optimizer.zero_grad()
        with torch.amp.autocast(device_type="cuda"):
            logits = model(input_values, attention_mask=attention_masks)
            loss   = criterion(logits, labels)
        scaler.scale(loss).backward()
        scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(model.parameters(), GRAD_CLIP)
        scaler.step(optimizer)
        scaler.update()

        total_loss += loss.item() * labels.size(0)
        preds       = logits.argmax(dim=1)
        correct    += (preds == labels).sum().item()
        total      += labels.size(0)

    return total_loss / total, correct / total


# ── Evaluate ──────────────────────────────────────────────────────────────────
def evaluate(model, loader, criterion):
    model.eval()
    total_loss, all_preds, all_labels = 0.0, [], []

    with torch.no_grad():
        for input_values, attention_masks, labels in tqdm(loader, desc="  Eval ", leave=False):
            input_values    = input_values.to(DEVICE)
            attention_masks = attention_masks.to(DEVICE)
            labels          = labels.to(DEVICE)

            with torch.amp.autocast(device_type="cuda"):
                logits = model(input_values, attention_mask=attention_masks)
                loss   = criterion(logits, labels)

            total_loss += loss.item() * labels.size(0)
            preds       = logits.argmax(dim=1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    n    = len(all_labels)
    acc  = accuracy_score(all_labels, all_preds)
    f1   = f1_score(all_labels, all_preds, average="weighted")
    return total_loss / n, acc, f1, all_labels, all_preds


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    # 1. Build file list
    all_files, all_labels = build_file_list()
    print(f"\nTotal samples: {len(all_files)}")
    for eid, ename in ID2LABEL.items():
        print(f"  {ename:<10} {all_labels.count(eid)}")

    # 2. Stratified split  80 / 10 / 10
    train_f, tmp_f, train_l, tmp_l = train_test_split(
        all_files, all_labels, test_size=0.20,
        stratify=all_labels, random_state=SEED
    )
    val_f, test_f, val_l, test_l = train_test_split(
        tmp_f, tmp_l, test_size=0.50,
        stratify=tmp_l, random_state=SEED
    )
    print(f"\nSplit → train: {len(train_f)}  val: {len(val_f)}  test: {len(test_f)}")

    # 3. Load processor
    print("\nDownloading Wav2Vec2 processor ...")
    processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base")
    processor.save_pretrained(PROCESSOR_DIR)
    print(f"Processor saved → {PROCESSOR_DIR}")

    # 4. Datasets & loaders
    train_ds = EmotionDataset(train_f, train_l, processor, augment_flag=True)
    val_ds   = EmotionDataset(val_f,   val_l,   processor, augment_flag=False)
    test_ds  = EmotionDataset(test_f,  test_l,  processor, augment_flag=False)

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,
                              num_workers=0, collate_fn=collate_fn)
    val_loader   = DataLoader(val_ds,   batch_size=BATCH_SIZE, shuffle=False,
                              num_workers=0, collate_fn=collate_fn)
    test_loader  = DataLoader(test_ds,  batch_size=BATCH_SIZE, shuffle=False,
                              num_workers=0, collate_fn=collate_fn)

    # 5. Class weights to handle neutral imbalance
    label_counts = np.bincount(train_l, minlength=NUM_CLASSES).astype(float)
    class_weights = torch.tensor(
        label_counts.sum() / (NUM_CLASSES * label_counts), dtype=torch.float
    ).to(DEVICE)
    criterion = nn.CrossEntropyLoss(weight=class_weights)

    # 6. Model
    print("\nLoading Wav2Vec2 model ...")
    model = Wav2Vec2Classifier(NUM_CLASSES, DROPOUT).to(DEVICE)

    # Separate LRs: slow for pretrained encoder, fast for new classifier head
    optimizer = AdamW([
        {"params": model.wav2vec2.parameters(),  "lr": LR_ENCODER},
        {"params": model.classifier.parameters(), "lr": LR_CLASSIFIER},
    ], weight_decay=WEIGHT_DECAY)

    # Mixed precision scaler
    scaler = torch.amp.GradScaler()

    # 7. Training loop
    best_val_acc = 0.0
    print(f"\n{'═'*65}")
    print(f"  Training for {TOTAL_EPOCHS} epochs  (freeze encoder for first {FREEZE_EPOCHS})")
    print(f"  encoder_lr={LR_ENCODER}  classifier_lr={LR_CLASSIFIER}  mixed_precision=ON")
    print(f"{'═'*65}")

    for epoch in range(1, TOTAL_EPOCHS + 1):

        # Freeze / unfreeze strategy
        if epoch <= FREEZE_EPOCHS:
            model.freeze_encoder()
            phase = "frozen"
        elif epoch == FREEZE_EPOCHS + 1:
            model.unfreeze_encoder()
            phase = "unfrozen"
        else:
            phase = "unfrozen"

        train_loss, train_acc = train_epoch(model, train_loader, optimizer, criterion, scaler)
        val_loss,   val_acc, val_f1, _, _ = evaluate(model, val_loader, criterion)

        flag = " ★" if val_acc > best_val_acc else ""
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), MODEL_PATH)

        print(
            f"  Epoch {epoch:>2}/{TOTAL_EPOCHS}  [{phase}]"
            f"  train_loss={train_loss:.4f}  train_acc={train_acc:.4f}"
            f"  val_loss={val_loss:.4f}  val_acc={val_acc:.4f}"
            f"  val_f1={val_f1:.4f}{flag}",
            flush=True
        )

    # 8. Final test evaluation
    print(f"\n{'═'*65}")
    print("  Loading best model for test evaluation ...")
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))

    _, test_acc, test_f1, test_labels, test_preds = evaluate(
        model, test_loader, criterion
    )
    emotion_names = [ID2LABEL[i] for i in range(NUM_CLASSES)]

    print(f"\n  Test Accuracy : {test_acc:.4f} ({test_acc*100:.2f}%)")
    print(f"  Test F1 Score : {test_f1:.4f}")
    print(f"\n  Confusion Matrix (rows=actual, cols=predicted):")
    cm = confusion_matrix(test_labels, test_preds)
    header = "          " + "  ".join(f"{n:>7}" for n in emotion_names)
    print(header)
    for i, row in enumerate(cm):
        row_str = "  ".join(f"{v:>7}" for v in row)
        print(f"  {emotion_names[i]:<9} {row_str}")

    print(f"\n  Classification Report:")
    print(classification_report(test_labels, test_preds, target_names=emotion_names))
    print(f"\n  Model saved → {MODEL_PATH}")
    print(f"{'═'*65}")


if __name__ == "__main__":
    main()
