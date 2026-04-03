import os
import subprocess
import tempfile

import librosa
import numpy as np
from flask import Blueprint, jsonify, request

from auth_utils import require_auth

# Add ffmpeg to PATH if available (same location used in predict route)
_FFMPEG_BIN = r"C:\Users\Lenovo\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-full_build\bin"
if os.path.isdir(_FFMPEG_BIN) and _FFMPEG_BIN not in os.environ.get("PATH", ""):
    os.environ["PATH"] = _FFMPEG_BIN + os.pathsep + os.environ.get("PATH", "")

viz_bp = Blueprint("visualization", __name__, url_prefix="/api/visualization")

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".ogg", ".flac", ".m4a", ".webm"}
SR = 16000


def _convert_to_wav_if_needed(tmp_path: str, ext: str) -> tuple[str, bool]:
    if ext in {".webm", ".ogg", ".m4a", ".mp3", ".flac"}:
        wav_path = tmp_path + ".wav"
        try:
            result = subprocess.run(
                ["ffmpeg", "-y", "-i", tmp_path, "-ar", "16000", "-ac", "1", "-sample_fmt", "s16", wav_path],
                capture_output=True,
            )
        except FileNotFoundError:
            return tmp_path, False
        if result.returncode == 0 and os.path.exists(wav_path):
            return wav_path, True
    return tmp_path, False


def _resample_points(times: np.ndarray, values: np.ndarray, n: int) -> tuple[np.ndarray, np.ndarray]:
    if len(values) == 0:
        return np.array([]), np.array([])
    if len(values) <= n:
        return times, values
    idx = np.linspace(0, len(values) - 1, n).astype(int)
    return times[idx], values[idx]


@viz_bp.post("/extract")
@require_auth
def extract_signal_data(current_user_id: str):
    del current_user_id  # auth guard only

    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided (field name: 'audio')"}), 400

    file = request.files["audio"]
    filename = file.filename or "audio.wav"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"error": f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"}), 400

    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    wav_path, wav_created = _convert_to_wav_if_needed(tmp_path, ext)

    try:
        y, sr = librosa.load(wav_path, sr=SR, mono=True)
        if y.size == 0:
            return jsonify({"error": "Audio file is empty"}), 422

        # Waveform (100 points)
        wf_time = np.linspace(0, len(y) / sr, len(y))
        wf_time, wf_amp = _resample_points(wf_time, y, 100)
        waveform_data = [
            {"time": round(float(t * 1000), 1), "amplitude": round(float(a) * 100, 3)}
            for t, a in zip(wf_time, wf_amp)
        ]

        # Pitch (pyin)
        f0, voiced_flag, _ = librosa.pyin(y, fmin=librosa.note_to_hz("C2"), fmax=librosa.note_to_hz("C7"), sr=sr)
        if f0 is None:
            pitch_data = []
        else:
            f0 = np.where(np.isnan(f0), 0.0, f0)
            t_pitch = librosa.times_like(f0, sr=sr)
            t_pitch, f0 = _resample_points(t_pitch, f0, 50)
            pitch_data = [{"time": round(float(t), 3), "pitch": round(float(p), 2)} for t, p in zip(t_pitch, f0)]

        # MFCC mean per coefficient
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfcc, axis=1)
        mfcc_data = [
            {"coefficient": f"MFCC {i + 1}", "value": round(float(v), 3)}
            for i, v in enumerate(mfcc_mean)
        ]

        # Frequency spectrum (magnitude + phase)
        fft = np.fft.rfft(y)
        freqs = np.fft.rfftfreq(len(y), 1 / sr)
        mag = np.abs(fft)
        phase = np.angle(fft)
        f_mask = freqs <= 5000
        freqs = freqs[f_mask]
        mag = mag[f_mask]
        phase = phase[f_mask]
        # Keep all spectrum arrays aligned with one shared index to avoid OOB errors.
        if len(freqs) > 30:
            idx = np.linspace(0, len(freqs) - 1, 30).astype(int)
            freqs = freqs[idx]
            mag = mag[idx]
            phase = phase[idx]
        mag = (mag / np.max(mag) * 100) if np.max(mag) > 0 else mag
        phase = np.degrees(phase)
        frequency_data = [
            {
                "frequency": round(float(f), 1),
                "magnitude": round(float(m), 3),
                "phase": round(float(p), 3),
            }
            for f, m, p in zip(freqs, mag, phase)
        ]

        # Energy (RMS over frames)
        rms = librosa.feature.rms(y=y)[0]
        t_rms = librosa.times_like(rms, sr=sr)
        t_rms, rms = _resample_points(t_rms, rms, 50)
        energy_norm = (rms / np.max(rms) * 100) if np.max(rms) > 0 else rms
        energy_data = [
            {"time": round(float(t), 3), "energy": round(float(e), 3)}
            for t, e in zip(t_rms, energy_norm)
        ]

        # ZCR
        zcr = librosa.feature.zero_crossing_rate(y=y)[0]
        t_zcr = librosa.times_like(zcr, sr=sr)
        t_zcr, zcr = _resample_points(t_zcr, zcr, 50)
        zcr_data = [
            {"time": round(float(t), 3), "zcr": round(float(z), 6)}
            for t, z in zip(t_zcr, zcr)
        ]

        return jsonify(
            {
                "audioFile": filename,
                "sampleRate": sr,
                "duration": round(float(len(y) / sr), 3),
                "waveformData": waveform_data,
                "pitchData": pitch_data,
                "mfccData": mfcc_data,
                "frequencyData": frequency_data,
                "energyData": energy_data,
                "zcrData": zcr_data,
            }
        ), 200

    except Exception as exc:
        return jsonify({"error": f"Failed to extract visualization data: {exc}"}), 500

    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        if wav_created and os.path.exists(wav_path):
            os.unlink(wav_path)
