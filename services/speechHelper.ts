/**
 * Lightweight, free Spanish text-to-speech using the browser's built-in
 * SpeechSynthesis API. No API key or network required, and it works in China.
 */

let cachedSpanishVoice: SpeechSynthesisVoice | null | undefined;

function pickSpanishVoice(): SpeechSynthesisVoice | null {
  if (cachedSpanishVoice !== undefined) return cachedSpanishVoice;
  const voices = window.speechSynthesis?.getVoices() ?? [];
  // Prefer Castilian (es-ES), then any Spanish variant.
  cachedSpanishVoice =
    voices.find(v => v.lang?.toLowerCase() === 'es-es') ??
    voices.find(v => v.lang?.toLowerCase().startsWith('es')) ??
    null;
  return cachedSpanishVoice;
}

// Voices load asynchronously in some browsers; refresh the cache when they do.
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedSpanishVoice = undefined;
    pickSpanishVoice();
  };
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Speaks the given Spanish text aloud. Cancels any in-progress speech first so
 * rapid taps don't queue up.
 */
export function speakSpanish(text: string, rate = 0.9): void {
  if (!isSpeechSupported() || !text.trim()) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickSpanishVoice();
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang ?? 'es-ES';
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}
