import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../types';
import { speakSpanish, isSpeechSupported } from '../services/speechHelper';

interface DemoChatProps {
  script: ChatMessage[];
  coachName: string;
  onFinish: (messages: ChatMessage[]) => void;
}

const STEP_MS = 2600;

/**
 * A scripted, no-AI conversation for the guided demo. Messages appear one by
 * one and the coach's Spanish lines are read aloud with the browser's free
 * SpeechSynthesis voice — so it looks and sounds like a real session without
 * touching Gemini or the microphone.
 */
export const DemoChat: React.FC<DemoChatProps> = ({ script, coachName, onFinish }) => {
  const [shownCount, setShownCount] = useState(1);
  const [playing, setPlaying] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayName = coachName.charAt(0).toUpperCase() + coachName.slice(1);

  const visible = script.slice(0, shownCount);
  const done = shownCount >= script.length;

  // Speak the newest coach line whenever a new message appears.
  useEffect(() => {
    const latest = script[shownCount - 1];
    if (latest?.sender === 'coach') speakSpanish(latest.text);
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [shownCount, script]);

  // Auto-advance the script.
  useEffect(() => {
    if (!playing || done) return;
    const id = setTimeout(() => setShownCount(c => Math.min(c + 1, script.length)), STEP_MS);
    return () => clearTimeout(id);
  }, [playing, done, shownCount, script.length]);

  useEffect(() => {
    return () => { if (isSpeechSupported()) window.speechSynthesis.cancel(); };
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-16 px-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-white">
            <img src={`https://picsum.photos/seed/${coachName.toLowerCase()}/100`} alt={displayName} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-tight">{displayName}</p>
            <p className="text-[11px] text-slate-400 font-medium">{done ? 'Session ready to wrap up' : 'Speaking…'}</p>
          </div>
        </div>
        <button
          onClick={() => setPlaying(p => !p)}
          disabled={done}
          className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
        >
          {playing ? 'Pause' : 'Play'}
        </button>
      </div>

      <div ref={scrollRef} className="space-y-5 max-h-[440px] overflow-y-auto pr-4 chat-scroll mb-8">
        {visible.map(m => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              m.sender === 'user'
                ? 'bg-slate-100 text-slate-900 font-bold'
                : 'bg-white border border-slate-200 text-slate-900 shadow-sm'
            }`}>
              <div className="flex items-start gap-2">
                <p className="font-bold leading-relaxed">{m.text}</p>
                {m.sender === 'coach' && isSpeechSupported() && (
                  <button
                    onClick={() => speakSpanish(m.text)}
                    aria-label="Replay audio"
                    className="mt-0.5 shrink-0 text-slate-300 hover:text-slate-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                  </button>
                )}
              </div>
              {m.translation && (
                <p className="mt-2 text-[11px] text-slate-400 font-medium italic leading-relaxed">{m.translation}</p>
              )}
            </div>
          </div>
        ))}
        {!done && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => onFinish(script)}
        className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl text-sm uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98]"
      >
        {done ? 'End & see summary' : 'Skip to summary'}
      </button>
    </div>
  );
};
