
import React, { useState } from 'react';
import { SessionSummary } from './types';

interface SummaryProps {
  summary: SessionSummary;
  onFinish: () => void;
}

export const Summary: React.FC<SummaryProps> = ({ summary, onFinish }) => {
  const [visibleTranslations, setVisibleTranslations] = useState<Set<string>>(new Set());

  const toggleTranslation = (id: string) => {
    setVisibleTranslations(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-20 px-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.02)] overflow-hidden mb-12">
        <div className="bg-slate-50 p-12 text-center border-b border-slate-200/60">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-200 shadow-sm">
            <svg className="text-slate-900" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m17 5-5-3-5 3"/><path d="m17 19-5 3-5-3"/><path d="M2 12h20"/><path d="m5 7-3 5 3 5"/><path d="m19 7 3 5-3 5"/></svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Session Recorded.</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">{summary.date.toLocaleDateString()} • {summary.coach === 'mateo' ? 'Mateo' : 'Alma'}</p>
        </div>

        <div className="p-12">
          <div className="mb-12">
            <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Duration: {summary.duration}
            </div>
            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100/60 shadow-inner">
              <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Conversation Overview</h3>
              <p className="text-slate-700 font-medium leading-relaxed">
                {summary.overview}
              </p>
            </div>
          </div>

          <section>
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
              Conversation Log
            </h3>
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-6 chat-scroll">
              {summary.transcript.map((m) => (
                <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl overflow-hidden ${
                    m.sender === 'user' 
                      ? 'bg-slate-100 text-slate-900 font-bold p-5' 
                      : 'bg-white border border-slate-200 text-slate-900 shadow-sm'
                  }`}>
                    {m.sender === 'coach' ? (
                      <div className="flex flex-col">
                        <div className="p-5">
                          <p className="font-bold leading-relaxed">{m.text}</p>
                          {m.translation && !visibleTranslations.has(m.id) && (
                            <button 
                              onClick={() => toggleTranslation(m.id)}
                              className="mt-4 px-3 py-1 bg-slate-50 text-slate-400 rounded-md text-[9px] font-bold uppercase tracking-widest hover:text-slate-900 transition-colors"
                            >
                              Show Translation
                            </button>
                          )}
                        </div>
                        {m.translation && visibleTranslations.has(m.id) && (
                          <div className="bg-slate-50/50 p-5 border-t border-slate-100">
                            <p className="text-[10px] text-slate-500 font-medium italic leading-relaxed">{m.translation}</p>
                            <button 
                              onClick={() => toggleTranslation(m.id)}
                              className="mt-3 text-[8px] text-slate-300 font-bold uppercase tracking-widest hover:text-slate-600 transition-colors"
                            >
                              Hide
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="font-bold leading-relaxed">{m.text}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <button
        onClick={onFinish}
        className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
      >
        Close Review
      </button>
    </div>
  );
};
