import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import {
  api,
  type VisualizationResponse,
} from '../../api/client';

export default function AudioVisualizationPage() {
  const { user } = useAuth();
  const [selectedVisualization, setSelectedVisualization] = useState('waveform');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [signal, setSignal] = useState<VisualizationResponse | null>(null);

  const visualizationTypes = [
    { id: 'waveform', name: 'Waveform', icon: 'ri-sound-module-line' },
    { id: 'pitch', name: 'Pitch Analysis', icon: 'ri-music-line' },
    { id: 'mfcc', name: 'MFCC Coefficients', icon: 'ri-bar-chart-horizontal-line' },
    { id: 'frequency', name: 'Frequency Analysis', icon: 'ri-equalizer-line' },
    { id: 'energy', name: 'Energy', icon: 'ri-flashlight-line' },
    { id: 'zcr', name: 'Zero Crossing Rate', icon: 'ri-pulse-line' }
  ];

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;
    setLoading(true);
    setApiError(null);
    try {
      const data = await api.visualization.extract(file);
      setSignal(data);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to load visualization data');
    } finally {
      setLoading(false);
    }
  };

  const waveformData = signal?.waveformData ?? [];
  const pitchData = signal?.pitchData ?? [];
  const mfccData = signal?.mfccData ?? [];
  const frequencyData = signal?.frequencyData ?? [];
  const energyData = signal?.energyData ?? [];
  const zcrData = signal?.zcrData ?? [];

  const renderVisualization = () => {
    switch (selectedVisualization) {
      case 'waveform':
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Audio Waveform</h3>
            <p className="text-sm text-slate-600 mb-6">
              Time-domain representation of the audio signal amplitude
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={waveformData}>
                <defs>
                  <linearGradient id="waveformGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="time"
                  label={{ value: 'Time (ms)', position: 'insideBottom', offset: -5 }}
                  stroke="#64748b"
                />
                <YAxis
                  label={{ value: 'Amplitude', angle: -90, position: 'insideLeft' }}
                  stroke="#64748b"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amplitude"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#waveformGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );

      case 'pitch':
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Pitch Over Time</h3>
            <p className="text-sm text-slate-600 mb-6">
              Fundamental frequency variation throughout the speech signal
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={pitchData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="time"
                  label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }}
                  stroke="#64748b"
                />
                <YAxis
                  label={{ value: 'Pitch (Hz)', angle: -90, position: 'insideLeft' }}
                  stroke="#64748b"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="pitch"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'mfcc':
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              MFCC Coefficients
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Mel-Frequency Cepstral Coefficients representing spectral characteristics
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={mfccData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" />
                <YAxis
                  dataKey="coefficient"
                  type="category"
                  width={80}
                  stroke="#64748b"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="value" fill="#06b6d4" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'frequency':
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Frequency Analysis
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Frequency spectrum showing magnitude and phase components
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={frequencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="frequency"
                  label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -5 }}
                  stroke="#64748b"
                />
                <YAxis
                  yAxisId="left"
                  label={{ value: 'Magnitude', angle: -90, position: 'insideLeft' }}
                  stroke="#64748b"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  label={{ value: 'Phase', angle: 90, position: 'insideRight' }}
                  stroke="#64748b"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="magnitude" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="phase"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );

      case 'energy':
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Energy Over Time</h3>
            <p className="text-sm text-slate-600 mb-6">
              Signal energy variation indicating speech intensity
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={energyData}>
                <defs>
                  <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="time"
                  label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }}
                  stroke="#64748b"
                />
                <YAxis
                  label={{ value: 'Energy', angle: -90, position: 'insideLeft' }}
                  stroke="#64748b"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="energy"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#energyGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );

      case 'zcr':
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Zero Crossing Rate
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Rate at which signal changes sign, useful for detecting voiced/unvoiced speech
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={zcrData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="time"
                  label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }}
                  stroke="#64748b"
                />
                <YAxis
                  label={{ value: 'ZCR', angle: -90, position: 'insideLeft' }}
                  stroke="#64748b"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="zcr"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
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
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <i className="ri-upload-cloud-line text-lg"></i>
            <span>Upload Audio</span>
          </a>
          <a
            href="/visualization"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white"
          >
            <i className="ri-line-chart-line text-lg"></i>
            <span>Audio Visualization</span>
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
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <i className="ri-logout-box-line"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Audio Visualization</h1>
            <p className="text-slate-600">
              Upload one audio file to render real extracted signal data
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-6"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Upload Audio for Real Visualization</h3>
                <p className="text-sm text-slate-500 mt-1">Supports .wav .mp3 .ogg .flac .m4a .webm</p>
                {signal && (
                  <p className="text-xs text-emerald-600 mt-2">
                    Loaded: {signal.audioFile} | {signal.duration.toFixed(2)}s | {signal.sampleRate} Hz
                  </p>
                )}
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg cursor-pointer hover:bg-cyan-700 transition-colors">
                <i className="ri-upload-cloud-line" />
                <span>{loading ? 'Extracting...' : 'Choose Audio'}</span>
                <input
                  type="file"
                  accept=".wav,.mp3,.ogg,.flac,.m4a,.webm,audio/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files?.[0] ?? null)}
                  disabled={loading}
                />
              </label>
            </div>
            {apiError && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {apiError}
              </div>
            )}
          </motion.div>

          {/* Visualization Type Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-6"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Select Visualization Type
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {visualizationTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedVisualization(type.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all whitespace-nowrap ${
                    selectedVisualization === type.id
                      ? 'border-cyan-500 bg-gradient-to-br from-cyan-50 to-purple-50 shadow-md'
                      : 'border-slate-200 hover:border-cyan-300 hover:bg-slate-50'
                  }`}
                >
                  <i
                    className={`${type.icon} text-2xl ${
                      selectedVisualization === type.id
                        ? 'text-cyan-600'
                        : 'text-slate-600'
                    }`}
                  ></i>
                  <span
                    className={`text-xs font-medium text-center ${
                      selectedVisualization === type.id
                        ? 'text-cyan-700'
                        : 'text-slate-700'
                    }`}
                  >
                    {type.name}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Visualization Display */}
          <motion.div
            key={selectedVisualization}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {!signal ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-slate-500">
                <i className="ri-file-upload-line text-4xl mb-3 block text-slate-400" />
                Upload an audio file to generate real signal charts.
              </div>
            ) : (
              renderVisualization()
            )}
          </motion.div>

          {/* Feature Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-lg flex items-center justify-center mb-4">
                <i className="ri-time-line text-2xl text-cyan-600"></i>
              </div>
              <h4 className="text-lg font-semibold text-slate-900 mb-2">
                Time Domain
              </h4>
              <p className="text-sm text-slate-600">
                Waveform and energy features capture temporal characteristics of speech
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center mb-4">
                <i className="ri-sound-module-line text-2xl text-purple-600"></i>
              </div>
              <h4 className="text-lg font-semibold text-slate-900 mb-2">
                Frequency Domain
              </h4>
              <p className="text-sm text-slate-600">
                MFCC and frequency analysis reveal spectral patterns in speech
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center mb-4">
                <i className="ri-brain-line text-2xl text-green-600"></i>
              </div>
              <h4 className="text-lg font-semibold text-slate-900 mb-2">
                ML Features
              </h4>
              <p className="text-sm text-slate-600">
                Combined features feed into machine learning models for emotion detection
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}