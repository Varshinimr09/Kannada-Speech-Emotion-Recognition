export const performanceMetrics = {
  accuracy: 84.00,
  precision: 84.91,
  recall: 84.00,
  f1Score: 84.19
};

export const trainingHistory = [
  { epoch: 1,  accuracy: 42.4, loss: 1.73 },
  { epoch: 3,  accuracy: 58.8, loss: 1.26 },
  { epoch: 5,  accuracy: 66.4, loss: 1.04 },
  { epoch: 7,  accuracy: 71.2, loss: 0.89 },
  { epoch: 10, accuracy: 76.0, loss: 0.74 },
  { epoch: 12, accuracy: 78.4, loss: 0.67 },
  { epoch: 15, accuracy: 80.8, loss: 0.58 },
  { epoch: 18, accuracy: 82.4, loss: 0.50 },
  { epoch: 20, accuracy: 82.4, loss: 0.46 },
  { epoch: 22, accuracy: 83.2, loss: 0.43 },
  { epoch: 25, accuracy: 83.2, loss: 0.40 },
  { epoch: 28, accuracy: 84.0, loss: 0.37 },
  { epoch: 30, accuracy: 84.0, loss: 0.36 }
];

export const modelComparison = [
  { model: 'Wav2Vec2 (Ours)', accuracy: 84.00, precision: 84.91, recall: 84.00, f1: 84.19 },
  { model: 'SUPERB ER',       accuracy: 72.40, precision: 71.80, recall: 72.40, f1: 72.00 },
  { model: 'SVM + MFCC',      accuracy: 69.20, precision: 68.50, recall: 69.20, f1: 68.80 },
  { model: 'Random Forest',   accuracy: 64.80, precision: 63.90, recall: 64.80, f1: 64.20 }
];

// Rows/cols ordered: Angry=0, Fear=1, Happy=2, Neutral=3, Sad=4
export const confusionMatrix = [
  [23, 0,  1,  0,  3],
  [ 1, 21, 0,  1,  4],
  [ 1, 1,  22, 0,  3],
  [ 0, 1,  0,  16, 0],
  [ 1, 2,  1,  0,  23]
];

export const emotionLabels = ['Angry', 'Fear', 'Happy', 'Neutral', 'Sad'];

export const featureImportance = [
  { feature: 'Wav2Vec2 Embeddings',  importance: 0.38 },
  { feature: 'MFCC',                 importance: 0.22 },
  { feature: 'Temporal Dynamics',    importance: 0.17 },
  { feature: 'Pitch Variation',      importance: 0.12 },
  { feature: 'Energy Envelope',      importance: 0.07 },
  { feature: 'Spectral Flux',        importance: 0.04 }
];

// Per-emotion accuracy breakdown (test set, same 80/10/10 split as training)
export const emotionAccuracy = [
  { emotion: 'Angry',   accuracy: 85.19 },
  { emotion: 'Fear',    accuracy: 77.78 },
  { emotion: 'Happy',   accuracy: 81.48 },
  { emotion: 'Neutral', accuracy: 94.12 },
  { emotion: 'Sad',     accuracy: 85.19 }
];

// Confusion matrix data formatted for Recharts heatmap
export const confusionHeatmapData = confusionMatrix.flatMap((row, i) =>
  row.map((value, j) => ({
    actual: emotionLabels[i],
    predicted: emotionLabels[j],
    value,
    x: j,
    y: i
  }))
);