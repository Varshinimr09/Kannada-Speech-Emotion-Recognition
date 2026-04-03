"""
Wav2Vec2-based Speech Emotion Recognition predictor.
Loads emotion_model.pt once at import time and exposes predict(audio_path).
"""

import os
import numpy as np
import torch
import torch.nn as nn
import torchaudio
import librosa

# ── Paths ─────────────────────────────────────────────────────────────────────
_BASE      = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_MODEL_PT  = os.path.join(_BASE, "models", "emotion_model.pt")
_PROC_DIR  = os.path.join(_BASE, "models", "processor")
_BACKBONE_DIR = os.path.join(_BASE, "models", "wav2vec2_base")
_HF_MODEL_ID  = "facebook/wav2vec2-base"

# ── Constants (must match training) ───────────────────────────────────────────
SAMPLE_RATE  = 16000
MAX_LENGTH   = SAMPLE_RATE * 4          # 4 seconds = 64 000 samples
NUM_CLASSES  = 5
ID2LABEL     = {0: "angry", 1: "fear", 2: "happy", 3: "neutral", 4: "sad"}

_DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ── Model definition (identical to training) ──────────────────────────────────
class _Wav2Vec2Classifier(nn.Module):
    def __init__(self, num_classes: int = NUM_CLASSES, dropout: float = 0.3):
        super().__init__()
        from transformers import Wav2Vec2Model
        # Backbone is stored locally after first bootstrap download.
        self.wav2vec2   = Wav2Vec2Model.from_pretrained(_BACKBONE_DIR, local_files_only=True)
        hidden          = self.wav2vec2.config.hidden_size            # 768
        self.classifier = nn.Sequential(
            nn.Linear(hidden, 128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, num_classes),
        )

    def forward(self, input_values, attention_mask=None):
        out    = self.wav2vec2(input_values, attention_mask=attention_mask)
        pooled = out.last_hidden_state.mean(dim=1)
        return self.classifier(pooled)


# ── Load once at module import ─────────────────────────────────────────────────
def _ensure_hf_assets_once() -> None:
    """
    Download HF assets once, save them inside project models/, then always reuse local files.
    No Hugging Face Inference API is used here.
    """
    from transformers import Wav2Vec2Model, Wav2Vec2Processor

    os.makedirs(_PROC_DIR, exist_ok=True)
    os.makedirs(_BACKBONE_DIR, exist_ok=True)

    proc_cfg = os.path.join(_PROC_DIR, "preprocessor_config.json")
    backbone_cfg = os.path.join(_BACKBONE_DIR, "config.json")

    if not os.path.exists(proc_cfg):
        print(f"[predictor] First run: downloading processor '{_HF_MODEL_ID}'...")
        processor = Wav2Vec2Processor.from_pretrained(_HF_MODEL_ID)
        processor.save_pretrained(_PROC_DIR)
        print(f"[predictor] Processor saved to {_PROC_DIR}")

    if not os.path.exists(backbone_cfg):
        print(f"[predictor] First run: downloading backbone '{_HF_MODEL_ID}'...")
        backbone = Wav2Vec2Model.from_pretrained(_HF_MODEL_ID)
        backbone.save_pretrained(_BACKBONE_DIR)
        print(f"[predictor] Backbone saved to {_BACKBONE_DIR}")


def _load_model():
    from transformers import Wav2Vec2Processor
    _ensure_hf_assets_once()
    print(f"[predictor] Loading processor from {_PROC_DIR}")
    processor = Wav2Vec2Processor.from_pretrained(_PROC_DIR, local_files_only=True)

    print(f"[predictor] Loading model weights from {_MODEL_PT}")
    model = _Wav2Vec2Classifier().to(_DEVICE)
    state = torch.load(_MODEL_PT, map_location=_DEVICE, weights_only=True)
    model.load_state_dict(state)
    model.eval()
    print(f"[predictor] Model ready on {_DEVICE}")
    return processor, model


try:
    _processor, _model = _load_model()
    _MODEL_OK = True
except Exception as _e:
    print(f"[predictor] WARNING: model failed to load — {_e}")
    _processor = _model = None
    _MODEL_OK  = False


