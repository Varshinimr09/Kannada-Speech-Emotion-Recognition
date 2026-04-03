"""
Local speech emotion recognition using a second Wav2Vec2 model for comparison.
Uses superb/wav2vec2-base-superb-er — trained on IEMOCAP, runs on CPU so it
doesn't compete with the main model's GPU memory.

The model is downloaded once (~94 MB) and cached in HuggingFace's model hub.
No API keys or internet connection needed after first run.
"""
import threading

# Lazy-load the pipeline so the Flask app starts instantly
_pipeline = None
_pipeline_lock = threading.Lock()

# superb/wav2vec2-base-superb-er labels and their mapping to our 5 classes
_LABEL_MAP = {
    # SUPERB ER task labels
    "ang": "angry",
    "angry": "angry",
    "anger": "angry",
    "hap": "happy",
    "happy": "happy",
    "happiness": "happy",
    "exc": "happy",        # excited → happy
    "neu": "neutral",
    "neutral": "neutral",
    "calm": "neutral",
    "sad": "sad",
    "sadness": "sad",
    "dis": "neutral",      # disgust → neutral
    "disgust": "neutral",
    "fea": "fear",
    "fear": "fear",
    "fearful": "fear",
    "sur": "neutral",      # surprise → neutral
    "surprise": "neutral",
    "surprised": "neutral",
}

_MODEL_ID = "superb/wav2vec2-base-superb-er"


def _get_pipeline():
    global _pipeline
    if _pipeline is None:
        with _pipeline_lock:
            if _pipeline is None:
                from transformers import pipeline
                _pipeline = pipeline(
                    "audio-classification",
                    model=_MODEL_ID,
                    device=-1,          # CPU — keeps GPU free for the main model
                    top_k=None,
                )
    return _pipeline


def analyze_audio_emotion(wav_path: str) -> dict:
    """
    Run WAV audio through the local SUPERB Wav2Vec2 emotion classifier.
    Analyzes vocal tone/prosody — not the words being spoken.
    Returns {"emotion": str, "confidence": float (0–100), "probabilities": list}
    """
    import librosa

    pipe = _get_pipeline()

    # Load and resample to 16 kHz (the model's expected sample rate)
    audio, _sr = librosa.load(wav_path, sr=16_000, mono=True)

    results = pipe({"array": audio, "sampling_rate": 16_000})
    # results = [{"label": "ang", "score": 0.87}, ...]
    if not results:
        raise RuntimeError("Model returned empty results")

    merged_scores = {
        "angry": 0.0,
        "fear": 0.0,
        "happy": 0.0,
        "neutral": 0.0,
        "sad": 0.0,
    }
    for item in results:
        raw_label = item["label"].lower().strip()
        mapped_label = _LABEL_MAP.get(raw_label, "neutral")
        merged_scores[mapped_label] += float(item["score"]) * 100.0

    probabilities = [
        {"emotion": emotion, "probability": round(score, 2)}
        for emotion, score in merged_scores.items()
    ]
    top = max(probabilities, key=lambda x: x["probability"])
    emotion = top["emotion"]
    confidence = top["probability"]

    return {
        "emotion": emotion,
        "confidence": confidence,
        "probabilities": probabilities,
    }
