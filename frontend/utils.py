import librosa
import numpy as np


def extract_features(file_path):
    """
    Extract acoustic features from an audio file for emotion recognition.
    Returns a 177-dimensional feature vector.
    """
    y, sr = librosa.load(file_path, sr=16000, duration=5.0)

    # Pad if too short (less than 1 second)
    if len(y) < sr:
        y = np.pad(y, (0, sr - len(y)))

    # --- MFCC (40 coefficients) — captures timbral texture ---
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
    mfcc_mean = np.mean(mfcc, axis=1)          # 40
    mfcc_std  = np.std(mfcc, axis=1)           # 40

    # --- Delta MFCC — captures rate of change in MFCCs ---
    mfcc_delta = librosa.feature.delta(mfcc)
    mfcc_delta_mean = np.mean(mfcc_delta, axis=1)  # 40

    # --- Chroma (12) — pitch class energy distribution ---
    chroma = librosa.feature.chroma_stft(y=y, sr=sr, n_chroma=12)
    chroma_mean = np.mean(chroma, axis=1)      # 12

    # --- Mel Spectrogram (40 bins) — perceptual frequency representation ---
    mel = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=40)
    mel_mean = np.mean(librosa.power_to_db(mel), axis=1)  # 40

    # --- Prosodic / spectral scalar features ---
    zcr_mean       = np.mean(librosa.feature.zero_crossing_rate(y))
    rms_mean       = np.mean(librosa.feature.rms(y=y))
    centroid_mean  = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
    rolloff_mean   = np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr))
    bandwidth_mean = np.mean(librosa.feature.spectral_bandwidth(y=y, sr=sr))

    features = np.concatenate([
        mfcc_mean,           # 40
        mfcc_std,            # 40
        mfcc_delta_mean,     # 40
        chroma_mean,         # 12
        mel_mean,            # 40
        [zcr_mean, rms_mean, centroid_mean, rolloff_mean, bandwidth_mean]  # 5
    ])  # Total: 177

    return features