# ── Feature extraction helpers ────────────────────────────────────────────────
def _extract_acoustic(audio_np: np.ndarray, sr: int) -> dict:
    """Extract MFCC, pitch, energy, intensity, ZCR, duration."""
    duration = round(len(audio_np) / sr, 2)

    mfcc      = librosa.feature.mfcc(y=audio_np, sr=sr, n_mfcc=13)
    mfcc_mean = float(np.mean(mfcc))

    # Pitch (fundamental frequency via pyin)
    f0, _, _ = librosa.pyin(audio_np, fmin=librosa.note_to_hz("C2"),
                             fmax=librosa.note_to_hz("C7"))
    pitch    = float(np.nanmean(f0)) if f0 is not None and np.any(~np.isnan(f0)) else 0.0

    # RMS energy
    rms      = librosa.feature.rms(y=audio_np)
    energy   = float(np.mean(rms))

    # Intensity in dB
    intensity = float(librosa.amplitude_to_db(np.array([[energy]]))[0][0])

    # Zero crossing rate
    zcr      = float(np.mean(librosa.feature.zero_crossing_rate(y=audio_np)))

    return {
        "mfcc":      round(mfcc_mean, 4),
        "pitch":     round(pitch, 2),
        "energy":    round(energy, 6),
        "intensity": round(intensity, 2),
        "zcr":       round(zcr, 6),
        "duration":  duration,
    }


# ── Public API ────────────────────────────────────────────────────────────────
def predict(audio_path: str) -> dict:
    """
    Run emotion inference on a WAV file.

    Returns:
        {
            "emotion":           str,          e.g. "happy"
            "confidence":        float,        0–100
            "probabilities":     list[dict],   [{emotion, probability}, ...]
            "acoustic_features": dict
        }

    Raises:
        RuntimeError  if model is not loaded
        ValueError    if audio is silence / too short
    """
    if not _MODEL_OK:
        raise RuntimeError("No model available. Please train and deploy a model first.")

    # 1. Load audio
    try:
        waveform, sr = torchaudio.load(audio_path)
    except Exception:
        # Fallback to librosa for exotic formats
        audio_np, sr = librosa.load(audio_path, sr=SAMPLE_RATE, mono=True)
        waveform = torch.from_numpy(audio_np).unsqueeze(0)

    # 2. Resample + mono
    if sr != SAMPLE_RATE:
        waveform = torchaudio.functional.resample(waveform, sr, SAMPLE_RATE)
        sr = SAMPLE_RATE
    if waveform.shape[0] > 1:
        waveform = waveform.mean(dim=0, keepdim=True)

    # 3. Keep real recorded duration for UI, then trim silence for modeling
    waveform_np = waveform.squeeze().numpy()
    recorded_duration = round(len(waveform_np) / SAMPLE_RATE, 2)
    trimmed, _ = librosa.effects.trim(waveform_np, top_db=25)

    # 4. Voice activity check — reject near-silence
    rms = float(np.sqrt(np.mean(trimmed ** 2)))
    if rms < 1e-4 or len(trimmed) < SAMPLE_RATE * 0.5:
        raise ValueError("Audio appears to be silence or too short (< 0.5s). "
                         "Please speak clearly into the microphone.")

    # Keep unpadded audio for feature extraction; use fixed length only for model input
    feature_audio = trimmed

    # 5. Pad / trim to 4 seconds for inference
    model_audio = trimmed
    if len(model_audio) < MAX_LENGTH:
        model_audio = np.pad(model_audio, (0, MAX_LENGTH - len(model_audio)))
    else:
        model_audio = model_audio[:MAX_LENGTH]

    # 6. Processor → input_values + attention_mask
    inputs = _processor(
        model_audio,
        sampling_rate=SAMPLE_RATE,
        return_tensors="pt",
        padding=True,
        return_attention_mask=True,
    )
    input_values   = inputs.input_values.to(_DEVICE)
    attention_mask = inputs.attention_mask.to(_DEVICE)

    # 7. Inference
    # Use autocast only on CUDA. On CPU, force float32 to avoid bf16 errors.
    with torch.no_grad():
        if _DEVICE.type == "cuda":
            with torch.amp.autocast(device_type="cuda", dtype=torch.float16):
                logits = _model(input_values, attention_mask=attention_mask)
        else:
            logits = _model(input_values.float(), attention_mask=attention_mask)

        # Always convert to float32 before numpy conversion
        probs = torch.softmax(logits.float(), dim=-1).squeeze().cpu().numpy()
        
    # 8. Build result
    pred_id    = int(np.argmax(probs))
    emotion    = ID2LABEL[pred_id]
    confidence = round(float(probs[pred_id]) * 100, 2)

    probabilities = [
        {"emotion": ID2LABEL[i], "probability": round(float(p) * 100, 2)}
        for i, p in enumerate(probs)
    ]

    acoustic = _extract_acoustic(feature_audio, SAMPLE_RATE)
    acoustic["duration"] = recorded_duration

    return {
        "emotion":           emotion,
        "confidence":        confidence,
        "probabilities":     probabilities,
        "acoustic_features": acoustic,
    }

