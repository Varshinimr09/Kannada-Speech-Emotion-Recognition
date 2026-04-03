import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import {
  datasetSplit,
  featureInfo,
  sampleAudioEntries,
  featureCoverage
} from "../../mocks/datasetInfo";
import { api } from "../../api/client";
import type { DatasetStats } from "../../api/client";
import Sidebar from "../../components/Sidebar";
import Breadcrumb from "../../components/Breadcrumb";

const EMOTION_META: Record<string, { label: string; fill: string }> = {
  anger:     { label: "Angry",    fill: "#ef4444" },
  fear:      { label: "Fear",     fill: "#f59e0b" },
  happiness: { label: "Happy",    fill: "#10b981" },
  neutral:   { label: "Neutral",  fill: "#6b7280" },
  sadness:   { label: "Sad",      fill: "#3b82f6" },
};

function formatDuration(totalSamples: number): string {
  // avg sample length is 4 s (model pads/trims to 4 s)
  const totalSeconds = totalSamples * 4;
  const hours = (totalSeconds / 3600).toFixed(1);
  return `${hours} hours`;
}

export default function DatasetInfo() {
  const [data, setData] = useState<DatasetStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.stats.dataset()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const combinedTotal = data ? data.combinedTotal : 0;

  // Bar chart: combined (original + augmented) per emotion
  const samplesPerEmotion = data
    ? data.emotions.map((e) => ({
        emotion: EMOTION_META[e]?.label ?? e,
        samples: (data.originalCounts[e] ?? 0) + (data.augmentedCounts[e] ?? 0),
        fill:    EMOTION_META[e]?.fill ?? "#94a3b8",
      }))
    : [];

  // Real split from manifests
  const realSplit = data && data.trainTotal
    ? [
        { name: "Train",      value: data.trainTotal, fill: "#00d4ff" },
        { name: "Validation", value: data.valTotal,   fill: "#8b5cf6" },
        { name: "Test",       value: data.testTotal,  fill: "#10b981" },
      ]
    : null;

  const statCards = [
    { label: "Total Samples (incl. aug)", value: loading ? "…" : combinedTotal.toLocaleString(), icon: "file-music",  color: "from-cyan-500 to-blue-500"    },
    { label: "Original Samples",          value: loading ? "…" : (data?.originalTotal ?? 0).toLocaleString(), icon: "user-voice",  color: "from-purple-500 to-pink-500"  },
    { label: "Total Duration",            value: loading ? "…" : formatDuration(data?.originalTotal ?? 0), icon: "time",        color: "from-green-500 to-emerald-500" },
    { label: "Avg Duration",              value: "4.0s",                                                     icon: "speed",       color: "from-orange-500 to-red-500"   },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Breadcrumb />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Dataset Information</h1>
            <p className="text-slate-600">Kannada Emotional Speech Dataset Overview</p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <i className={`ri-${stat.icon}-line text-2xl text-white`}></i>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</h3>
                <p className="text-sm text-slate-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Samples Per Emotion */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-6">Samples Per Emotion</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={samplesPerEmotion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="emotion" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                    }}
                  />
                  <Bar dataKey="samples" radius={[8, 8, 0, 0]}>
                    {samplesPerEmotion.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Dataset Split */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-6">Dataset Split</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={realSplit ?? datasetSplit}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={realSplit
                      ? ({ name, value }) => `${name}: ${value.toLocaleString()}`
                      : ({ name, value }) => `${name}: ${value}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(realSplit ?? datasetSplit).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value.toLocaleString()} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Feature Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-6">Feature Extraction Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featureInfo.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="p-6 rounded-xl bg-gradient-to-br from-slate-50 to-cyan-50 border border-slate-200"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center mb-4">
                    <i className="ri-sound-module-line text-2xl text-white"></i>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">{feature.name}</h4>
                  <p className="text-xs text-slate-600 mb-3">{feature.fullName}</p>
                  <p className="text-sm text-slate-700 mb-3">{feature.description}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-cyan-600">
                      {feature.coefficients && `${feature.coefficients} coefficients`}
                      {feature.range && feature.range}
                      {feature.unit && feature.unit}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Feature Coverage & Sample Entries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Feature Coverage Radar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-6">Feature Coverage</h3>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={featureCoverage}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="feature" stroke="#64748b" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#64748b" />
                  <Radar
                    name="Coverage %"
                    dataKey="coverage"
                    stroke="#00d4ff"
                    fill="#00d4ff"
                    fillOpacity={0.6}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                    }}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Sample Audio Entries */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-6">Sample Audio Entries</h3>
              <div className="space-y-3 max-h-[350px] overflow-y-auto">
                {sampleAudioEntries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.05 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-cyan-50 border border-slate-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900">{entry.id}</span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 whitespace-nowrap">
                        {entry.emotion}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                      <div>
                        <i className="ri-folder-music-line mr-2"></i>
                        {entry.folder}
                      </div>
                      <div>
                        <i className="ri-time-line mr-2"></i>
                        {entry.duration}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}