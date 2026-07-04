import React, { useMemo, useState } from 'react';
import { WordDefinition } from '../types';
import { speakSpanish, isSpeechSupported } from '../services/speechHelper';

interface FlashcardsProps {
  words: WordDefinition[];
  onExit: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const Flashcards: React.FC<FlashcardsProps> = ({ words, onExit }) => {
  // The queue for this round. Words rated "Again" get re-queued at the end.
  const [queue, setQueue] = useState<WordDefinition[]>(() => shuffle(words));
  const [revealed, setRevealed] = useState(false);
  const [known, setKnown] = useState(0);
  const total = useMemo(() => words.length, [words.length]);

  const current = queue[0];
  const done = queue.length === 0;
  const reviewedCount = total - queue.length;
  const progress = total > 0 ? Math.round((reviewedCount / total) * 100) : 0;

  const advance = (gotIt: boolean) => {
    setRevealed(false);
    setQueue(prev => {
      const [, ...rest] = prev;
      if (gotIt) {
        setKnown(k => k + 1);
        return rest;
      }
      // Missed: send it to the back to see again this round.
      return [...rest, prev[0]];
    });
  };

  const restart = () => {
    setQueue(shuffle(words));
    setRevealed(false);
    setKnown(0);
  };

  if (done) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">Round complete</h3>
        <p className="text-slate-400 font-medium mb-10">
          You reviewed all {total} {total === 1 ? 'word' : 'words'}.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={restart}
            className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl text-sm uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98]"
          >
            Review again
          </button>
          <button
            onClick={onExit}
            className="px-8 py-4 bg-white text-slate-600 font-bold rounded-2xl text-sm uppercase tracking-widest border border-slate-200 hover:border-slate-300 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Header: progress + exit */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onExit}
          className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
        >
          ← Exit review
        </button>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {reviewedCount} / {total} · {known} known
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full mb-10 overflow-hidden">
        <div className="h-full bg-slate-900 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Card */}
      <button
        onClick={() => setRevealed(true)}
        className="w-full min-h-[320px] bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)] p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-slate-300 transition-all"
      >
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">{current.word}</h3>
          {isSpeechSupported() && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); speakSpanish(current.word); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); speakSpanish(current.word); } }}
              className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors"
              aria-label="Play pronunciation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
            </span>
          )}
        </div>

        {!revealed ? (
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em] mt-6">Tap to reveal</p>
        ) : (
          <div className="mt-6 w-full animate-in fade-in duration-300">
            <p className="text-xl font-bold text-slate-600">{current.translation}</p>
            {current.pronunciation && (
              <p className="text-sm text-slate-400 font-medium mt-1">/{current.pronunciation}/</p>
            )}
            {current.example && (
              <div className="mt-6 p-5 bg-slate-50/70 rounded-2xl text-sm text-slate-500 font-medium italic border border-slate-100/60 leading-relaxed">
                "{current.example}"
                {current.exampleTranslation && (
                  <span className="block mt-2 not-italic text-xs text-slate-400">{current.exampleTranslation}</span>
                )}
              </div>
            )}
          </div>
        )}
      </button>

      {/* Rating buttons (only after reveal) */}
      {revealed && (
        <div className="grid grid-cols-2 gap-3 mt-6 animate-in fade-in duration-300">
          <button
            onClick={() => advance(false)}
            className="py-4 bg-amber-50 text-amber-700 font-bold rounded-2xl text-sm uppercase tracking-widest border border-amber-100 hover:bg-amber-100 transition-all active:scale-[0.98]"
          >
            Again
          </button>
          <button
            onClick={() => advance(true)}
            className="py-4 bg-emerald-50 text-emerald-700 font-bold rounded-2xl text-sm uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all active:scale-[0.98]"
          >
            Got it
          </button>
        </div>
      )}
    </div>
  );
};
