import os
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

import cloudinary
import cloudinary.uploader
from flask import Blueprint, request, jsonify
from bson import ObjectId

import config
from auth_utils import require_auth
from database import get_db
from ml.predictor import predict

# Add ffmpeg to PATH if not already there (winget installs to a non-PATH location)
_FFMPEG_BIN = r"C:\Users\Lenovo\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-full_build\bin"
if os.path.isdir(_FFMPEG_BIN) and _FFMPEG_BIN not in os.environ.get("PATH", ""):
    os.environ["PATH"] = _FFMPEG_BIN + os.pathsep + os.environ.get("PATH", "")

# Configure Cloudinary
cloudinary.config(
    cloud_name = config.CLOUDINARY_CLOUD_NAME,
    api_key    = config.CLOUDINARY_API_KEY,
    api_secret = config.CLOUDINARY_API_SECRET,
    secure     = True,
)

predict_bp = Blueprint("predict", __name__, url_prefix="/api/predict")

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".ogg", ".flac", ".m4a", ".webm"}
_FEAR_OVERRIDE_THRESHOLD = 8.0


def _upload_to_cloudinary(file_path: str, public_id: str) -> str:
    """Upload audio to Cloudinary and return the secure URL."""
    result = cloudinary.uploader.upload(
        file_path,
        resource_type  = "video",   # Cloudinary uses 'video' for audio
        folder         = "kannada_ser",
        public_id      = public_id,
        overwrite      = True,
        format         = "wav",
    )
    return result["secure_url"]


def _convert_to_wav_if_needed(tmp_path: str, ext: str) -> tuple[str, bool]:
    """Convert webm/ogg/m4a/mp3 to 16 kHz mono wav using ffmpeg. Returns (path, needs_cleanup)."""
    if ext in {".webm", ".ogg", ".m4a", ".mp3", ".flac"}:
        wav_path = tmp_path + ".wav"
        try:
            result = subprocess.run(
                ["ffmpeg", "-y", "-i", tmp_path, "-ar", "16000", "-ac", "1", "-sample_fmt", "s16", wav_path],
                capture_output=True,
            )
        except FileNotFoundError:
            print("[predict] ffmpeg not found — falling back to librosa native decode")
            return tmp_path, False
        if result.returncode == 0 and os.path.exists(wav_path):
            return wav_path, True
        # ffmpeg failed — log and fall back (librosa will attempt native decode)
        print(f"[predict] ffmpeg conversion failed for {ext}: {result.stderr[-300:].decode(errors='replace')}")
    return tmp_path, False


def _safe_ml_predict(wav_path: str) -> tuple:
    """Returns (result_dict, None) on success or (None, error_str) on failure."""
    try:
        return predict(wav_path), None
    except (ValueError, RuntimeError) as e:
        return None, str(e)
    except Exception as e:
        return None, f"Unexpected ML error: {e}"


def _safe_openai_analyze(wav_path: str) -> dict | None:
    """Returns HuggingFace emotion results or None if the model is unavailable."""
    try:
        from ml.openai_analyzer import analyze_audio_emotion
        return analyze_audio_emotion(wav_path)
    except Exception as e:
        print(f"[HuggingFace] Analysis skipped: {e}")
        return None


def _compare(ml: dict, openai: dict | None) -> dict | None:
    """Compare ML vs SUPERB results. Returns analysis block or None."""
    if openai is None:
        return None
    agreed = ml["emotion"] == openai["emotion"]
    winner = "both" if agreed else "openai"
    return {
        "winner": winner,
        "agreed": agreed,
        "ml":     {"emotion": ml["emotion"],     "confidence": ml["confidence"]},
        "openai": {"emotion": openai["emotion"], "confidence": openai["confidence"]},
    }


def _get_probability(probabilities: list[dict], emotion: str) -> float:
    """Get class probability from a probabilities list; returns 0 if missing."""
    target = emotion.lower().strip()
    for item in probabilities or []:
        if str(item.get("emotion", "")).lower().strip() == target:
            try:
                return float(item.get("probability", 0.0))
            except (TypeError, ValueError):
                return 0.0
    return 0.0


def _set_probability(probabilities: list[dict], emotion: str, value: float) -> list[dict]:
    """Set/insert an emotion probability value in-place-safe form."""
    target = emotion.lower().strip()
    updated = False
    out: list[dict] = []
    for item in probabilities or []:
        item_emotion = str(item.get("emotion", "")).lower().strip()
        if item_emotion == target:
            out.append({"emotion": target, "probability": round(float(value), 2)})
            updated = True
        else:
            out.append(item)
    if not updated:
        out.append({"emotion": target, "probability": round(float(value), 2)})
    return out


def _print_pipeline_banner() -> None:
    """Display the UI pipeline names in backend terminal logs (display only)."""
    print("[PIPELINE] Audio Preprocessing")
    print("[PIPELINE] Acoustic Feature Extraction")
    print("[PIPELINE] Kannada Prediction")
    print("[PIPELINE] SUPERB Cross-Check")
    print("[PIPELINE] Hybrid Final Classification")


