import { motion } from 'framer-motion';

interface Emotion {
  name: string;
  emoji: string;
  color: string;
  probability: number;
}

interface EmotionResultCardProps {
  detectedEmotion: string;
  confidence: number;
  emotions: Emotion[];
}

export default function EmotionResultCard({ detectedEmotion, confidence, emotions }: EmotionResultCardProps) {
  const detected = emotions.find((e) => e.name === detectedEmotion);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      {/* Top result banner */}
      <div
        className="px-6 py-5 flex items-center gap-5"
        style={{ background: `linear-gradient(135deg, ${detected?.color}18, ${detected?.color}08)` }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-sm flex-shrink-0"
          style={{ background: `${detected?.color}22`, border: `1.5px solid ${detected?.color}44` }}
        >
          {detected?.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Detected Emotion</div>
          <div className="text-2xl font-bold text-navy">{detectedEmotion}</div>
        </div>
        {/* Circular confidence */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" stroke="#e5e7eb" strokeWidth="5" fill="none" />
            <motion.circle
              cx="32"
              cy="32"
              r="26"
              stroke={detected?.color || '#00d4ff'}
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 26}`}
              initial={{ strokeDashoffset: `${2 * Math.PI * 26}` }}
              animate={{ strokeDashoffset: `${2 * Math.PI * 26 * (1 - confidence / 100)}` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-navy">{confidence}%</span>
          </div>
        </div>
      </div>

      {/* Probability bars */}
      <div className="px-6 py-5">
        <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Probability Distribution</div>
        <div className="space-y-3">
          {emotions.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-lg w-6 flex-shrink-0">{item.emoji}</span>
              <span className="text-xs font-medium text-gray-600 w-16 flex-shrink-0">{item.name}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.probability}%` }}
                  transition={{ duration: 0.8, delay: index * 0.08, ease: 'easeOut' }}
                  className="h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 w-9 text-right flex-shrink-0">
                {item.probability}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
