import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import Breadcrumb from '../../components/Breadcrumb';
import WaveformVisualizer from './components/WaveformVisualizer';
import EmotionResultCard from './components/EmotionResultCard';
import RecordingButton from './components/RecordingButton';
import { usePredictionHistory } from '../../contexts/PredictionHistoryContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import type { ProbabilityEntry, AcousticFeatures } from '../../api/client';

// Map backend emotion keys (dataset folder names) → display names
const EMOTION_DISPLAY: Record<string, string> = {
  anger: 'Angry', angry: 'Angry',
  happiness: 'Happy', happy: 'Happy',
  sadness: 'Sad', sad: 'Sad',
  fear: 'Fear',
  neutral: 'Neutral',
};

const EMOTIONS = [
  { name: 'Happy',   emoji: '😊', color: '#f59e0b', probability: 0 },
  { name: 'Sad',     emoji: '😢', color: '#3b82f6', probability: 0 },
  { name: 'Angry',   emoji: '😠', color: '#ef4444', probability: 0 },
  { name: 'Fear',    emoji: '😨', color: '#8b5cf6', probability: 0 },
  { name: 'Neutral', emoji: '😐', color: '#6b7280', probability: 0 },
];

const RESULT_EMOTIONS = [
  { name: 'Happy',   emoji: '😊', color: '#f59e0b', probability: 85 },
  { name: 'Sad',     emoji: '😢', color: '#3b82f6', probability: 5  },
  { name: 'Angry',   emoji: '😠', color: '#ef4444', probability: 4  },
  { name: 'Fear',    emoji: '😨', color: '#8b5cf6', probability: 3  },
  { name: 'Neutral', emoji: '😐', color: '#6b7280', probability: 5  },
];

const EMOTION_COLORS: Record<string, string> = {
  happy: '#f59e0b', happiness: '#f59e0b',
  sad: '#3b82f6', sadness: '#3b82f6',
  angry: '#ef4444', anger: '#ef4444',
  fear: '#8b5cf6',
  neutral: '#6b7280',
};

const EMOTION_EMOJIS: Record<string, string> = {
  happy: '😊', happiness: '😊',
  sad: '😢', sadness: '😢',
  angry: '😠', anger: '😠',
  fear: '😨',
  neutral: '😐',
};

const FEATURE_STEPS = [
  { label: 'Audio Preprocessing',         icon: 'ri-sound-module-line', done: false },
  { label: 'Acoustic Feature Extraction', icon: 'ri-equalizer-line',    done: false },
  { label: 'Kannada Prediction',          icon: 'ri-flashlight-line',   done: false },
  { label: 'SUPERB Cross-Check',          icon: 'ri-pulse-line',        done: false },
  { label: 'Hybrid Final Classification', icon: 'ri-brain-line',        done: false },
];

type Stage = 'idle' | 'recording' | 'analyzing' | 'result';

