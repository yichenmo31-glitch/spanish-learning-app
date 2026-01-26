
import React from 'react';
import { AppState, SessionSummary } from './types';

interface DashboardProps {
  state: AppState;
  onStartSession: () => void;
  onUpdateCoach: (coach: 'alma' | 'mateo') => void;
  onViewHistory: () => void;
  onViewNotebook: () => void;
  onReviewSession: (session: SessionSummary) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, onStartSession, onUpdateCoach, onViewHistory, onViewNotebook, onReviewSession }) => {
  const recentHistory = state.history.slice(0, 3);
  const activeCoach = state.userProfile?.coach || 'alma';
  const coachName = activeCoach === 'alma' ? 'Alma' : 'Mateo';

  return (
    <div className="max-w-6xl mx-auto py-16 px-8 animate-in fade-in duration-500">
      <div className="mb-14">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Welcome back.</h1>
        <p className="text-slate-500 font-medium">Currently studying at <span className="text-slate-900 font-bold">{state.userProfile?.level}</span> level.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative group transition-all hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="flex flex-col gap-10 relative z-10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-100 p-1 bg-white shadow-sm">
                    <img src={`https://picsum.photos/seed/${activeCoach}/200`} alt={coachName} className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{coachName}</h3>
                    <p className="text-slate-500 font-medium text-sm">Active Spanish Coach</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-widest rounded-full border border-blue-100/50">Ready to Speak</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={onStartSession}
                  className="w-full sm:w-auto px-12 py-4 bg-slate-900 text-white text-sm font-bold rounded-2xl transition-all hover:bg-slate-800 active:scale-95 shadow-xl shadow-slate-200"
                >
                  Start Conversation
                </button>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6">Switch Partner</h4>
                <div className="flex gap-4">
                  <button 
                    onClick={() => onUpdateCoach('alma')}
                    className={`flex items-center gap-3 p-3 pr-5 rounded-2xl border transition-all ${
                      activeCoach === 'alma' 
                        ? 'bg-slate-50 border-slate-900 shadow-sm' 
                        : 'bg-white border-slate-100 opacity-60 hover:opacity-100 hover:border-slate-300'
                    }`}
                  >
                    <img src="https://picsum.photos/seed/alma/100" className="w-10 h-10 rounded-full object-cover grayscale-[0.2]" />
                    <span className="text-xs font-bold text-slate-900">Alma</span>
                  </button>
                  <button 
                    onClick={() => onUpdateCoach('mateo')}
                    className={`flex items-center gap-3 p-3 pr-5 rounded-2xl border transition-all ${
                      activeCoach === 'mateo' 
                        ? 'bg-slate-50 border-slate-900 shadow-sm' 
                        : 'bg-white border-slate-100 opacity-60 hover:opacity-100 hover:border-slate-300'
                    }`}
                  >
                    <img src="https://picsum.photos/seed/mateo/100" className="w-10 h-10 rounded-full object-cover grayscale-[0.2]" />
                    <span className="text-xs font-bold text-slate-900">Mateo</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="absolute right-0 top-0 w-32 h-32 bg-slate-50 rounded-bl-[100px] opacity-20 pointer-events-none"></div>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div onClick={onViewNotebook} className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm cursor-pointer hover:border-slate-300 transition-all group">
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center transition-colors group-hover:bg-slate-900 group-hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/></svg>
                </div>
                <span className="text-3xl font-extrabold text-slate-900 tracking-tighter">{state.notebook.length}</span>
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider mb-1">Vocabulary Notebook</h4>
              <p className="text-xs text-slate-400 font-medium">Review your collection of words.</p>
            </div>
            <div onClick={onViewHistory} className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm cursor-pointer hover:border-slate-300 transition-all group">
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center transition-colors group-hover:bg-slate-900 group-hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                </div>
                <span className="text-3xl font-extrabold text-slate-900 tracking-tighter">{state.history.length}</span>
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider mb-1">Total Sessions</h4>
              <p className="text-xs text-slate-400 font-medium">Your learning journey to date.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-[0.2em]">Recent Sessions</h3>
            <button onClick={onViewHistory} className="text-xs font-bold text-slate-900 hover:opacity-60 transition-opacity">View all</button>
          </div>
          <div className="space-y-3">
            {recentHistory.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No history yet</p>
              </div>
            ) : (
              recentHistory.map((s) => (
                <div 
                  key={s.id} 
                  onClick={() => onReviewSession(s)}
                  className="bg-white p-5 rounded-2xl border border-slate-200/50 shadow-sm hover:border-slate-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-[9px] font-extrabold text-slate-400 uppercase tracking-tighter transition-colors group-hover:bg-slate-900 group-hover:text-white">
                      <span className="text-sm font-black leading-none mb-0.5">{s.date.getDate()}</span>
                      {s.date.toLocaleString('default', { month: 'short' })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-slate-700 transition-colors">{s.goal}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.transcript.length} turns</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
