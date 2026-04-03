import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../api/client';
import type { PredictResponse } from '../api/client';

export interface PredictionRecord {
  id: string;
  audioFile: string;
  cloudinaryUrl?: string;
  emotion: string;
  confidence: number;
  timestamp: string;
  duration: string;
  source: 'upload' | 'live';
}

interface PredictionHistoryContextType {
  predictions: PredictionRecord[];
  addPrediction: (result: PredictResponse) => void;
  clearHistory: () => void;
  refreshFromServer: () => Promise<void>;
}

const PredictionHistoryContext = createContext<PredictionHistoryContextType | undefined>(undefined);

export function PredictionHistoryProvider({ children }: { children: ReactNode }) {
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);

  const refreshFromServer = async () => {
    try {
      const { predictions: serverPreds } = await api.history.list(50);
      setPredictions(
        serverPreds.map(p => ({
          id:            p.id,
          audioFile:     p.audioFile,
          cloudinaryUrl: p.cloudinaryUrl,
          emotion:       p.emotion,
          confidence:    p.confidence,
          timestamp:     p.timestamp,
          duration:      p.duration,
          source:        p.source,
        }))
      );
    } catch {
      // Not authenticated or server unavailable — keep local state
    }
  };

  // Load history on mount (if user is logged in)
  useEffect(() => {
    if (localStorage.getItem('auth_token')) {
      refreshFromServer();
    }
  }, []);

  const addPrediction = (result: PredictResponse) => {
    const record: PredictionRecord = {
      id:            result.id,
      audioFile:     result.audio_file,
      cloudinaryUrl: result.cloudinary_url,
      emotion:       result.emotion,
      confidence:    result.confidence,
      timestamp:     result.timestamp,
      duration:      result.duration,
      source:        result.source,
    };
    setPredictions(prev => [record, ...prev]);
  };

  const clearHistory = async () => {
    try {
      await api.history.clearAll();
    } catch {
      // best effort
    }
    setPredictions([]);
  };

  return (
    <PredictionHistoryContext.Provider value={{ predictions, addPrediction, clearHistory, refreshFromServer }}>
      {children}
    </PredictionHistoryContext.Provider>
  );
}

export function usePredictionHistory() {
  const context = useContext(PredictionHistoryContext);
  if (context === undefined) {
    throw new Error('usePredictionHistory must be used within a PredictionHistoryProvider');
  }
  return context;
}