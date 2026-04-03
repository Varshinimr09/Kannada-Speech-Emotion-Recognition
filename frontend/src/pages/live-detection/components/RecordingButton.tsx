import { motion } from 'framer-motion';

interface RecordingButtonProps {
  isRecording: boolean;
  isAnalyzing: boolean;
  onToggle: () => void;
}

export default function RecordingButton({ isRecording, isAnalyzing, onToggle }: RecordingButtonProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Outer pulse rings */}
      <div className="relative flex items-center justify-center">
        {isRecording && (
          <>
            <motion.div
              className="absolute rounded-full border-2 border-red-400/30"
              animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
              style={{ width: 160, height: 160 }}
            />
            <motion.div
              className="absolute rounded-full border-2 border-red-400/20"
              animate={{ scale: [1, 2], opacity: [0.4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
              style={{ width: 160, height: 160 }}
            />
          </>
        )}

        {/* Main button */}
        <motion.button
          onClick={onToggle}
          disabled={isAnalyzing}
          whileHover={!isAnalyzing ? { scale: 1.06 } : {}}
          whileTap={!isAnalyzing ? { scale: 0.94 } : {}}
          className={`relative w-36 h-36 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-xl disabled:opacity-60 disabled:cursor-not-allowed ${
            isRecording
              ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30'
              : isAnalyzing
              ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-400/30'
              : 'bg-gradient-to-br from-[#00d4ff] to-[#8b5cf6] shadow-cyan-500/30'
          }`}
        >
          {/* Inner glow */}
          <div className="absolute inset-2 rounded-full bg-white/10 backdrop-blur-sm" />

          {isAnalyzing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="relative z-10 w-10 h-10 border-4 border-white border-t-transparent rounded-full"
            />
          ) : (
            <i
              className={`relative z-10 text-5xl text-white ${
                isRecording ? 'ri-stop-fill' : 'ri-mic-fill'
              }`}
            />
          )}
        </motion.button>
      </div>

      {/* Status label */}
      <div className="text-center">
        <motion.div
          key={isRecording ? 'rec' : isAnalyzing ? 'ana' : 'idle'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2"
        >
          {isRecording && (
            <motion.div
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-red-500"
            />
          )}
          <span className="text-sm font-semibold text-gray-700">
            {isRecording ? 'Recording — Speak in Kannada' : isAnalyzing ? 'Analyzing speech...' : 'Click to start recording'}
          </span>
        </motion.div>
        <p className="text-xs text-gray-400 mt-1">
          {isRecording ? 'Click again to stop' : isAnalyzing ? 'Extracting acoustic features' : 'Supports .wav Kannada speech audio'}
        </p>
      </div>
    </div>
  );
}
