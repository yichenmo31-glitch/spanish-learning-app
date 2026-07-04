
import React from 'react';

interface NavigationProps {
  currentView: string;
  setView: (view: 'dashboard' | 'chat' | 'summary' | 'history' | 'notebook') => void;
  onLogout?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, setView, onLogout }) => {
  const isHome = currentView === 'dashboard';

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-8 flex items-center justify-between z-50">
      <div 
        className="flex items-center cursor-pointer group" 
        onClick={() => setView('dashboard')}
      >
        {isHome ? (
          <span className="text-xl font-bold text-slate-900 tracking-tight rounded-full bg-slate-50 px-3 py-1 border border-slate-100">
            ¡Hola!
          </span>
        ) : (
          <div className="w-8 h-8 flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </div>
        )}
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setView('dashboard')}
            className={`px-3 py-1.5 text-xs font-bold tracking-tight rounded-lg transition-all ${currentView === 'dashboard' ? 'text-slate-900 bg-slate-100' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
          >
            Home
          </button>
          <button 
            onClick={() => setView('history')}
            className={`px-3 py-1.5 text-xs font-bold tracking-tight rounded-lg transition-all ${currentView === 'history' ? 'text-slate-900 bg-slate-100' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
          >
            History
          </button>
          <button 
            onClick={() => setView('notebook')}
            className={`px-3 py-1.5 text-xs font-bold tracking-tight rounded-lg transition-all ${currentView === 'notebook' ? 'text-slate-900 bg-slate-100' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
          >
            Notebook
          </button>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="px-3 py-1.5 text-xs font-bold tracking-tight rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all"
          >
            Log out
          </button>
        )}
        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 shadow-inner overflow-hidden">
           <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300"></div>
        </div>
      </div>
    </nav>
  );
};
