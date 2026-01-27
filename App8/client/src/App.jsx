// client/src/App.jsx
import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import ServerDetail from './pages/ServerDetail';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedServerId, setSelectedServerId] = useState(null);

  const navigateToDetail = (id) => {
    setSelectedServerId(id);
    setCurrentPage('detail');
  };

  const navigateToDashboard = () => {
    setSelectedServerId(null);
    setCurrentPage('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] opacity-50"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-6 h-16 flex items-center justify-between">
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={navigateToDashboard}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                Nexus Control
              </h1>
            </div>
            <nav className="flex space-x-1">
              <button
                onClick={navigateToDashboard}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${currentPage === 'dashboard' ? 'bg-white/10 text-white shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                Overview
              </button>
            </nav>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-6 py-8">
          {currentPage === 'dashboard' && <Dashboard onSelectServer={navigateToDetail} />}
          {currentPage === 'detail' && <ServerDetail serverId={selectedServerId} onBack={navigateToDashboard} />}
        </main>

        <footer className="border-t border-white/5 py-6 mt-12">
          <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
            <p>© 2026 Nexus Infrastructure Control. Secure Connection.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;

