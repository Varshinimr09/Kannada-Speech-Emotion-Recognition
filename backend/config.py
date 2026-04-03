from __future__ import annotations
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB  = os.getenv("MONGO_DB", "kannada_ser")

# JWT
JWT_SECRET     = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_EXPIRY_DAYS = int(os.getenv("JWT_EXPIRY_DAYS", "7"))

# Cloudinary
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY    = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")

# App
DEBUG    = os.getenv("DEBUG", "true").lower() == "true"
PORT     = int(os.getenv("PORT", "5000"))
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

# Default to wav2vec2 (best model); override with INFERENCE_MODE env var
INFERENCE_MODE = os.getenv("INFERENCE_MODE", "wav2vec2")

# Model paths (relative to project root, one level up from backend/)
BASE_DIR      = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Mixed-training CNN model (legacy fallback)
MODEL_PT      = os.path.join(BASE_DIR, "mixed_training", "models", "cnn_checkpoint.pt")
MODEL_INFO    = os.path.join(BASE_DIR, "mixed_training", "models", "cnn_info.pkl")
# wav2vec2 fine-tuned model — balanced_training (59.4% test accuracy, best model)
WAV2VEC2_DIR  = os.path.join(BASE_DIR, "balanced_training", "models", "wav2vec_model")
WAV2VEC2_HEAD = os.path.join(BASE_DIR, "balanced_training", "models", "wav2vec_model", "head.pt")
WAV2VEC2_INFO = os.path.join(BASE_DIR, "balanced_training", "models", "wav2vec_info.json")
FEAT_DIR      = os.path.join(BASE_DIR, "features")

# HuggingFace Inference API (free tier — speech emotion recognition)
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")
