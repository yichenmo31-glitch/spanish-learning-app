
import React from 'react';
import { SessionSummary } from '../types';

interface HistoryProps {
  history: SessionSummary[];
  onReviewSession: (session: SessionSummary) => void;
}

export const History: React.FC<HistoryProps> = ({ history, onReviewSession }) => {
  return (
    <div className="max-w-5xl mx-auto py-20 px-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Conversation History</h2>
          <p className="text-slate-400 font-medium mt-1.5">A record of your past Spanish dialogues.</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 border-dashed">
          <p className="text-slate-300 font-bold uppercase tracking-[0.2em] text-[10px]">No sessions recorded</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200/60">
              <tr>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Coach</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Duration</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-slate-900 tracking-tight">
                      {s.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                      {s.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200">
                        <img src={`https://picsum.photos/seed/${s.coach}/50`} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 capitalize">{s.coach}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200/50 text-slate-600 text-[10px] font-bold uppercase tracking-tighter">
                      {s.duration}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => onReviewSession(s)}
                      className="text-xs font-bold text-slate-900 hover:opacity-50 transition-opacity flex items-center gap-1.5 ml-auto"
                    >
                      View Log
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
