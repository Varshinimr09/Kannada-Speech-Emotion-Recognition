import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface WaveformVisualizerProps {
  isRecording: boolean;
  isAnalyzing: boolean;
  hasResult: boolean;
}

export default function WaveformVisualizer({ isRecording, isAnalyzing, hasResult }: WaveformVisualizerProps) {
  const barsRef = useRef<number[]>([]);

  useEffect(() => {
    barsRef.current = Array.from({ length: 64 }, () => Math.random() * 60 + 10);
  }, []);

  const getBarHeight = (index: number) => {
    if (isRecording) return Math.random() * 80 + 10;
    if (hasResult) return Math.sin((index / 64) * Math.PI * 4) * 40 + 50;
    return barsRef.current[index] || 20;
  };

  return (
    <div className="relative w-full h-28 bg-[#0d1117] rounded-xl overflow-hidden border border-white/5">
      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="w-full h-px bg-white/5" />
        ))}
      </div>

      {/* Center line */}
      <div className="absolute left-0 right-0 top-1/2 h-px bg-cyan-500/20" />

      {/* Bars */}
      <div className="absolute inset-0 flex items-center justify-around px-2 gap-0.5">
        {Array.from({ length: 64 }).map((_, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-full"
            style={{
              background: isRecording
                ? `linear-gradient(to top, #00d4ff, #8b5cf6)`
                : hasResult
                ? `linear-gradient(to top, #10b981, #00d4ff)`
                : 'rgba(255,255,255,0.12)',
            }}
            animate={{
              height: isRecording
                ? [`${20 + Math.sin(i * 0.5) * 30}%`, `${50 + Math.cos(i * 0.3) * 40}%`, `${20 + Math.sin(i * 0.7) * 30}%`]
                : isAnalyzing
                ? [`${30}%`, `${70}%`, `${30}%`]
                : hasResult
                ? `${Math.abs(Math.sin((i / 64) * Math.PI * 6)) * 70 + 10}%`
                : `${getBarHeight(i)}%`,
            }}
            transition={
              isRecording || isAnalyzing
                ? { duration: 0.4 + (i % 5) * 0.08, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }
                : { duration: 0.5 }
            }
          />
        ))}
      </div>

      {/* Overlay label */}
      {!isRecording && !isAnalyzing && !hasResult && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-white/20 tracking-widest uppercase">Waveform Preview</span>
        </div>
      )}

      {isAnalyzing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full"
            />
            Analyzing audio signal...
          </div>
        </div>
      )}
    </div>
  );
}
