import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: 'ri-dashboard-line', label: 'Dashboard' },
    { path: '/live-detection', icon: 'ri-mic-line', label: 'Live Emotion Detection' },
    { path: '/upload-audio', icon: 'ri-upload-cloud-line', label: 'Upload Audio' },
    { path: '/visualization', icon: 'ri-line-chart-line', label: 'Audio Visualization' },
    { path: '/prediction-history', icon: 'ri-history-line', label: 'Prediction History' },
    { path: '/model-performance', icon: 'ri-bar-chart-box-line', label: 'Model Performance' },
    { path: '/dataset-info', icon: 'ri-database-2-line', label: 'Dataset Information' },
    { path: '/about', icon: 'ri-information-line', label: 'About Project' }
  ];

  return (
    <>
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-gradient-to-b from-navy via-navy-dark to-[#0a0e1a] text-white transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <img src="https://public.readdy.ai/ai/img_res/c5257229-c3c5-41e4-9077-22e04ff96bf7.png" alt="Logo" className="w-10 h-10 object-contain flex-shrink-0" />
              {sidebarOpen && <span className="text-lg font-display font-bold whitespace-nowrap bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Kannada SER</span>}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-4 px-6 py-3 mb-1 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary/10 border-l-3 border-primary text-primary'
                      : 'hover:bg-white/5 text-gray-300 hover:text-white'
                  }`}
                >
                  <i className={`${item.icon} text-xl flex-shrink-0`}></i>
                  {sidebarOpen && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-6 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                <i className="ri-user-line text-lg"></i>
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user?.name || 'User'}</div>
                  <div className="text-xs text-gray-400 truncate">{user?.email || 'user@example.com'}</div>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 w-full px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-logout-box-line"></i>
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-8 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-navy hover:bg-primary-light transition-colors cursor-pointer"
        >
          <i className={`ri-arrow-${sidebarOpen ? 'left' : 'right'}-s-line text-sm`}></i>
        </button>
      </aside>

      {/* Spacer for main content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}></div>
    </>
  );
}