
import React, { useState } from 'react';
import { LearningLevel, LearningGoal } from '../types';

interface OnboardingProps {
  onComplete: (level: LearningLevel, goal: LearningGoal, coach: 'alma' | 'mateo') => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [level, setLevel] = useState<LearningLevel | null>(null);
  const [goal, setGoal] = useState<LearningGoal | null>(null);

  const levels = Object.values(LearningLevel);
  const goals = Object.values(LearningGoal);

  const isComplete = level && goal;

  return (
    <div className="max-w-2xl mx-auto py-24 px-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Your Journey Starts Here.</h1>
        <p className="text-slate-500 font-medium">Let's define what you want to achieve.</p>
      </div>

      <section className="mb-14">
        <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-8">Current Proficiency</h2>
        <div className="grid grid-cols-1 gap-3">
          {levels.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`p-6 rounded-2xl border transition-all text-left flex items-center justify-between group ${
                level === l 
                ? 'border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-200' 
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
              }`}
            >
              <div>
                <div className="font-extrabold text-sm uppercase tracking-wider mb-0.5">{l}</div>
                <div className={`text-[11px] font-medium opacity-60`}>
                  {l === LearningLevel.BEGINNER && "Just starting my journey."}
                  {l === LearningLevel.INTERMEDIATE && "I can form basic sentences."}
                  {l === LearningLevel.ADVANCED && "I want to polish my fluency."}
                </div>
              </div>
              {level === l && (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-8">Learning Objective</h2>
        <div className="grid grid-cols-2 gap-3">
          {goals.map((g) => (
            <button
              key={g}
              onClick={() => setGoal(g)}
              className={`p-4 rounded-xl border transition-all text-center text-xs font-extrabold uppercase tracking-tight ${
                goal === g 
                ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-200' 
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </section>

      <button
        disabled={!isComplete}
        onClick={() => level && goal && onComplete(level, goal, 'alma')}
        className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl text-sm uppercase tracking-widest hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-300 transition-all shadow-xl shadow-slate-100 active:scale-[0.98]"
      >
        Personalize My Journey
      </button>
    </div>
  );
};
