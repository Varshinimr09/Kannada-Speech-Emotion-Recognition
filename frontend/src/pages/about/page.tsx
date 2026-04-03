import { motion } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import Breadcrumb from '../../components/Breadcrumb';

export default function AboutProject() {
  const mlPipeline = [
    { step: 1, title: 'Speech Input', icon: 'mic', description: 'Record or upload Kannada speech audio', color: 'from-cyan-500 to-blue-500' },
    { step: 2, title: 'Audio Preprocessing', icon: 'sound-module', description: 'Silence trimming and signal normalization', color: 'from-blue-500 to-indigo-500' },
    { step: 3, title: 'Feature Extraction', icon: 'waveform', description: 'Extract MFCC, Pitch, Energy, Intensity, ZCR for display; raw waveform fed to model', color: 'from-indigo-500 to-purple-500' },
    { step: 4, title: 'Wav2Vec2 Classification', icon: 'brain', description: 'Fine-tuned facebook/wav2vec2-base on raw waveform (PyTorch)', color: 'from-purple-500 to-pink-500' },
    { step: 5, title: 'Emotion Prediction', icon: 'emotion-happy', description: 'Predict emotion with confidence score', color: 'from-pink-500 to-rose-500' },
    { step: 6, title: 'Dashboard Display', icon: 'dashboard', description: 'Visualize results in web interface', color: 'from-rose-500 to-red-500' }
  ];

  const technologies = [
    { name: 'Python',         icon: 'file-code',    color: 'bg-blue-500'    },
    { name: 'PyTorch',        icon: 'cpu',          color: 'bg-orange-500'  },
    { name: 'Transformers',   icon: 'robot',        color: 'bg-yellow-500'  },
    { name: 'Wav2Vec2',       icon: 'sound-module', color: 'bg-violet-600'  },
    { name: 'Librosa',        icon: 'music',        color: 'bg-emerald-500' },
    { name: 'Flask',          icon: 'server',       color: 'bg-gray-600'    },
    { name: 'MongoDB',        icon: 'database',     color: 'bg-green-600'   },
    { name: 'Cloudinary',     icon: 'cloud-upload', color: 'bg-blue-400'    },
    { name: 'React',          icon: 'reactjs',      color: 'bg-sky-500'     },
    { name: 'TypeScript',     icon: 'code',         color: 'bg-blue-700'    },
    { name: 'Tailwind CSS',   icon: 'palette',      color: 'bg-cyan-500'    },
    { name: 'Vite',           icon: 'flashlight',   color: 'bg-purple-500'  },
  ];

  const timeline = [
    { phase: 'Phase 1', title: 'Research & Planning', date: 'Week 1-2', description: 'Literature review and dataset collection' },
    { phase: 'Phase 2', title: 'Data Preprocessing', date: 'Week 3-4', description: 'Audio cleaning and feature extraction' },
    { phase: 'Phase 3', title: 'Model Training', date: 'Week 5-6', description: 'Train and evaluate ML models' },
    { phase: 'Phase 4', title: 'Web Development', date: 'Week 7-8', description: 'Build dashboard and integrate models' }
  ];

  const applications = [
    { title: 'Mental Health Monitoring', icon: 'heart-pulse', description: 'Track emotional well-being through speech patterns', color: 'from-rose-500 to-pink-500' },
    { title: 'Customer Service Analysis', icon: 'customer-service', description: 'Analyze customer emotions during support calls', color: 'from-blue-500 to-cyan-500' },
    { title: 'Educational Engagement', icon: 'graduation-cap', description: 'Monitor student engagement in online learning', color: 'from-purple-500 to-indigo-500' },
    { title: 'Human-Computer Interaction', icon: 'robot', description: 'Enable emotion-aware AI assistants', color: 'from-emerald-500 to-teal-500' }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Breadcrumb />

          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-3xl p-12 mb-8 text-white relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <h1 className="text-5xl font-bold mb-4">Kannada Speech Emotion Recognition Platform</h1>
              <p className="text-xl text-white/90 mb-6 max-w-3xl">
                An AI-powered system that detects emotions from Kannada speech using advanced machine learning and speech processing techniques.
              </p>
              <div className="flex gap-4">
                <button className="px-6 py-3 bg-white text-cyan-600 rounded-xl font-semibold hover:bg-slate-100 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer">
                  <i className="ri-github-fill text-xl"></i>
                  View on GitHub
                </button>
                <button className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer">
                  <i className="ri-file-text-line text-xl"></i>
                  Research Paper
                </button>
              </div>
            </div>
          </motion.div>

          {/* Project Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-8 shadow-lg mb-8"
          >
            <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <i className="ri-information-line text-cyan-500"></i>
              Project Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">Problem Statement</h3>
                <p className="text-slate-600 leading-relaxed">
                  Most speech emotion recognition systems are designed for English speech datasets, making them less effective for regional languages like Kannada. This platform addresses this gap by building an emotion recognition model specifically designed for Kannada speech.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">Solution Approach</h3>
                <p className="text-slate-600 leading-relaxed">
                  We fine-tuned <strong>facebook/wav2vec2-base</strong> (Wav2Vec2, PyTorch) directly on raw Kannada waveforms to classify 5 emotions — Anger, Fear, Happiness, Neutral, Sadness — achieving <strong>84.00% test accuracy</strong> (weighted F1: 84.19%).
                </p>
              </div>
            </div>
          </motion.div>

          {/* ML Pipeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-8 shadow-lg mb-8"
          >
            <h2 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3">
              <i className="ri-flow-chart text-purple-500"></i>
              Machine Learning Pipeline
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mlPipeline.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="relative"
                >
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4`}>
                      <i className={`ri-${step.icon}-line text-3xl text-white`}></i>
                    </div>
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm">
                      {step.step}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-600">{step.description}</p>
                  </div>
                  {index < mlPipeline.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-slate-300 to-transparent"></div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* SDG Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
          >
            <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-8 text-white shadow-lg">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
                <i className="ri-heart-pulse-line text-4xl"></i>
              </div>
              <h3 className="text-2xl font-bold mb-3">SDG 3: Good Health and Well-being</h3>
              <p className="text-white/90 leading-relaxed">
                Enables emotional state monitoring through speech analysis, supporting mental health assessment and early intervention strategies.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl p-8 text-white shadow-lg">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
                <i className="ri-lightbulb-flash-line text-4xl"></i>
              </div>
              <h3 className="text-2xl font-bold mb-3">SDG 9: Industry, Innovation and Infrastructure</h3>
              <p className="text-white/90 leading-relaxed">
                Develops intelligent speech emotion recognition technology for regional languages, advancing AI innovation and digital infrastructure.
              </p>
            </div>
          </motion.div>

          {/* Technology Stack */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl p-8 shadow-lg mb-8"
          >
            <h2 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3">
              <i className="ri-stack-line text-orange-500"></i>
              Technology Stack
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {technologies.map((tech, index) => (
                <motion.div
                  key={tech.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"
                >
                  <div className={`w-12 h-12 ${tech.color} rounded-lg flex items-center justify-center mb-3`}>
                    <i className={`ri-${tech.icon}-line text-2xl text-white`}></i>
                  </div>
                  <h3 className="font-semibold text-slate-800">{tech.name}</h3>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Applications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl p-8 shadow-lg mb-8"
          >
            <h2 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3">
              <i className="ri-apps-line text-indigo-500"></i>
              Real-World Applications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {applications.map((app, index) => (
                <motion.div
                  key={app.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center mb-4`}>
                    <i className={`ri-${app.icon}-line text-2xl text-white`}></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{app.title}</h3>
                  <p className="text-slate-600">{app.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Development Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            <h2 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3">
              <i className="ri-time-line text-rose-500"></i>
              Development Timeline
            </h2>
            <div className="space-y-6">
              {timeline.map((item, index) => (
                <motion.div
                  key={item.phase}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 + index * 0.1 }}
                  className="flex gap-6 items-start"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-cyan-500 text-white text-sm font-semibold rounded-full whitespace-nowrap">{item.phase}</span>
                      <span className="text-sm text-slate-500">{item.date}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{item.title}</h3>
                    <p className="text-slate-600">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}