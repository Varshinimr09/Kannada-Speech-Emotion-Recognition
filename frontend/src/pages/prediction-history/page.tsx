import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { usePredictionHistory } from "../../contexts/PredictionHistoryContext";

const emotionConfig: Record<string, { emoji: string; color: string }> = {
  happy:    { emoji: "😊", color: "bg-green-100 text-green-700 border-green-300" },
  happiness:{ emoji: "😊", color: "bg-green-100 text-green-700 border-green-300" },
  sad:      { emoji: "😢", color: "bg-blue-100 text-blue-700 border-blue-300" },
  sadness:  { emoji: "😢", color: "bg-blue-100 text-blue-700 border-blue-300" },
  angry:    { emoji: "😠", color: "bg-red-100 text-red-700 border-red-300" },
  anger:    { emoji: "😠", color: "bg-red-100 text-red-700 border-red-300" },
  fear:     { emoji: "😨", color: "bg-orange-100 text-orange-700 border-orange-300" },
  neutral:  { emoji: "😐", color: "bg-gray-100 text-gray-700 border-gray-300" },
};

const DEFAULT_EMOTION_CFG = { emoji: "🎤", color: "bg-slate-100 text-slate-700 border-slate-300" };
const getEmotionCfg = (e: string) => emotionConfig[e?.toLowerCase()] ?? DEFAULT_EMOTION_CFG;

const EMOTION_COLORS: Record<string, string> = {
  happy: '#10b981',    happiness: '#10b981',
  sad: '#3b82f6',      sadness: '#3b82f6',
  angry: '#ef4444',   anger: '#ef4444',
  fear: '#f59e0b',
  neutral: '#6b7280'
};

