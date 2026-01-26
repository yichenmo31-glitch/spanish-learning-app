
import React from 'react';
import { WordDefinition } from './types';

interface NotebookProps {
  words: WordDefinition[];
}

export const Notebook: React.FC<NotebookProps> = ({ words }) => {
  return (
    <div className="max-w-5xl mx-auto py-20 px-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-14">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Vocabulary Notebook</h2>
          <p className="text-slate-400 font-medium mt-1.5">Refining your personal collection of Spanish words.</p>
        </div>
        <div className="px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-bold uppercase tracking-widest">
          {words.length} Entries
        </div>
      </div>

      {words.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-slate-200">
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">Your notebook is empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {words.map((w, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm hover:border-slate-300 transition-all relative group">
              <button className="absolute top-6 right-6 text-slate-200 hover:text-slate-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
              <div className="flex items-center gap-4 mb-6">
                <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight">{w.word}</h4>
                <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                </button>
              </div>
              <div className="space-y-5">
                <p className="text-base font-bold text-slate-600 leading-relaxed border-b border-slate-50 pb-4">{w.translation}</p>
                <div className="p-5 bg-slate-50/50 rounded-2xl text-[13px] text-slate-500 font-medium italic border border-slate-100/50 leading-relaxed">
                  "{w.example}"
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