def _handle_audio_prediction(file, source: str, user_id: str) -> tuple[dict, int]:
    """Shared logic for upload and live-detection endpoints."""
    print("\n" + "=" * 55)
    _print_pipeline_banner()
    print(f"[STEP 1] Request received  source={source}  user={user_id}")

    filename = file.filename or "recording.wav"
    ext = os.path.splitext(filename)[1].lower()
    print(f"[STEP 1] File: {filename}  ext={ext}")
    if ext not in ALLOWED_EXTENSIONS:
        return {"error": f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"}, 400

    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name
    file_size = os.path.getsize(tmp_path)
    print(f"[STEP 1] Saved temp file: {tmp_path}  ({file_size} bytes)")

    print(f"[STEP 2] Converting to 16kHz mono WAV if needed (ext={ext}) ...")
    wav_path, wav_created = _convert_to_wav_if_needed(tmp_path, ext)
    if wav_created:
        print(f"[STEP 2] Converted -> {wav_path}  ({os.path.getsize(wav_path)} bytes)")
    else:
        print(f"[STEP 2] No conversion needed, using original file")

    vad_error     = None
    result        = None
    openai_result = None
    try:
        print(f"[STEP 3] Uploading to Cloudinary ...")
        public_id      = f"{user_id}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}"
        cloudinary_url = _upload_to_cloudinary(wav_path, public_id)
        print(f"[STEP 3] Cloudinary upload OK -> {cloudinary_url}")

        print(f"[STEP 4] Running parallel analysis (ML + SUPERB) ...")
        with ThreadPoolExecutor(max_workers=2) as exe:
            ml_fut = exe.submit(_safe_ml_predict, wav_path)
            oa_fut = exe.submit(_safe_openai_analyze, wav_path)
        result, vad_error = ml_fut.result()
        openai_result     = oa_fut.result()
        if vad_error:
            print(f"[STEP 4] ML rejected: {vad_error}")
        print(f"[STEP 4] Complete  ml={'ok' if result else 'err'}  superb={'ok' if openai_result else 'skipped'}")

    finally:
        os.unlink(tmp_path)
        if wav_created and os.path.exists(wav_path):
            os.unlink(wav_path)
        print(f"[STEP 4] Temp files cleaned up")

    if vad_error:
        return {"error": vad_error}, 422

    print(f"[STEP 5] Saving to MongoDB ...")
    analysis = _compare(result, openai_result)
    # HuggingFace is the primary prediction source when it is available.
    if openai_result is not None:
        final_emotion = openai_result["emotion"]
        final_confidence = openai_result["confidence"]
        final_probabilities = openai_result.get("probabilities", [])

        # Special rule: if SUPERB says sad, allow Kannada model to override to fear
        # once Kannada fear confidence crosses a practical threshold.
        if final_emotion == "sad":
            kannada_fear_conf = _get_probability(result.get("probabilities", []), "fear")
            # Always show Kannada fear confidence in UI (even below threshold).
            final_probabilities = _set_probability(final_probabilities, "fear", kannada_fear_conf)
            if kannada_fear_conf >= _FEAR_OVERRIDE_THRESHOLD:
                final_emotion = "fear"
                final_confidence = round(kannada_fear_conf, 2)
                if analysis:
                    analysis["winner"] = "ml_model"
                print(
                    f"[STEP 5] Override applied: SUPERB sad({openai_result['confidence']}%) "
                    f"-> Kannada fear({kannada_fear_conf}%) threshold={_FEAR_OVERRIDE_THRESHOLD}%"
                )
    else:
        final_emotion    = result["emotion"]
        final_confidence = result["confidence"]
        final_probabilities = result["probabilities"]

    duration_s = result["acoustic_features"].get("duration", 0)
    doc = {
        "user_id":           user_id,
        "audio_file":        filename,
        "cloudinary_url":    cloudinary_url,
        "emotion":           final_emotion,
        "confidence":        final_confidence,
        "probabilities":     final_probabilities,
        "acoustic_features": result["acoustic_features"],
        "duration":          f"{duration_s}s",
        "source":            source,
        "analysis":          analysis,
        "timestamp":         datetime.now(timezone.utc),
    }
    inserted = get_db().predictions.insert_one(doc)
    print(f"[STEP 5] MongoDB insert OK -> id={inserted.inserted_id}")
    print(f"[RESULT] emotion={final_emotion}  confidence={final_confidence}%")
    print("=" * 55 + "\n")

    return {
        "id":                str(inserted.inserted_id),
        "emotion":           final_emotion,
        "confidence":        final_confidence,
        "probabilities":     final_probabilities,
        "acoustic_features": result["acoustic_features"],
        "cloudinary_url":    cloudinary_url,
        "audio_file":        filename,
        "duration":          doc["duration"],
        "source":            source,
        "analysis":          analysis,
        "timestamp":         doc["timestamp"].isoformat(),
    }, 200


@predict_bp.post("/upload")
@require_auth
def upload_audio(current_user_id: str):
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided (field name: 'audio')"}), 400
    file = request.files["audio"]
    body, status = _handle_audio_prediction(file, "upload", current_user_id)
    return jsonify(body), status


@predict_bp.post("/live")
@require_auth
def live_detection(current_user_id: str):
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided (field name: 'audio')"}), 400
    file = request.files["audio"]
    body, status = _handle_audio_prediction(file, "live", current_user_id)
    return jsonify(body), status
