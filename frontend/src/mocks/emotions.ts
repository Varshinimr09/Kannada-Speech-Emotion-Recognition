export const emotionCategories = [
  { id: 1, name: 'Happy', emoji: '😊', color: '#fbbf24' },
  { id: 2, name: 'Sad', emoji: '😢', color: '#3b82f6' },
  { id: 3, name: 'Angry', emoji: '😠', color: '#ef4444' },
  { id: 4, name: 'Fear', emoji: '😨', color: '#8b5cf6' },
  { id: 5, name: 'Neutral', emoji: '😐', color: '#6b7280' }
];

export const predictionHistory = [
  {
    id: 1,
    fileName: 'kannada_speech_001.wav',
    emotion: 'Happy',
    emoji: '😊',
    confidence: 94.5,
    timestamp: '2025-01-15 14:32:18',
    duration: '3.2s'
  },
  {
    id: 2,
    fileName: 'kannada_speech_002.wav',
    emotion: 'Sad',
    emoji: '😢',
    confidence: 89.3,
    timestamp: '2025-01-15 13:45:22',
    duration: '4.1s'
  },
  {
    id: 3,
    fileName: 'kannada_speech_003.wav',
    emotion: 'Angry',
    emoji: '😠',
    confidence: 91.7,
    timestamp: '2025-01-15 12:18:45',
    duration: '2.8s'
  },
  {
    id: 4,
    fileName: 'kannada_speech_004.wav',
    emotion: 'Fear',
    emoji: '😨',
    confidence: 87.2,
    timestamp: '2025-01-15 11:22:33',
    duration: '3.5s'
  },
  {
    id: 5,
    fileName: 'kannada_speech_005.wav',
    emotion: 'Angry',
    emoji: '😠',
    confidence: 92.8,
    timestamp: '2025-01-15 10:15:12',
    duration: '2.3s'
  },
  {
    id: 6,
    fileName: 'kannada_speech_006.wav',
    emotion: 'Neutral',
    emoji: '😐',
    confidence: 88.6,
    timestamp: '2025-01-15 09:42:55',
    duration: '3.9s'
  },
  {
    id: 7,
    fileName: 'kannada_speech_007.wav',
    emotion: 'Happy',
    emoji: '😊',
    confidence: 95.2,
    timestamp: '2025-01-14 16:28:41',
    duration: '3.1s'
  },
  {
    id: 8,
    fileName: 'kannada_speech_008.wav',
    emotion: 'Angry',
    emoji: '😠',
    confidence: 90.4,
    timestamp: '2025-01-14 15:33:19',
    duration: '2.7s'
  }
];

export const modelPerformance = {
  accuracy: 94.8,
  precision: 93.2,
  recall: 92.7,
  f1Score: 92.9,
  totalPredictions: 1247,
  correctPredictions: 1182
};

export const emotionDistribution = [
  { emotion: 'Happy', count: 245, percentage: 22.9, color: '#fbbf24' },
  { emotion: 'Sad', count: 198, percentage: 18.5, color: '#3b82f6' },
  { emotion: 'Angry', count: 223, percentage: 20.8, color: '#ef4444' },
  { emotion: 'Fear', count: 187, percentage: 17.5, color: '#8b5cf6' },
  { emotion: 'Neutral', count: 218, percentage: 20.4, color: '#6b7280' }
];

export const confusionMatrixData = [
  [97, 1, 1, 1, 0],
  [1, 96, 1, 1, 1],
  [1, 1, 97, 0, 1],
  [1, 0, 1, 97, 1],
  [0, 1, 1, 1, 97]
];

export const featureImportance = [
  { feature: 'MFCC', importance: 0.32, percentage: 32 },
  { feature: 'Pitch', importance: 0.24, percentage: 24 },
  { feature: 'Energy', importance: 0.18, percentage: 18 },
  { feature: 'Intensity', importance: 0.15, percentage: 15 },
  { feature: 'Zero Crossing Rate', importance: 0.11, percentage: 11 }
];