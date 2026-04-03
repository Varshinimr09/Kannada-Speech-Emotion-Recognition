export const datasetStats = {
  totalSamples: 4390,
  totalSpeakers: 150,
  totalDuration: "4.9 hours",
  avgDuration: "4.0s"
};

export const samplesPerEmotion = [
  { emotion: "Happy",   samples: 878, fill: "#10b981" },
  { emotion: "Sad",     samples: 878, fill: "#3b82f6" },
  { emotion: "Angry",   samples: 878, fill: "#ef4444" },
  { emotion: "Fear",    samples: 878, fill: "#f59e0b" },
  { emotion: "Neutral", samples: 878, fill: "#6b7280" }
];

export const datasetSplit = [
  { name: "Training", value: 70, fill: "#00d4ff" },
  { name: "Validation", value: 15, fill: "#8b5cf6" },
  { name: "Testing", value: 15, fill: "#10b981" }
];

export const featureInfo = [
  {
    name: "MFCC",
    fullName: "Mel Frequency Cepstral Coefficients",
    description: "Captures the spectral envelope of speech signals, representing the short-term power spectrum",
    coefficients: 13
  },
  {
    name: "Pitch",
    fullName: "Fundamental Frequency (pyin)",
    description: "Fundamental frequency estimated via probabilistic YIN (pyin), capturing emotional arousal and prosody",
    range: "65–2093 Hz"
  },
  {
    name: "Energy",
    fullName: "RMS Energy",
    description: "Root mean square amplitude of the waveform, reflecting loudness and emotional intensity",
    unit: "RMS (unitless)"
  },
  {
    name: "Intensity",
    fullName: "Signal Intensity (dB)",
    description: "RMS energy converted to decibels via amplitude_to_db, providing a perceptual loudness measure",
    unit: "dB"
  },
  {
    name: "ZCR",
    fullName: "Zero Crossing Rate",
    description: "Mean rate of sign changes per frame, distinguishing voiced from unvoiced speech segments",
    unit: "rate (0–1)"
  }
];

export const sampleAudioEntries = [
  { id: "angry_01-05-01",   emotion: "Angry",   folder: "processed_audio/angry",   duration: "4.0s" },
  { id: "angry_01-05-02",   emotion: "Angry",   folder: "processed_audio/angry",   duration: "4.0s" },
  { id: "angry_01-05-03",   emotion: "Angry",   folder: "processed_audio/angry",   duration: "4.0s" },
  { id: "fear_01-06-01",    emotion: "Fear",    folder: "processed_audio/fear",    duration: "4.0s" },
  { id: "fear_01-06-02",    emotion: "Fear",    folder: "processed_audio/fear",    duration: "4.0s" },
  { id: "fear_01-06-03",    emotion: "Fear",    folder: "processed_audio/fear",    duration: "4.0s" },
  { id: "happy_01-03-01",   emotion: "Happy",   folder: "processed_audio/happy",   duration: "4.0s" },
  { id: "happy_01-03-02",   emotion: "Happy",   folder: "processed_audio/happy",   duration: "4.0s" },
  { id: "happy_01-03-03",   emotion: "Happy",   folder: "processed_audio/happy",   duration: "4.0s" },
  { id: "neutral_01-01-01", emotion: "Neutral", folder: "processed_audio/neutral", duration: "4.0s" },
  { id: "neutral_01-01-02", emotion: "Neutral", folder: "processed_audio/neutral", duration: "4.0s" },
  { id: "neutral_01-01-03", emotion: "Neutral", folder: "processed_audio/neutral", duration: "4.0s" },
  { id: "sad_01-04-01",     emotion: "Sad",     folder: "processed_audio/sad",     duration: "4.0s" },
  { id: "sad_01-04-02",     emotion: "Sad",     folder: "processed_audio/sad",     duration: "4.0s" },
  { id: "sad_01-04-03",     emotion: "Sad",     folder: "processed_audio/sad",     duration: "4.0s" },
];

// Coverage = % of all processed_audio samples where feature is non-trivial
// Pitch drops to ~82% because silent/unvoiced frames yield NaN
export const featureCoverage = [
  { feature: "MFCC",      coverage: 100 },
  { feature: "Pitch",     coverage: 82  },
  { feature: "Energy",    coverage: 100 },
  { feature: "Intensity", coverage: 100 },
  { feature: "ZCR",       coverage: 100 },
];