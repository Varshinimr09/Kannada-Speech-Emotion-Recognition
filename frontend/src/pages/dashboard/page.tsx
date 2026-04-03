import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { emotionCategories } from '../../mocks/emotions';
import { api } from '../../api/client';
import type { DashboardStats } from '../../api/client';
import Sidebar from '../../components/Sidebar';
import Breadcrumb from '../../components/Breadcrumb';

const EMOTION_EMOJI: Record<string, string> = {
  happy: '😊', happiness: '😊',
  sad: '😢', sadness: '😢',
  angry: '😠', anger: '😠',
  fear: '😨',
  neutral: '😐',
};

const EMOTION_COLOR: Record<string, string> = {
  happy: '#fbbf24', happiness: '#fbbf24',
  sad: '#3b82f6', sadness: '#3b82f6',
  angry: '#ef4444', anger: '#ef4444',
  fear: '#8b5cf6',
  neutral: '#6b7280',
};

function fmt(emotion: string) {
  return emotion.charAt(0).toUpperCase() + emotion.slice(1).toLowerCase();
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.stats.dashboard()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const totalPredictions = stats?.totalPredictions ?? 0;
  const modelAccuracy    = stats ? `${stats.modelAccuracy.toFixed(1)}%` : '—';
  const correctPreds     = stats?.correctPredictions ?? 0;

  const statCards = [
    { label: 'Total Predictions',   value: loading ? '…' : totalPredictions.toLocaleString(), icon: 'ri-emotion-line',   color: 'from-blue-500 to-cyan-500',    trend: '' },
    { label: 'Model Accuracy',       value: loading ? '…' : modelAccuracy,                     icon: 'ri-check-line',      color: 'from-green-500 to-emerald-500', trend: '' },
    { label: 'Correct Predictions',  value: loading ? '…' : correctPreds.toLocaleString(),     icon: 'ri-thumb-up-line',   color: 'from-purple-500 to-pink-500',   trend: '' },
    { label: 'Emotions Tracked',     value: '5',                                                icon: 'ri-user-line',       color: 'from-orange-500 to-red-500',    trend: '' },
  ];

  // Compute emotion distribution percentages from real data
  const dist = stats?.emotionDistribution ?? [];
  const distTotal = dist.reduce((s, d) => s + d.count, 0);
  const emotionDistribution = dist.map((d) => ({
    emotion:    fmt(d.emotion),
    percentage: distTotal > 0 ? Math.round((d.count / distTotal) * 1000) / 10 : 0,
    color:      EMOTION_COLOR[d.emotion.toLowerCase()] ?? '#94a3b8',
  }));

  const recentPredictions = stats?.recentPredictions ?? [];

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <Breadcrumb />
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-navy">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome to Kannada Speech Emotion Recognition Platform</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                />
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              </div>
              <button className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer">
                <i className="ri-notification-3-line text-xl text-gray-600"></i>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                    <i className={`${stat.icon} text-2xl text-white`}></i>
                  </div>
                </div>
                <div className="text-3xl font-bold text-navy mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Emotion Categories */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
            <h2 className="text-xl font-display font-semibold text-navy mb-6">Emotion Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {emotionCategories.map((emotion) => (
                <div
                  key={emotion.id}
                  className="bg-gray-50 rounded-lg p-4 text-center hover:shadow-md transition-all cursor-pointer border border-gray-100"
                  style={{ borderColor: `${emotion.color}20` }}
                >
                  <div className="text-4xl mb-2">{emotion.emoji}</div>
                  <div className="text-sm font-medium text-gray-700">{emotion.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Emotion Distribution */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-display font-semibold text-navy mb-6">Emotion Distribution</h2>
              <div className="space-y-4">
                {(['Happy', 'Sad', 'Angry', 'Fear', 'Neutral'] as const).map((name) => {
                  const key = name.toLowerCase();
                  const match = emotionDistribution.find(d => d.emotion.toLowerCase() === key);
                  const pct = match?.percentage ?? 0;
                  const color = EMOTION_COLOR[key] ?? '#94a3b8';
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{name}</span>
                        <span className="text-sm font-semibold text-navy">{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Predictions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-semibold text-navy">Recent Predictions</h2>
                <Link to="/prediction-history" className="text-sm text-primary hover:text-primary-dark font-medium cursor-pointer whitespace-nowrap">
                  View All <i className="ri-arrow-right-line"></i>
                </Link>
              </div>
              <div className="space-y-4">
                {recentPredictions.length === 0 ? (
                  <p className="text-sm text-gray-400">No predictions yet.</p>
                ) : recentPredictions.map((p) => (
                  <div key={p.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="text-3xl">{EMOTION_EMOJI[p.emotion.toLowerCase()] ?? '🎤'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{p.audioFile}</div>
                      <div className="text-xs text-gray-500">{p.timestamp ? new Date(p.timestamp).toLocaleString() : ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-navy">{p.confidence > 1 ? p.confidence.toFixed(1) : (p.confidence * 100).toFixed(1)}%</div>
                      <div className="text-xs text-gray-500">{fmt(p.emotion)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              to="/live-detection"
              className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
            >
              <i className="ri-mic-line text-4xl mb-4"></i>
              <h3 className="text-lg font-semibold mb-2">Start Live Detection</h3>
              <p className="text-sm text-white/80">Record and analyze Kannada speech in real-time</p>
            </Link>

            <Link
              to="/upload-audio"
              className="bg-gradient-to-br from-secondary to-secondary-dark text-white rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
            >
              <i className="ri-upload-cloud-line text-4xl mb-4"></i>
              <h3 className="text-lg font-semibold mb-2">Upload Audio File</h3>
              <p className="text-sm text-white/80">Upload .wav files for emotion analysis</p>
            </Link>

            <Link
              to="/model-performance"
              className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
            >
              <i className="ri-bar-chart-box-line text-4xl mb-4"></i>
              <h3 className="text-lg font-semibold mb-2">View Performance</h3>
              <p className="text-sm text-white/80">Check model accuracy and metrics</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}