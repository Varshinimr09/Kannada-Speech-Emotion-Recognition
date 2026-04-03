import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadialBarChart, RadialBar, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { usePredictionHistory } from '../../contexts/PredictionHistoryContext';
import { api } from '../../api/client';

const EMOTION_COLORS: Record<string, string> = {
  happy: '#10b981',
  sad: '#3b82f6',
  angry: '#ef4444',
  fear: '#f59e0b',
  neutral: '#6b7280'
};

const EMOTION_ICONS: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  fear: '😨',
  neutral: '😐'
};

type ProcessingStage = 'uploading' | 'processing' | 'extracting' | 'classifying' | 'complete';

export default function UploadAudioPage() {
  const { user } = useAuth();
  const { addPrediction } = usePredictionHistory();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentStage, setCurrentStage] = useState<ProcessingStage | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string>('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showCopyToast, setShowCopyToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    validateAndSetFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.wav')) {
      setErrorMessage('Invalid file format. Please upload a .wav file only.');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }
    setSelectedFile(file);
    setAnalysisResult(null);
    setCloudinaryUrl('');
    setCurrentStage(null);
    setUploadProgress(0);
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;

    setCurrentStage('uploading');
    setUploadProgress(0);

    // Animate progress bar while waiting for the server
    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => (prev >= 90 ? 90 : prev + 4));
    }, 150);

    try {
      setCurrentStage('uploading');

      // Transition through stages for visual feedback while awaiting API
      setTimeout(() => setCurrentStage('processing'), 1000);
      setTimeout(() => setCurrentStage('extracting'), 2200);
      setTimeout(() => setCurrentStage('classifying'), 3400);

      const result = await api.predict.upload(selectedFile);

      clearInterval(uploadInterval);
      setUploadProgress(100);

      setCloudinaryUrl(result.cloudinary_url);
      setAnalysisResult({
        emotion:          result.emotion,
        confidence:       result.confidence,
        probabilities:    result.probabilities,
        acousticFeatures: result.acoustic_features,
        timestamp:        result.timestamp,
      });

      addPrediction(result);
      setCurrentStage('complete');
    } catch (err: any) {
      clearInterval(uploadInterval);
      setCurrentStage(null);
      setUploadProgress(0);
      setErrorMessage(err.message || 'Failed to analyze audio. Please try again.');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setCloudinaryUrl('');
    setCurrentStage(null);
    setUploadProgress(0);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cloudinaryUrl);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getStageLabel = (stage: ProcessingStage) => {
    const labels = {
      uploading: 'Uploading to Cloudinary',
      processing: 'Processing Audio',
      extracting: 'Extracting Features',
      classifying: 'Classifying Emotion',
      complete: 'Analysis Complete'
    };
    return labels[stage];
  };

  const isStageActive = (stage: ProcessingStage) => {
    const stages: ProcessingStage[] = ['uploading', 'processing', 'extracting', 'classifying', 'complete'];
    const currentIndex = stages.indexOf(currentStage!);
    const stageIndex = stages.indexOf(stage);
    return stageIndex <= currentIndex;
  };

  const confidenceData = analysisResult ? [
    {
      name: 'Confidence',
      value: analysisResult.confidence,
      fill: EMOTION_COLORS[analysisResult.emotion]
    }
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Error Toast */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <i className="ri-error-warning-line text-2xl"></i>
            <span className="font-medium">{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Copy Toast */}
      <AnimatePresence>
        {showCopyToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <i className="ri-check-line text-2xl"></i>
            <span className="font-medium">URL copied to clipboard!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-screen">
        <div className="p-6 border-b border-slate-700">
          <a href="/" className="inline-block hover:opacity-90 transition-opacity">
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Kannada Speech AI
            </h1>
          </a>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <a
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <i className="ri-dashboard-line text-lg"></i>
            <span>Dashboard</span>
          </a>
          <a
            href="/live-detection"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <i className="ri-mic-line text-lg"></i>
            <span>Live Detection</span>
          </a>
          <a
            href="/upload-audio"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white"
          >
            <i className="ri-upload-cloud-line text-lg"></i>
            <span>Upload Audio</span>
          </a>
          <a
            href="/visualization"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <i className="ri-line-chart-line text-lg"></i>
            <span>Audio Visualization</span>
          </a>
          <a
            href="/prediction-history"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <i className="ri-history-line text-lg"></i>
            <span>Prediction History</span>
          </a>
          <a
            href="/model-performance"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <i className="ri-bar-chart-box-line text-lg"></i>
            <span>Model Performance</span>
          </a>
          <a
            href="/dataset-info"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <i className="ri-database-2-line text-lg"></i>
            <span>Dataset Info</span>
          </a>
          <a
            href="/about"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <i className="ri-information-line text-lg"></i>
            <span>About</span>
          </a>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-400 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              window.location.href = '/login';
            }}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-logout-box-line"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Upload Audio</h1>
            <p className="text-slate-600">
              Upload Kannada speech audio files (.wav) for emotion analysis
            </p>
          </div>

          {/* Upload Zone */}
          {!selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-8 mb-6"
            >
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-3 border-dashed rounded-xl p-16 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-cyan-500 bg-cyan-50 shadow-lg shadow-cyan-200'
                    : 'border-slate-300 hover:border-cyan-400 hover:bg-slate-50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <motion.div
                  animate={isDragging ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                  className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-cyan-100 to-purple-100 rounded-full flex items-center justify-center"
                >
                  <i className="ri-upload-cloud-2-line text-5xl text-cyan-600"></i>
                </motion.div>
                <h3 className="text-2xl font-semibold text-slate-900 mb-3">
                  {isDragging ? 'Drop to upload' : 'Drop your audio file here'}
                </h3>
                <p className="text-slate-600 mb-4 text-lg">or click to browse</p>
                <p className="text-sm text-slate-500">Supports .wav files only • Max 50MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".wav"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {isDragging && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-cyan-500/10 rounded-xl border-4 border-cyan-500 pointer-events-none"
                  />
                )}
              </div>
            </motion.div>
          )}

          {/* File Preview & Processing */}
          {selectedFile && !analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-8 mb-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-6">File Preview</h3>
              <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <i className="ri-file-music-line text-3xl text-white"></i>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 text-lg">{selectedFile.name}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Size: {formatFileSize(selectedFile.size)} • Duration: ~
                    {(selectedFile.size / 32000).toFixed(1)}s
                  </p>
                </div>
                {!currentStage && (
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                )}
              </div>

              {/* Processing Pipeline */}
              {currentStage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-8"
                >
                  <h4 className="text-md font-semibold text-slate-900 mb-4">Processing Pipeline</h4>
                  
                  {/* Progress Bar */}
                  {currentStage === 'uploading' && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Uploading to Cloudinary...</span>
                        <span className="text-sm font-semibold text-cyan-600">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.3 }}
                          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Stage Indicators */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {(['uploading', 'processing', 'extracting', 'classifying'] as ProcessingStage[]).map((stage, index) => (
                      <motion.div
                        key={stage}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          boxShadow: isStageActive(stage) ? '0 0 20px rgba(6, 182, 212, 0.3)' : 'none'
                        }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isStageActive(stage)
                            ? 'border-cyan-500 bg-cyan-50'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isStageActive(stage)
                              ? 'bg-gradient-to-br from-cyan-500 to-purple-500 text-white'
                              : 'bg-slate-300 text-slate-600'
                          }`}>
                            {currentStage === stage ? (
                              <i className="ri-loader-4-line animate-spin text-sm"></i>
                            ) : isStageActive(stage) ? (
                              <i className="ri-check-line text-sm"></i>
                            ) : (
                              <span className="text-xs font-bold">{index + 1}</span>
                            )}
                          </div>
                          <span className={`text-sm font-semibold ${
                            isStageActive(stage) ? 'text-cyan-700' : 'text-slate-500'
                          }`}>
                            {getStageLabel(stage)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Cloudinary URL Display */}
              {cloudinaryUrl && currentStage !== 'uploading' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <i className="ri-cloud-line text-2xl text-green-600"></i>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-green-700 mb-1">Cloudinary URL</p>
                      <p className="text-sm text-green-900 truncate font-mono">{cloudinaryUrl}</p>
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-file-copy-line mr-2"></i>
                      Copy
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Analyze Button */}
              {!currentStage && (
                <button
                  onClick={handleUploadAndAnalyze}
                  className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-xl transition-all whitespace-nowrap cursor-pointer"
                >
                  <span className="flex items-center justify-center gap-2">
                    <i className="ri-brain-line text-xl"></i>
                    Upload & Analyze Emotion
                  </span>
                </button>
              )}
            </motion.div>
          )}

          {/* Analysis Results Panel */}
          {analysisResult && currentStage === 'complete' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Main Result Card */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-slate-900">Analysis Complete</h3>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold"
                  >
                    <i className="ri-check-line mr-1"></i>
                    Success
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Confidence Meter */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-64 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                          cx="50%"
                          cy="50%"
                          innerRadius="70%"
                          outerRadius="100%"
                          data={confidenceData}
                          startAngle={90}
                          endAngle={-270}
                        >
                          <RadialBar
                            background
                            dataKey="value"
                            cornerRadius={10}
                            fill={EMOTION_COLORS[analysisResult.emotion]}
                          />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3, type: 'spring' }}
                          className="text-6xl mb-2"
                        >
                          {EMOTION_ICONS[analysisResult.emotion]}
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="text-4xl font-bold text-slate-900"
                        >
                          {analysisResult.confidence}%
                        </motion.div>
                        <p className="text-sm text-slate-600 mt-1">Confidence</p>
                      </div>
                    </div>
                    <div
                      className="mt-4 px-6 py-3 rounded-xl text-white font-semibold text-lg capitalize"
                      style={{ backgroundColor: EMOTION_COLORS[analysisResult.emotion] }}
                    >
                      {analysisResult.emotion}
                    </div>
                  </div>

                  {/* Probability Bars */}
                  <div>
                    <h4 className="text-md font-semibold text-slate-900 mb-4">Emotion Probabilities</h4>
                    <div className="space-y-3">
                      {analysisResult.probabilities.map((item: any, index: number) => (
                        <motion.div
                          key={item.emotion}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700 capitalize flex items-center gap-2">
                              <span className="text-lg">{EMOTION_ICONS[item.emotion]}</span>
                              {item.emotion}
                            </span>
                            <span className="text-sm font-semibold text-slate-900">{item.probability}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.probability}%` }}
                              transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: EMOTION_COLORS[item.emotion] }}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Acoustic Features */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Acoustic Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'MFCC', value: analysisResult.acousticFeatures.mfcc, unit: 'dB', icon: 'ri-sound-module-line' },
                    { label: 'Pitch', value: analysisResult.acousticFeatures.pitch, unit: 'Hz', icon: 'ri-music-2-line' },
                    { label: 'Energy', value: analysisResult.acousticFeatures.energy, unit: '', icon: 'ri-flashlight-line' },
                    { label: 'Intensity', value: analysisResult.acousticFeatures.intensity, unit: 'dB', icon: 'ri-volume-up-line' },
                    { label: 'ZCR', value: analysisResult.acousticFeatures.zcr, unit: '', icon: 'ri-pulse-line' },
                    { label: 'Duration', value: analysisResult.acousticFeatures.duration, unit: 's', icon: 'ri-timer-line' }
                  ].map((feature, index) => (
                    <motion.div
                      key={feature.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center mb-3">
                        <i className={`${feature.icon} text-white text-lg`}></i>
                      </div>
                      <p className="text-xs text-slate-600 mb-1">{feature.label}</p>
                      <p className="text-lg font-bold text-slate-900">
                        {feature.value}
                        <span className="text-xs text-slate-600 ml-1">{feature.unit}</span>
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={handleReset}
                className="w-full px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer"
              >
                <i className="ri-refresh-line mr-2"></i>
                Analyze Another File
              </button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}