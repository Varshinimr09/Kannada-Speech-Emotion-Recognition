export const waveformData = Array.from({ length: 100 }, (_, i) => ({
  time: i,
  amplitude: Math.sin(i * 0.2) * 50 + Math.random() * 20
}));

export const pitchData = Array.from({ length: 50 }, (_, i) => ({
  time: i * 0.1,
  pitch: 150 + Math.sin(i * 0.3) * 50 + Math.random() * 20
}));

export const mfccData = Array.from({ length: 13 }, (_, i) => ({
  coefficient: `MFCC ${i + 1}`,
  value: Math.random() * 100 - 50
}));

export const frequencyData = Array.from({ length: 30 }, (_, i) => ({
  frequency: i * 100,
  magnitude: Math.random() * 80 + 20,
  phase: Math.random() * 180 - 90
}));

export const spectrogramData = Array.from({ length: 20 }, (_, timeIdx) =>
  Array.from({ length: 30 }, (_, freqIdx) => ({
    time: timeIdx,
    frequency: freqIdx,
    intensity: Math.random() * 100
  }))
).flat();

export const energyData = Array.from({ length: 50 }, (_, i) => ({
  time: i * 0.1,
  energy: Math.random() * 80 + 20
}));

export const zcrData = Array.from({ length: 50 }, (_, i) => ({
  time: i * 0.1,
  zcr: Math.random() * 60 + 10
}));