export default function PredictionHistory() {
  const { predictions, clearHistory } = usePredictionHistory();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEmotion, setFilterEmotion] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "timestamp", direction: "desc" });
  const [playingId, setPlayingId] = useState<string | null>(null);
  const itemsPerPage = 10;

  const handleLogout = () => {
    window.REACT_APP_NAVIGATE("/login");
  };

  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc"
    });
  };

  const filteredData = useMemo(() => {
    return predictions
      .filter(item => {
        const matchesSearch = item.audioFile.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEmotion = filterEmotion === "all" || item.emotion === filterEmotion;
        return matchesSearch && matchesEmotion;
      })
      .sort((a, b) => {
        const aValue = a[sortConfig.key as keyof typeof a];
        const bValue = b[sortConfig.key as keyof typeof b];
        
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc" 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
      });
  }, [predictions, searchTerm, filterEmotion, sortConfig]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate statistics
  const stats = useMemo(() => {
    const total = predictions.length;
    const avgConfidence = total > 0 
      ? (predictions.reduce((sum, p) => sum + p.confidence, 0) / total).toFixed(1)
      : "0";
    
    const emotionCounts: Record<string, number> = {};
    predictions.forEach(p => {
      emotionCounts[p.emotion] = (emotionCounts[p.emotion] || 0) + 1;
    });
    const mostCommon = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
    
    const today = new Date().toDateString();
    const todayCount = predictions.filter(p => new Date(p.timestamp).toDateString() === today).length;

    return { total, avgConfidence, mostCommon, todayCount };
  }, [predictions]);

  // Calculate emotion distribution for pie chart
  const emotionBreakdown = useMemo(() => {
    const emotionCounts: Record<string, number> = {};
    predictions.forEach(p => {
      emotionCounts[p.emotion] = (emotionCounts[p.emotion] || 0) + 1;
    });

    const total = predictions.length || 1;
    return Object.entries(emotionCounts).map(([emotion, count]) => ({
      emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      value: Math.round((count / total) * 100),
      fill: EMOTION_COLORS[emotion]
    }));
  }, [predictions]);

  const exportToCSV = () => {
    const headers = ["Audio File", "Emotion", "Confidence (%)", "Timestamp", "Duration", "Source"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map(item => 
        [item.audioFile, item.emotion, item.confidence, item.timestamp, item.duration, item.source].join(",")
      )
    ].join("\\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prediction_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col shadow-2xl relative z-10"
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-700">
          {sidebarOpen && (
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
            >
              Kannada SER
            </motion.h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <i className={`ri-${sidebarOpen ? "menu-fold" : "menu-unfold"}-line text-xl`}></i>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { icon: "dashboard", label: "Dashboard", path: "/dashboard" },
            { icon: "mic", label: "Live Detection", path: "/live-detection" },
            { icon: "upload", label: "Upload Audio", path: "/upload-audio" },
            { icon: "bar-chart", label: "Visualization", path: "/visualization" },
            { icon: "history", label: "Prediction History", path: "/prediction-history", active: true },
            { icon: "line-chart", label: "Model Performance", path: "/model-performance" },
            { icon: "database", label: "Dataset Info", path: "/dataset-info" },
            { icon: "information", label: "About Project", path: "/about" }
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => window.REACT_APP_NAVIGATE(item.path)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                item.active
                  ? "bg-gradient-to-r from-cyan-500 to-purple-500 shadow-lg"
                  : "hover:bg-slate-700"
              }`}
            >
              <i className={`ri-${item.icon}-line text-xl`}></i>
              {sidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
          >
            <i className="ri-logout-box-line text-xl"></i>
            {sidebarOpen && <span className="font-medium whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Prediction History</h1>
            <p className="text-slate-600">View and analyze all your emotion detection results</p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: "Total Predictions", value: stats.total, icon: "file-list", color: "from-cyan-500 to-blue-500" },
              { label: "Avg Confidence", value: `${stats.avgConfidence}%`, icon: "percent", color: "from-purple-500 to-pink-500" },
              { label: "Most Common", value: stats.mostCommon.charAt(0).toUpperCase() + stats.mostCommon.slice(1), icon: "emotion-happy", color: "from-green-500 to-emerald-500" },
              { label: "Today", value: stats.todayCount, icon: "calendar", color: "from-orange-500 to-red-500" }
            ].map((stat, index) => (
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Table Section */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
              >
                {/* Controls */}
                <div className="p-6 border-b border-slate-200 space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input
                          type="text"
                          placeholder="Search audio files..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                    </div>
                    <select
                      value={filterEmotion}
                      onChange={(e) => setFilterEmotion(e.target.value)}
                      className="px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                    >
                      <option value="all">All Emotions</option>
                      <option value="happy">Happy</option>
                      <option value="sad">Sad</option>
                      <option value="angry">Angry</option>
                      <option value="fear">Fear</option>
                      <option value="neutral">Neutral</option>
                    </select>
                    <button
                      onClick={exportToCSV}
                      disabled={filteredData.length === 0}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <i className="ri-download-line"></i>
                      Export CSV
                    </button>
                    {predictions.length > 0 && (
                      <button
                        onClick={clearHistory}
                        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-delete-bin-line"></i>
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Table */}
                {filteredData.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                      <i className="ri-history-line text-5xl text-slate-400"></i>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No predictions yet</h3>
                    <p className="text-slate-600 mb-6">Start analyzing audio to see your prediction history here</p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => window.REACT_APP_NAVIGATE("/live-detection")}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-mic-line mr-2"></i>
                        Live Detection
                      </button>
                      <button
                        onClick={() => window.REACT_APP_NAVIGATE("/upload-audio")}
                        className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-upload-line mr-2"></i>
                        Upload Audio
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            {[
                              { key: "audioFile", label: "Audio File" },
                              { key: "emotion", label: "Emotion" },
                              { key: "confidence", label: "Confidence" },
                              { key: "timestamp", label: "Timestamp" },
                              { key: "duration", label: "Duration" }
                            ].map((column) => (
                              <th
                                key={column.key}
                                onClick={() => handleSort(column.key)}
                                className="px-6 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  {column.label}
                                  <i className={`ri-arrow-${sortConfig.key === column.key && sortConfig.direction === "asc" ? "up" : "down"}-s-line text-slate-400`}></i>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {paginatedData.map((item, index) => (
                            <motion.tr
                              key={item.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => setPlayingId(playingId === item.id ? null : item.id)}
                                    disabled={!item.cloudinaryUrl}
                                    title={item.cloudinaryUrl ? "Play audio" : "No audio available"}
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                                      item.cloudinaryUrl
                                        ? playingId === item.id
                                          ? "bg-purple-500 hover:bg-purple-600"
                                          : "bg-gradient-to-br from-cyan-500 to-purple-500 hover:opacity-80"
                                        : "bg-slate-200 cursor-not-allowed"
                                    }`}
                                  >
                                    <i className={`ri-${playingId === item.id ? "stop" : (item.source === "live" ? "mic" : "play")}-line text-white`}></i>
                                  </button>
                                  <div>
                                    <span className="font-medium text-slate-900 block">{item.audioFile}</span>
                                    {playingId === item.id && item.cloudinaryUrl && (
                                      <audio
                                        src={item.cloudinaryUrl}
                                        autoPlay
                                        controls
                                        onEnded={() => setPlayingId(null)}
                                        className="mt-1 h-7 w-48"
                                      />
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getEmotionCfg(item.emotion).color}`}>
                                  <span>{getEmotionCfg(item.emotion).emoji}</span>
                                  <span className="capitalize">{item.emotion}</span>
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${item.confidence}%` }}
                                      transition={{ duration: 0.8, delay: index * 0.05 }}
                                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                                    ></motion.div>
                                  </div>
                                  <span className="text-sm font-semibold text-slate-900 w-12">{item.confidence}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">{item.timestamp}</td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.duration}</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-6 border-t border-slate-200 flex items-center justify-between">
                      <p className="text-sm text-slate-600">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} results
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          <i className="ri-arrow-left-s-line"></i>
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let page;
                          if (totalPages <= 5) {
                            page = i + 1;
                          } else if (currentPage <= 3) {
                            page = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            page = totalPages - 4 + i;
                          } else {
                            page = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                                currentPage === page
                                  ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white"
                                  : "border border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          <i className="ri-arrow-right-s-line"></i>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </div>

            {/* Chart Section */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
              >
                <h3 className="text-xl font-bold text-slate-900 mb-6">Emotion Distribution</h3>
                {emotionBreakdown.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={emotionBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ emotion, value }) => `${emotion}: ${value}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {emotionBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="mt-6 space-y-3">
                      {emotionBreakdown.map((item) => (
                        <div key={item.emotion} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.fill }}></div>
                            <span className="text-sm font-medium text-slate-700">{item.emotion}</span>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                      <i className="ri-pie-chart-line text-3xl text-slate-400"></i>
                    </div>
                    <p className="text-slate-600 text-sm">No data to display</p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}