const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  signal?: AbortSignal
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let init: RequestInit = { method, headers, signal };

  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || `HTTP ${res.status}`);
  return data as T;
}

// ── Auth ─────────────────────────────────────────────────────────
export interface ApiUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<AuthResponse>("POST", "/api/auth/login", { email, password }),

    register: (name: string, email: string, password: string) =>
      request<AuthResponse>("POST", "/api/auth/register", { name, email, password }),

    me: () => request<{ user: ApiUser }>("GET", "/api/auth/me"),
  },

  // ── Predictions ────────────────────────────────────────────────
  predict: {
    upload: (file: File) => {
      const form = new FormData();
      form.append("audio", file);
      return request<PredictResponse>("POST", "/api/predict/upload", form);
    },

    live: (blob: Blob, fileName = "recording.wav") => {
      const form = new FormData();
      form.append("audio", blob, fileName);
      return request<PredictResponse>("POST", "/api/predict/live", form);
    },
  },

  // ── Prediction history ─────────────────────────────────────────
  history: {
    list: (limit = 50, offset = 0) =>
      request<HistoryResponse>("GET", `/api/predictions?limit=${limit}&offset=${offset}`),

    clearAll: () => request<{ deleted: number }>("DELETE", "/api/predictions"),

    deleteOne: (id: string) =>
      request<{ deleted: number }>("DELETE", `/api/predictions/${id}`),
  },

  // ── Stats ──────────────────────────────────────────────────────
  stats: {
    dashboard: () => request<DashboardStats>("GET", "/api/stats/dashboard"),
    performance: () => request<PerformanceStats>("GET", "/api/stats/performance"),
    dataset: () => request<DatasetStats>("GET", "/api/stats/dataset"),
  },

  // ── Visualization ─────────────────────────────────────────────
  visualization: {
    extract: (file: File) => {
      const form = new FormData();
      form.append("audio", file);
      return request<VisualizationResponse>("POST", "/api/visualization/extract", form);
    },
  },
};

// ── Response types ────────────────────────────────────────────────
export interface Analysis {
  winner: "both" | "ml_model" | "openai";
  agreed: boolean;
  ml:     { emotion: string; confidence: number };
  openai: { emotion: string; confidence: number };
}

export interface AcousticFeatures {
  mfcc: number;
  pitch: number;
  energy: number;
  intensity: number;
  zcr: number;
  duration: number;
}

export interface ProbabilityEntry {
  emotion: string;
  probability: number;
}

export interface PredictResponse {
  id: string;
  emotion: string;
  confidence: number;
  probabilities: ProbabilityEntry[];
  acoustic_features: AcousticFeatures;
  cloudinary_url: string;
  audio_file: string;
  duration: string;
  source: "upload" | "live";
  analysis?: Analysis | null;
  timestamp: string;
}

export interface HistoryRecord {
  id: string;
  audioFile: string;
  cloudinaryUrl: string;
  emotion: string;
  confidence: number;
  probabilities: ProbabilityEntry[];
  acoustic_features: AcousticFeatures;
  duration: string;
  source: "upload" | "live";
  timestamp: string;
}

export interface HistoryResponse {
  predictions: HistoryRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface DashboardStats {
  totalPredictions: number;
  modelAccuracy: number;
  correctPredictions: number;
  emotionDistribution: { emotion: string; count: number }[];
  recentPredictions: {
    id: string;
    audioFile: string;
    emotion: string;
    confidence: number;
    duration: string;
    timestamp: string;
  }[];
}

export interface PerformanceStats {
  metrics: { accuracy: number; precision: number; recall: number; f1Score: number };
  confusionMatrix: number[][];
  emotionLabels: string[];
  perEmotionAccuracy: Record<string, number>;
  modelType: string;
}

export interface DatasetStats {
  emotions: string[];
  originalCounts: Record<string, number>;
  originalTotal: number;
  augmentedCounts: Record<string, number>;
  augmentedTotal: number;
  combinedTotal: number;
  trainTotal: number;
  valTotal: number;
  testTotal: number;
  sampleRate: number;
  featureDimension: number;
}

export interface VisualizationResponse {
  audioFile: string;
  sampleRate: number;
  duration: number;
  waveformData: { time: number; amplitude: number }[];
  pitchData: { time: number; pitch: number }[];
  mfccData: { coefficient: string; value: number }[];
  frequencyData: { frequency: number; magnitude: number; phase: number }[];
  energyData: { time: number; energy: number }[];
  zcrData: { time: number; zcr: number }[];
}
