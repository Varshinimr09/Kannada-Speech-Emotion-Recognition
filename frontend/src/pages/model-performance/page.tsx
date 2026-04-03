import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Breadcrumb from '../../components/Breadcrumb';
import {
  performanceMetrics,
  trainingHistory,
  modelComparison,
  confusionMatrix,
  emotionLabels,
  featureImportance,
  emotionAccuracy,
  confusionHeatmapData
} from '../../mocks/modelPerformance';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
  RadialBarChart, RadialBar, ScatterChart, Scatter, ZAxis
} from 'recharts';

const maxConfusionValue = Math.max(...confusionMatrix.flat());

function getConfusionColor(value: number, max: number): string {
  const ratio = value / max;
  if (ratio >= 0.9) return '#0891b2';
  if (ratio >= 0.7) return '#06b6d4';
  if (ratio >= 0.5) return '#22d3ee';
  if (ratio >= 0.3) return '#67e8f9';
  if (ratio >= 0.1) return '#a5f3fc';
  return '#e0f2fe';
}

// Animated counter component
function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCount(Math.floor(progress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{count}</span>;
}

// Custom tooltip for confusion matrix
function ConfusionTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { actual: string; predicted: string; value: number } }> }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-cyan-500/30">
        <p className="font-semibold text-sm mb-1">Actual: {data.actual}</p>
        <p className="font-semibold text-sm mb-1">Predicted: {data.predicted}</p>
        <p className="text-cyan-400 font-bold text-lg">{data.value} samples</p>
      </div>
    );
  }
  return null;
}

export default function ModelPerformancePage() {
  // Prepare radial gauge data
  const gaugeData = [
    { name: 'Accuracy', value: performanceMetrics.accuracy, fill: '#10b981', icon: 'check-double' },
    { name: 'Precision', value: performanceMetrics.precision, fill: '#06b6d4', icon: 'focus' },
    { name: 'Recall', value: performanceMetrics.recall, fill: '#8b5cf6', icon: 'search-eye' },
    { name: 'F1 Score', value: performanceMetrics.f1Score, fill: '#f59e0b', icon: 'star' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1">
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <Breadcrumb />
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-navy">Model Performance</h1>
              <p className="text-gray-600 mt-1">Evaluation metrics and model comparison</p>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Animated Radial Gauge Meters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {gaugeData.map((metric, index) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col items-center">
                  <div className="relative w-40 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="70%"
                        outerRadius="100%"
                        barSize={12}
                        data={[{ value: metric.value, fill: metric.fill }]}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <RadialBar
                          background={{ fill: '#e2e8f0' }}
                          dataKey="value"
                          cornerRadius={10}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <i className={`ri-${metric.icon}-line text-3xl mb-1`} style={{ color: metric.fill }}></i>
                      <span className="text-3xl font-bold text-slate-800">
                        <AnimatedCounter value={metric.value} />%
                      </span>
                    </div>
                  </div>
                  <h3 className="text-slate-700 font-semibold text-lg mt-4">{metric.name}</h3>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Training History Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-lg mb-8"
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <i className="ri-line-chart-line text-cyan-500"></i>
              Training Progress Over Epochs
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trainingHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="epoch" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="accuracy" stroke="#06b6d4" strokeWidth={3} name="Accuracy (%)" dot={{ fill: '#06b6d4', r: 5 }} />
                <Line type="monotone" dataKey="loss" stroke="#a855f7" strokeWidth={3} name="Loss" dot={{ fill: '#a855f7', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Model Comparison Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-lg mb-8"
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <i className="ri-bar-chart-grouped-line text-purple-500"></i>
              Model Comparison
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={modelComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="model" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="accuracy" fill="#06b6d4" name="Accuracy" radius={[8, 8, 0, 0]} />
                <Bar dataKey="precision" fill="#8b5cf6" name="Precision" radius={[8, 8, 0, 0]} />
                <Bar dataKey="recall" fill="#ec4899" name="Recall" radius={[8, 8, 0, 0]} />
                <Bar dataKey="f1" fill="#f59e0b" name="F1 Score" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Interactive Confusion Matrix Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <i className="ri-grid-line text-emerald-500"></i>
                Confusion Matrix
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Predicted"
                    domain={[-0.5, 5.5]}
                    ticks={[0, 1, 2, 3, 4, 5]}
                    tickFormatter={(value) => emotionLabels[value]}
                    stroke="#64748b"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Actual"
                    domain={[-0.5, 5.5]}
                    ticks={[0, 1, 2, 3, 4, 5]}
                    tickFormatter={(value) => emotionLabels[value]}
                    stroke="#64748b"
                    width={80}
                    reversed
                  />
                  <ZAxis type="number" dataKey="value" range={[400, 2000]} />
                  <Tooltip content={<ConfusionTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={confusionHeatmapData} shape="circle">
                    {confusionHeatmapData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getConfusionColor(entry.value, maxConfusionValue)} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              
              {/* Color intensity legend */}
              <div className="mt-6 flex items-center justify-center gap-2">
                <span className="text-xs text-slate-600 font-medium">Low</span>
                <div className="flex gap-1">
                  {[0.1, 0.3, 0.5, 0.7, 0.9].map((ratio) => (
                    <div
                      key={ratio}
                      className="w-8 h-4 rounded"
                      style={{ backgroundColor: getConfusionColor(ratio * maxConfusionValue, maxConfusionValue) }}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-600 font-medium">High</span>
              </div>
              <p className="text-xs text-slate-500 mt-4 text-center">Hover over cells to see details</p>
            </motion.div>

            {/* Feature Importance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <i className="ri-bar-chart-horizontal-line text-blue-500"></i>
                Feature Importance
              </h2>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={featureImportance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" />
                  <YAxis dataKey="feature" type="category" stroke="#64748b" width={150} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                  />
                  <Bar dataKey="importance" radius={[0, 8, 8, 0]}>
                    {featureImportance.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'][index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Per-Emotion Accuracy Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl p-6 shadow-lg mb-8"
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <i className="ri-emotion-line text-pink-500"></i>
              Per-Emotion Recognition Accuracy
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={emotionAccuracy}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="emotion" stroke="#64748b" />
                <YAxis stroke="#64748b" domain={[70, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: number) => `${value}%`}
                />
                <Bar dataKey="accuracy" fill="#06b6d4" radius={[8, 8, 0, 0]}>
                  {emotionAccuracy.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#a855f7', '#64748b'][index]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Model Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <i className="ri-table-line text-indigo-500"></i>
              Detailed Model Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Model</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-700">Accuracy</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-700">Precision</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-700">Recall</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-700">F1 Score</th>
                  </tr>
                </thead>
                <tbody>
                  {modelComparison.map((model, index) => (
                    <tr key={model.model} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                            index === 0 ? 'from-cyan-500 to-blue-500' : index === 1 ? 'from-purple-500 to-pink-500' : 'from-emerald-500 to-teal-500'
                          } flex items-center justify-center`}>
                            <i className="ri-cpu-line text-xl text-white"></i>
                          </div>
                          <span className="font-semibold text-slate-800">{model.model}</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-4 font-semibold text-slate-700">{model.accuracy}%</td>
                      <td className="text-center py-4 px-4 font-semibold text-slate-700">{model.precision}%</td>
                      <td className="text-center py-4 px-4 font-semibold text-slate-700">{model.recall}%</td>
                      <td className="text-center py-4 px-4 font-semibold text-slate-700">{model.f1}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}