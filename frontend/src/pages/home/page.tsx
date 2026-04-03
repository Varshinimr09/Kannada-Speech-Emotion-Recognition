import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: '-80px' });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl shadow-[0_2px_24px_rgba(0,0,0,0.08)] border-b border-gray-100/80'
          : 'bg-transparent border-b border-transparent'
      }`}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <a href="#hero" className="flex items-center gap-3 group cursor-pointer">
              <div className="relative w-9 h-9 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <img
                  src="https://public.readdy.ai/ai/img_res/c5257229-c3c5-41e4-9077-22e04ff96bf7.png"
                  alt="Kannada SER Logo"
                  className="w-7 h-7 object-contain relative z-10"
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-base font-display font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Kannada SER
                </span>
                <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Speech Emotion AI</span>
              </div>
            </a>

            {/* Center Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { label: 'Features', href: '#features' },
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'Technology', href: '#technology' },
                { label: 'Applications', href: '#applications' },
                { label: 'Contact', href: '#contact' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 group cursor-pointer rounded-lg ${
                    scrolled ? 'text-gray-600 hover:text-navy hover:bg-gray-50' : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                  <span className="absolute bottom-1 left-4 right-4 h-0.5 bg-gradient-to-r from-primary to-secondary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full"></span>
                </a>
              ))}
            </div>

            {/* Right CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className={`px-4 py-2 text-sm font-semibold border rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  scrolled
                    ? 'text-navy border-gray-200 hover:border-primary/50 hover:text-primary hover:bg-primary/5'
                    : 'text-white border-white/30 hover:border-primary hover:text-primary hover:bg-white/10'
                }`}
              >
                Sign In
              </Link>

              <Link
                to="/register"
                className="relative px-5 py-2 text-sm font-semibold text-white rounded-lg overflow-hidden group cursor-pointer whitespace-nowrap"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-primary to-secondary"></span>
                <span className="absolute inset-0 bg-gradient-to-r from-secondary to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative flex items-center gap-1.5">
                  <i className="ri-rocket-line text-sm"></i>
                  Get Started
                </span>
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                scrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'
              }`}
            >
              <i className={`${mobileMenuOpen ? 'ri-close-line' : 'ri-menu-3-line'} text-xl ${scrolled ? 'text-navy' : 'text-white'}`}></i>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={mobileMenuOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="md:hidden overflow-hidden bg-white border-t border-gray-100"
        >
          <div className="px-6 py-4 flex flex-col gap-1">
            {[
              { label: 'Features', href: '#features' },
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'Technology', href: '#technology' },
              { label: 'Applications', href: '#applications' },
              { label: 'Contact', href: '#contact' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-navy hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-3 mt-2 border-t border-gray-100 flex flex-col gap-2">
              <Link
                to="/login"
                className="px-4 py-2.5 text-sm font-semibold text-navy border border-gray-200 rounded-lg text-center hover:border-primary/50 transition-colors cursor-pointer whitespace-nowrap"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-secondary rounded-lg text-center hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
              >
                Get Started
              </Link>
            </div>
          </div>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex items-center overflow-hidden pt-20 bg-[#0a0e1f]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-secondary/15"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full border border-primary/30">
                <i className="ri-sparkling-fill text-primary"></i>
                <span className="text-sm font-medium">AI-Powered Emotion Detection</span>
              </div>
              
              <h1 className="text-6xl lg:text-7xl font-display font-bold leading-tight">
                <span className="bg-gradient-to-r from-primary-light via-primary to-secondary bg-clip-text text-transparent">
                  Kannada Speech
                </span>
                <br />
                <span className="text-white">Emotion Recognition</span>
              </h1>
              
              <p className="text-xl text-gray-300 leading-relaxed max-w-xl">
                Advanced machine learning platform that detects human emotions from Kannada speech audio with 84.00% accuracy using Wav2Vec2 raw waveform analysis
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/live-detection" className="px-8 py-4 bg-primary text-navy font-semibold text-base rounded-xl hover:bg-primary-light transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shadow-lg shadow-primary/30">
                  <i className="ri-mic-fill text-lg"></i>
                  Start Detection
                </Link>
                <a href="#demo" className="px-8 py-4 bg-transparent border-2 border-primary text-white font-semibold text-base rounded-xl hover:bg-primary/10 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer">
                  <i className="ri-play-circle-fill text-lg"></i>
                  View Demo
                </a>
              </div>
              
              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <i className="ri-emotion-happy-line text-primary text-xl"></i>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">500+</div>
                    <div className="text-sm text-gray-400">Emotions Analyzed</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                    <i className="ri-bar-chart-box-line text-secondary text-xl"></i>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">84.00%</div>
                    <div className="text-sm text-gray-400">Accuracy Rate</div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative w-full h-[600px]">
                <img 
                  src="https://readdy.ai/api/search-image?query=futuristic%203D%20visualization%20of%20audio%20waveform%20particles%20floating%20in%20space%20with%20glowing%20cyan%20and%20purple%20gradient%20colors%2C%20circular%20emotion%20indicators%20with%20happy%20sad%20angry%20icons%20orbiting%20around%20central%20microphone%20element%2C%20dark%20technology%20background%20with%20geometric%20shapes%2C%20modern%20AI%20interface%20design%2C%20digital%20art%20style%2C%20clean%20minimalist%20aesthetic&width=600&height=600&seq=hero-visual-1&orientation=squarish" 
                  alt="AI Emotion Detection Visualization" 
                  className="w-full h-full object-contain"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-28 bg-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full border border-primary/20 mb-4">
              <i className="ri-settings-3-line text-primary text-sm"></i>
              <span className="text-sm font-semibold text-primary tracking-wider uppercase">ML Pipeline</span>
            </div>
            <h2 className="text-5xl font-display font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Five intelligent stages transform raw Kannada speech into precise emotion predictions
            </p>
          </motion.div>

          {/* Pipeline Steps */}
          <div className="relative">
            {/* Connecting line (desktop) */}
            <div className="hidden lg:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-secondary/40 to-primary/20 z-0 mx-32"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 relative z-10">
              {[
                {
                  step: '01',
                  icon: 'ri-mic-2-line',
                  title: 'Audio Input',
                  description: 'Record live speech or upload a .wav file of Kannada audio for processing',
                  color: 'from-cyan-400 to-cyan-600',
                  glow: 'shadow-cyan-200',
                  delay: 0,
                },
                {
                  step: '02',
                  icon: 'ri-equalizer-line',
                  title: 'Preprocessing',
                  description: 'Silence trimming, noise reduction, and signal normalization for clean audio',
                  color: 'from-teal-400 to-teal-600',
                  glow: 'shadow-teal-200',
                  delay: 0.12,
                },
                {
                  step: '03',
                  icon: 'ri-bar-chart-grouped-line',
                  title: 'Feature Extraction',
                  description: 'MFCC, Pitch, Energy, ZCR, and Intensity extracted using Librosa',
                  color: 'from-violet-400 to-violet-600',
                  glow: 'shadow-violet-200',
                  delay: 0.24,
                },
                {
                  step: '04',
                  icon: 'ri-brain-line',
                  title: 'ML Model',
                  description: 'Fine-tuned Wav2Vec2 transformer classifies emotions directly from raw waveform representations',
                  color: 'from-fuchsia-400 to-fuchsia-600',
                  glow: 'shadow-fuchsia-200',
                  delay: 0.36,
                },
                {
                  step: '05',
                  icon: 'ri-emotion-line',
                  title: 'Emotion Output',
                  description: 'Predicted emotion with confidence score and probability distribution',
                  color: 'from-amber-400 to-orange-500',
                  glow: 'shadow-orange-200',
                  delay: 0.48,
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: item.delay, ease: 'easeOut' }}
                  viewport={{ once: true, margin: '-60px' }}
                  className="flex flex-col items-center text-center group"
                >
                  {/* Icon circle */}
                  <div className={`relative w-32 h-32 flex items-center justify-center mb-6`}>
                    {/* Pulse ring */}
                    <motion.div
                      className={`absolute inset-0 rounded-full bg-gradient-to-br ${item.color} opacity-10`}
                      animate={{ scale: [1, 1.18, 1] }}
                      transition={{ duration: 2.8, repeat: Infinity, delay: item.delay }}
                    />
                    <motion.div
                      className={`absolute inset-2 rounded-full bg-gradient-to-br ${item.color} opacity-15`}
                      animate={{ scale: [1, 1.12, 1] }}
                      transition={{ duration: 2.8, repeat: Infinity, delay: item.delay + 0.3 }}
                    />
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-xl ${item.glow} group-hover:scale-110 transition-transform duration-300`}>
                      <i className={`${item.icon} text-3xl text-white`}></i>
                    </div>
                    {/* Step badge */}
                    <div className="absolute -top-1 -right-1 w-7 h-7 bg-gray-900 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {item.step}
                    </div>
                  </div>

                  {/* Arrow connector (between steps, desktop hidden via grid) */}
                  {index < 4 && (
                    <div className="hidden lg:block absolute" style={{ display: 'none' }}></div>
                  )}

                  <h3 className="text-lg font-display font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-[180px]">{item.description}</p>

                  {/* Mobile arrow */}
                  {index < 4 && (
                    <div className="lg:hidden mt-4 mb-2 w-8 h-8 flex items-center justify-center text-gray-300">
                      <i className="ri-arrow-down-line text-2xl"></i>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Desktop arrow connectors overlaid */}
            <div className="hidden lg:flex absolute top-[52px] left-0 right-0 justify-between px-32 z-20 pointer-events-none">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scaleX: 0 }}
                  whileInView={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 * i + 0.5 }}
                  viewport={{ once: true }}
                  className="flex-1 flex items-center justify-center"
                >
                  <i className="ri-arrow-right-line text-2xl text-primary/40"></i>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <Link
              to="/live-detection"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="ri-play-circle-line text-lg"></i>
              Try the Pipeline Now
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50 text-gray-900" ref={featuresRef}>
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="text-primary text-sm font-semibold tracking-wider uppercase mb-3">CORE CAPABILITIES</div>
            <h2 className="text-5xl font-display font-bold mb-4">Advanced Emotion Detection Features</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive suite of AI-powered tools for analyzing emotional patterns in Kannada speech
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: 'ri-mic-line',
                title: 'Real-time Recording',
                description: 'Capture live Kannada speech with high-quality audio recording and instant waveform visualization for immediate emotion analysis',
                accent: 'from-cyan-500 to-teal-500',
              },
              {
                icon: 'ri-brain-line',
                title: 'Wav2Vec2 Transformer',
                description: 'Fine-tuned facebook/wav2vec2-base transformer model trained on Kannada, CREMA-D, EMO-DB, RAVDESS, and TESS datasets for 84.00% accuracy',
                accent: 'from-violet-500 to-fuchsia-500',
              },
              {
                icon: 'ri-cloud-line',
                title: 'Cloud Storage',
                description: 'Secure audio file storage with Cloudinary integration ensuring scalable and reliable data management',
                accent: 'from-sky-500 to-cyan-500',
              },
              {
                icon: 'ri-line-chart-line',
                title: 'Spectrogram Analysis',
                description: 'Interactive frequency-time visualization revealing acoustic patterns and emotional characteristics in speech signals',
                accent: 'from-emerald-500 to-teal-500',
              },
              {
                icon: 'ri-history-line',
                title: 'Prediction History',
                description: 'Comprehensive tracking of all emotion predictions with confidence scores, timestamps, and audio playback functionality',
                accent: 'from-amber-500 to-orange-500',
              },
              {
                icon: 'ri-pie-chart-line',
                title: 'Confidence Scoring',
                description: 'Detailed probability distribution across all emotion categories with visual confidence indicators and accuracy metrics',
                accent: 'from-rose-500 to-pink-500',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={featuresInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{
                  duration: 0.55,
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 cursor-pointer group"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.accent} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <i className={`${feature.icon} text-3xl text-white`}></i>
                </div>
                <h3 className="text-xl font-display font-semibold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{feature.description}</p>
                <div className="mt-5 flex items-center gap-1 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span>Learn more</span>
                  <i className="ri-arrow-right-line"></i>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section id="technology" className="py-24 bg-navy-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-display font-bold mb-4">Powered by Advanced AI Technology</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built with cutting-edge machine learning libraries and frameworks for accurate emotion recognition
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { name: 'Python', icon: 'ri-code-s-slash-line', desc: 'Core programming language' },
              { name: 'Librosa', icon: 'ri-music-2-line', desc: 'Audio feature extraction' },
              { name: 'PyTorch + Transformers', icon: 'ri-brain-line', desc: 'Wav2Vec2 fine-tuned model' },
              { name: 'Cloudinary', icon: 'ri-cloud-line', desc: 'Cloud audio storage' }
            ].map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:border-primary/50 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center mb-4">
                  <i className={`${tech.icon} text-2xl text-primary`}></i>
                </div>
                <h3 className="text-lg font-semibold mb-2">{tech.name}</h3>
                <p className="text-sm text-gray-400">{tech.desc}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h3 className="text-2xl font-display font-semibold mb-8 text-center">ML Pipeline Workflow</h3>
            <div className="flex flex-wrap justify-center items-center gap-4">
              {['Audio Input', 'Preprocessing', 'Feature Extraction', 'ML Model', 'Emotion Output'].map((stage, index) => (
                <div key={index} className="flex items-center">
                  <div className="bg-gradient-to-br from-primary to-secondary px-6 py-3 rounded-lg font-medium text-sm whitespace-nowrap">
                    {stage}
                  </div>
                  {index < 4 && <i className="ri-arrow-right-line text-2xl text-primary mx-2"></i>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Applications Section */}
      <section id="applications" className="py-24 bg-white text-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-display font-bold mb-4">Real-World Applications</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transforming industries through emotion-aware technology and intelligent speech analysis
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Mental Health Monitoring',
                description: 'Enable healthcare professionals to track emotional well-being through speech patterns, supporting early intervention and continuous mental health assessment',
                icon: 'ri-heart-pulse-line',
                color: 'from-red-500 to-pink-500'
              },
              {
                title: 'Human-Computer Interaction',
                description: 'Create emotion-aware interfaces that adapt to user emotional states, enhancing user experience and engagement in digital applications',
                icon: 'ri-user-voice-line',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                title: 'Customer Service Analysis',
                description: 'Analyze customer emotions during service interactions to improve satisfaction, identify pain points, and optimize support strategies',
                icon: 'ri-customer-service-2-line',
                color: 'from-green-500 to-emerald-500'
              },
              {
                title: 'Educational Engagement',
                description: 'Monitor student emotional engagement during learning sessions to adapt teaching methods and improve educational outcomes',
                icon: 'ri-graduation-cap-line',
                color: 'from-purple-500 to-indigo-500'
              }
            ].map((app, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 p-8 rounded-2xl hover:shadow-xl transition-all border border-gray-200 cursor-pointer"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${app.color} rounded-xl flex items-center justify-center mb-6`}>
                  <i className={`${app.icon} text-3xl text-white`}></i>
                </div>
                <h3 className="text-2xl font-display font-semibold mb-3">{app.title}</h3>
                <p className="text-gray-600 leading-relaxed">{app.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SDG Section */}
      <section className="py-24 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display font-bold text-navy mb-4">Contributing to Global Goals</h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Aligned with United Nations Sustainable Development Goals for a better future
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 flex-shrink-0">
                  <img src="https://readdy.ai/api/search-image?query=United%20Nations%20SDG%203%20Good%20Health%20and%20Well-being%20icon%20logo%20official%20design%20with%20red%20and%20white%20colors%20simple%20clean%20vector%20style&width=80&height=80&seq=sdg3-icon&orientation=squarish" alt="SDG 3" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-semibold text-navy mb-2">SDG 3: Good Health and Well-being</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Enabling emotional state monitoring through speech analysis to support mental health initiatives and well-being assessment
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 flex-shrink-0">
                  <img src="https://readdy.ai/api/search-image?query=United%20Nations%20SDG%209%20Industry%20Innovation%20and%20Infrastructure%20icon%20logo%20official%20design%20with%20orange%20and%20white%20colors%20simple%20clean%20vector%20style&width=80&height=80&seq=sdg9-icon&orientation=squarish" alt="SDG 9" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-semibold text-navy mb-2">SDG 9: Industry, Innovation and Infrastructure</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Developing intelligent speech emotion recognition technology for regional languages to advance AI innovation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-navy text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-display font-bold mb-4">Get Started Today</h2>
            <p className="text-xl text-gray-300 mb-8">
              Join us in advancing emotion recognition technology for Kannada speech
            </p>
            
            <form 
              id="contact-form" 
              action="https://formsubmit.co/kannadaser2026@gmail.com" 
              method="POST"
              className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10"
            >
              <input type="hidden" name="_captcha" value="false" />
              <input type="hidden" name="_subject" value="New Contact Message - Kannada SER" />
              <input type="hidden" name="_template" value="table" />
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Your Name" 
                  required
                  className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
                />
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Your Email" 
                  required
                  className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <textarea 
                name="message" 
                placeholder="Your Message" 
                rows={4}
                maxLength={500}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors mb-4 resize-none"
              ></textarea>
              <button 
                type="submit" 
                className="w-full px-8 py-4 bg-primary text-navy font-semibold text-base rounded-xl hover:bg-primary-light transition-all whitespace-nowrap cursor-pointer"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-dark text-white py-16 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="https://public.readdy.ai/ai/img_res/c5257229-c3c5-41e4-9077-22e04ff96bf7.png" alt="Logo" className="w-10 h-10 object-contain" />
                <span className="text-xl font-display font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Kannada SER</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                AI-Powered Kannada Speech Emotion Recognition platform for advanced emotion detection and analysis
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-primary transition-colors cursor-pointer">
                  <i className="ri-linkedin-fill text-lg"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-primary transition-colors cursor-pointer">
                  <i className="ri-twitter-fill text-lg"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-primary transition-colors cursor-pointer">
                  <i className="ri-github-fill text-lg"></i>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/dashboard" className="text-sm hover:text-primary transition-colors cursor-pointer">Dashboard</Link></li>
                <li><Link to="/live-detection" className="text-sm hover:text-primary transition-colors cursor-pointer">Detection</Link></li>
                <li><a href="#features" className="text-sm hover:text-primary transition-colors cursor-pointer">Features</a></li>
                <li><a href="#technology" className="text-sm hover:text-primary transition-colors cursor-pointer">Technology</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Problem Statement</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                Emotional context in Kannada speech is often missed by conventional systems. This project builds a focused AI pipeline to recognize emotions from speech and support better human-computer interaction.
              </p>
            </div>
            
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">© 2026 Kannada SER Platform. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-400 hover:text-primary transition-colors cursor-pointer">Terms of Service</a>
              <a href="#" className="text-sm text-gray-400 hover:text-primary transition-colors cursor-pointer">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        #navbar {
          background: transparent;
        }
        
        #navbar.scrolled {
          background: rgba(26, 31, 54, 0.95);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}