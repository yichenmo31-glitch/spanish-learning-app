
import React from 'react';
import { LearningLevel, LearningGoal, SessionPlan } from '../types';

interface PreSessionProps {
  level: LearningLevel;
  goal: LearningGoal;
  coachName: string;
  plan?: SessionPlan | null;
  loading?: boolean;
  onStart: () => void;
}

export const PreSession: React.FC<PreSessionProps> = ({ level, goal, coachName, plan, loading, onStart }) => {
  const coachKey = coachName.toLowerCase();
  const displayName = coachName.charAt(0).toUpperCase() + coachName.slice(1);

  return (
    <div className="max-w-xl mx-auto py-24 px-8 flex flex-col items-center animate-in fade-in duration-700">
      <div className="w-28 h-28 rounded-full overflow-hidden mb-10 border border-slate-200 p-1 bg-white shadow-sm">
        <img
          src={`https://picsum.photos/seed/${coachKey}/400`}
          alt={`${displayName} Coach`}
          className="w-full h-full object-cover rounded-full"
        />
      </div>

      <div className="bg-white p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-200/60 text-center mb-10 relative w-full">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-t border-l border-slate-200/60 rotate-45"></div>

        {loading ? (
          <div className="py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-5"></div>
            <p className="text-slate-400 font-medium text-sm">{displayName} is planning today's session…</p>
          </div>
        ) : plan ? (
          <div className="text-left">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2 text-center">Today's plan</p>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2 tracking-tight text-center">{plan.topic}</h2>
            {plan.rationale && (
              <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed text-center">{plan.rationale}</p>
            )}

            {plan.grammarFocus.length > 0 && (
              <div className="mb-5">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">Grammar focus</p>
                <ul className="space-y-1.5">
                  {plan.grammarFocus.map((g, i) => (
                    <li key={i} className="text-slate-700 font-medium text-sm flex gap-2">
                      <span className="text-blue-500">→</span>{g}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {plan.targetVocab.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">Words to reuse</p>
                <div className="flex flex-wrap gap-2">
                  {plan.targetVocab.map((w, i) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-4 tracking-tight">¡Hola! Ready to begin?</h2>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
              "I'm excited to speak with you! We'll tailor this session to your goals at the <span className="text-blue-600 font-bold">{level}</span> level."
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">Personalized</span>
              <span className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">Voice-First</span>
              <span className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">Immersion</span>
            </div>
          </>
        )}
      </div>

      <button
        onClick={onStart}
        disabled={loading}
        className="w-full sm:w-auto px-12 py-4 bg-blue-600 text-white text-sm font-bold rounded-2xl transition-all hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-100 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
        Enter Classroom
      </button>
    </div>
  );
};