export default function LiveDetectionPage() {
  const [stage, setStage]                     = useState<Stage>('idle');
  const [detectedEmotion, setDetectedEmotion] = useState<string | null>(null);
  const [confidence, setConfidence]           = useState(0);
  const [featureSteps, setFeatureSteps]       = useState(FEATURE_STEPS);
  const [recordingTime, setRecordingTime]     = useState(0);
  const [dragOver, setDragOver]               = useState(false);
  const [resultEmotions, setResultEmotions]   = useState(RESULT_EMOTIONS);
  const [acousticFeatures, setAcousticFeatures] = useState<AcousticFeatures | null>(null);
  const [apiError, setApiError]               = useState<string | null>(null);
  const timerRef                              = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef                          = useRef<HTMLInputElement>(null);
  const mediaRecorderRef                      = useRef<MediaRecorder | null>(null);
  const audioChunksRef                        = useRef<BlobPart[]>([]);
  const { user } = useAuth();
  const { addPrediction } = usePredictionHistory();

  const animateStepsAndCall = (audioBlob: Blob, fileName: string) => {
    setStage('analyzing');
    setApiError(null);
    const steps = [...FEATURE_STEPS];

    // Animate feature steps visually while API call runs in parallel
    steps.forEach((_, i) => {
      setTimeout(() => {
        setFeatureSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, done: true } : s)));
      }, i * 600 + 300);
    });

    api.predict.live(audioBlob, fileName)
      .then(result => {
        // Map API probabilities to display format
        const mapped = result.probabilities.map((p: ProbabilityEntry) => ({
          name:        EMOTION_DISPLAY[p.emotion.toLowerCase()] ?? p.emotion.charAt(0).toUpperCase() + p.emotion.slice(1),
          emoji:       EMOTION_EMOJIS[p.emotion.toLowerCase()] || '😶',
          color:       EMOTION_COLORS[p.emotion.toLowerCase()] || '#6b7280',
          probability: p.probability,
        }));
        setResultEmotions(mapped);
        setDetectedEmotion(
          EMOTION_DISPLAY[result.emotion.toLowerCase()] ?? result.emotion.charAt(0).toUpperCase() + result.emotion.slice(1)
        );
        setAcousticFeatures(result.acoustic_features ?? null);
        setConfidence(result.confidence);
        setStage('result');
        addPrediction(result);
      })
      .catch(err => {
        setApiError(err.message || 'Analysis failed. Please try again.');
        setStage('idle');
        setFeatureSteps(FEATURE_STEPS.map(s => ({ ...s, done: false })));
      });
  };

  const startRecording = async () => {
    setStage('recording');
    setDetectedEmotion(null);
    setConfidence(0);
    setApiError(null);
    setFeatureSteps(FEATURE_STEPS.map(s => ({ ...s, done: false })));
    setRecordingTime(0);
    audioChunksRef.current = [];

    timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        // Pick the best supported format; prefer wav-compatible containers
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg'
          : 'audio/webm';
        const ext = mimeType.includes('ogg') ? 'ogg' : 'webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        animateStepsAndCall(blob, `recording.${ext}`);
      };

      recorder.start();
    } catch {
      clearInterval(timerRef.current!);
      setStage('idle');
      setApiError('Microphone access denied. Please allow microphone permission and try again.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleToggleRecording = () => {
    if (stage === 'idle' || stage === 'result') startRecording();
    else if (stage === 'recording') stopRecording();
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingTime(0);
    animateStepsAndCall(file, file.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const isRecording = stage === 'recording';
  const isAnalyzing = stage === 'analyzing';
  const hasResult   = stage === 'result';

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans flex">
      <Sidebar />

      <main className="flex-1 min-w-0">
        {/* Error toast */}
        <AnimatePresence>
          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="fixed top-4 right-4 z-50 bg-red-500 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3"
            >
              <i className="ri-error-warning-line text-xl" />
              <span className="text-sm font-medium">{apiError}</span>
              <button onClick={() => setApiError(null)} className="ml-2 text-white/80 hover:text-white">
                <i className="ri-close-line" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-5 sticky top-0 z-30">
          <Breadcrumb />
          <div className="flex items-center justify-between mt-3">
            <div>
              <h1 className="text-2xl font-display font-bold text-navy leading-tight">Live Emotion Detection</h1>
              <p className="text-sm text-gray-500 mt-0.5">Record or upload Kannada speech to detect emotions in real-time</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Status badge */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                isRecording ? 'bg-red-50 border-red-200 text-red-600'
                : isAnalyzing ? 'bg-amber-50 border-amber-200 text-amber-600'
                : hasResult ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-gray-100 border-gray-200 text-gray-500'
              }`}>
                <motion.div
                  animate={isRecording || isAnalyzing ? { opacity: [1, 0] } : { opacity: 1 }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                  className={`w-1.5 h-1.5 rounded-full ${
                    isRecording ? 'bg-red-500'
                    : isAnalyzing ? 'bg-amber-500'
                    : hasResult ? 'bg-emerald-500'
                    : 'bg-gray-400'
                  }`}
                />
                {isRecording ? 'Recording' : isAnalyzing ? 'Analyzing' : hasResult ? 'Complete' : 'Ready'}
              </div>
              {/* Model badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#0099bb]">
                <i className="ri-cpu-line" />
                Wav2Vec2 Model · 84.00% Acc
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="grid xl:grid-cols-5 gap-6">

            {/* ── LEFT PANEL ── */}
            <div className="xl:col-span-2 flex flex-col gap-6">

              {/* Recording card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base font-semibold text-navy">Microphone Input</h2>
                  {isRecording && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-full border border-red-200"
                    >
                      <motion.div animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {formatTime(recordingTime)}
                    </motion.div>
                  )}
                </div>

                <RecordingButton
                  isRecording={isRecording}
                  isAnalyzing={isAnalyzing}
                  onToggle={handleToggleRecording}
                />

                {/* Waveform */}
                <div className="mt-6">
                  <WaveformVisualizer
                    isRecording={isRecording}
                    isAnalyzing={isAnalyzing}
                    hasResult={hasResult}
                  />
                </div>

                {/* Tips */}
                {stage === 'idle' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-5 grid grid-cols-2 gap-2"
                  >
                    {[
                      { icon: 'ri-mic-2-line',       text: 'Speak clearly' },
                      { icon: 'ri-volume-up-line',    text: 'Normal volume' },
                      { icon: 'ri-time-line',         text: '3–10 seconds' },
                      { icon: 'ri-translate-2',       text: 'Kannada only' },
                    ].map((tip) => (
                      <div key={tip.text} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                        <i className={`${tip.icon} text-sm text-gray-400`} />
                        <span className="text-xs text-gray-500">{tip.text}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Upload card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-semibold text-navy mb-4">Upload Audio File</h2>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                    dragOver
                      ? 'border-[#00d4ff] bg-[#00d4ff]/5 scale-[1.01]'
                      : 'border-gray-200 hover:border-[#00d4ff]/60 hover:bg-gray-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".wav,.mp3,.ogg"
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }}
                  />
                  <div className="w-12 h-12 bg-gradient-to-br from-[#00d4ff]/20 to-[#8b5cf6]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <i className="ri-upload-cloud-2-line text-2xl text-[#00d4ff]" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Drop your audio file here</p>
                  <p className="text-xs text-gray-400">Supports .wav · .mp3 · .ogg</p>
                </div>

                {/* Format info */}
                <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <i className="ri-information-line text-amber-500 text-sm flex-shrink-0" />
                  <p className="text-xs text-amber-700">Best results with 16kHz mono .wav files recorded in Kannada</p>
                </div>
              </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="xl:col-span-3 flex flex-col gap-6">

              {/* Analysis pipeline */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold text-navy">ML Processing Pipeline</h2>
                  {isAnalyzing && (
                    <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      Processing…
                    </span>
                  )}
                  {hasResult && (
                    <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <i className="ri-check-line mr-1" />Complete
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {featureSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                        <motion.div
                          animate={
                            isAnalyzing && !step.done
                              ? { boxShadow: ['0 0 0 0 rgba(0,212,255,0)', '0 0 0 6px rgba(0,212,255,0.2)', '0 0 0 0 rgba(0,212,255,0)'] }
                              : {}
                          }
                          transition={{ duration: 1.2, repeat: Infinity }}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                            step.done
                              ? 'bg-emerald-500 text-white'
                              : isAnalyzing && featureSteps.findIndex((s) => !s.done) === i
                              ? 'bg-[#00d4ff] text-white'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {step.done
                            ? <i className="ri-check-line text-sm" />
                            : <i className={`${step.icon} text-sm`} />
                          }
                        </motion.div>
                        <span className="text-[10px] text-center text-gray-500 leading-tight line-clamp-2">{step.label}</span>
                      </div>
                      {i < featureSteps.length - 1 && (
                        <div className={`h-px w-4 flex-shrink-0 mb-4 transition-colors duration-300 ${step.done ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Result or placeholder */}
              <AnimatePresence mode="wait">
                {hasResult && detectedEmotion ? (
                  <EmotionResultCard
                    key="result"
                    detectedEmotion={detectedEmotion}
                    confidence={confidence}
                    emotions={resultEmotions}
                  />
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 flex flex-col items-center justify-center text-center"
                  >
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                      <i className="ri-emotion-line text-3xl text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-400">Emotion result will appear here</p>
                    <p className="text-xs text-gray-300 mt-1">Start recording or upload an audio file to begin</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Feature extraction info */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-semibold text-navy mb-4">Extracted Acoustic Features</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'MFCC',              value: acousticFeatures ? acousticFeatures.mfcc.toFixed(4)          : '—', icon: 'ri-sound-module-line',  color: 'text-[#00d4ff]', bg: 'bg-[#00d4ff]/10' },
                    { label: 'Pitch (F0)',         value: acousticFeatures ? `${acousticFeatures.pitch.toFixed(1)} Hz` : '—', icon: 'ri-equalizer-line',     color: 'text-[#8b5cf6]', bg: 'bg-[#8b5cf6]/10' },
                    { label: 'Energy (RMS)',       value: acousticFeatures ? acousticFeatures.energy.toFixed(5)        : '—', icon: 'ri-flashlight-line',    color: 'text-amber-500', bg: 'bg-amber-50'      },
                    { label: 'Intensity',          value: acousticFeatures ? `${acousticFeatures.intensity.toFixed(1)} Hz` : '—', icon: 'ri-volume-up-line', color: 'text-emerald-500', bg: 'bg-emerald-50'  },
                    { label: 'Zero Crossing Rate', value: acousticFeatures ? acousticFeatures.zcr.toFixed(5)           : '—', icon: 'ri-pulse-line',         color: 'text-rose-500',  bg: 'bg-rose-50'       },
                    { label: 'Duration',           value: acousticFeatures ? `${acousticFeatures.duration.toFixed(2)}s` : '—', icon: 'ri-time-line',         color: 'text-orange-500', bg: 'bg-orange-50'    },
                  ].map((feat) => (
                    <div key={feat.label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className={`w-8 h-8 ${feat.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <i className={`${feat.icon} text-sm ${feat.color}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{feat.label}</div>
                        <div className={`text-sm font-semibold mt-0.5 ${hasResult ? 'text-navy' : 'text-gray-300'}`}>{feat.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
