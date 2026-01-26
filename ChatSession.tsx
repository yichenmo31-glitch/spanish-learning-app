
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { AppState, ChatMessage, WordDefinition, LearningLevel } from './types';
import { decode, decodeAudioData, createPcmBlob } from './audioHelper';
import { translateSpanishToEnglish } from './translationService';
import { getWordExplanation, regenerateExample, getSpanishTTS } from './vocabService';

type SpeakingSpeed = 'natural' | 'moderate' | 'beginner';

interface ChatSessionProps {
  state: AppState;
  isEnding?: boolean;
  onEndSession: (messages: ChatMessage[], vocab: WordDefinition[]) => void;
  onSaveWord: (word: WordDefinition) => void;
}

const VoiceVisualizer = ({ analyser, isActive }: { analyser: AnalyserNode | null; isActive: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const dataArray = new Uint8Array(analyser ? analyser.frequencyBinCount : 0);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = 2;
      const gap = 2;
      const barCount = 10;
      const totalWidth = barCount * (barWidth + gap) - gap;
      const startX = (canvas.width - totalWidth) / 2;

      if (analyser && isActive) {
        analyser.getByteFrequencyData(dataArray);
        for (let i = 0; i < barCount; i++) {
          const value = dataArray[i * 2] || 0;
          const percent = value / 255;
          const height = Math.max(2, percent * canvas.height * 0.8);
          const x = startX + i * (barWidth + gap);
          const y = (canvas.height - height) / 2;

          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          if ((ctx as any).roundRect) {
            (ctx as any).roundRect(x, y, barWidth, height, 1);
          } else {
            ctx.rect(x, y, barWidth, height);
          }
          ctx.fill();
        }
      } else {
        for (let i = 0; i < barCount; i++) {
          const x = startX + i * (barWidth + gap);
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          const h = 2;
          if ((ctx as any).roundRect) {
            (ctx as any).roundRect(x, (canvas.height - h) / 2, barWidth, h, 1);
          } else {
            ctx.rect(x, (canvas.height - h) / 2, barWidth, h);
          }
          ctx.fill();
        }
      }
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [analyser, isActive]);

  return <canvas ref={canvasRef} width={50} height={20} className="w-12 h-5" />;
};

export const ChatSession: React.FC<ChatSessionProps> = ({
  state,
  isEnding = false,
  onEndSession,
  onSaveWord
}) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [speakingSpeed, setSpeakingSpeed] = useState<SpeakingSpeed>('natural');
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [visibleTranslations, setVisibleTranslations] = useState<Set<string>>(new Set());

  const [activeCoachText, setActiveCoachText] = useState("");
  const [activeUserText, setActiveUserText] = useState("");
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isCoachSpeaking, setIsCoachSpeaking] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const [selectedWord, setSelectedWord] = useState<WordDefinition | null>(null);
  const [isFetchingVocab, setIsFetchingVocab] = useState(false);
  const [isRegeneratingExample, setIsRegeneratingExample] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const coachTranscriptionRef = useRef("");
  const userTranscriptionRef = useRef("");
  const isPausedRef = useRef(false);
  const isEndingRef = useRef(isEnding);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const userAnalyserRef = useRef<AnalyserNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const coachType = state.userProfile?.coach || 'alma';
  const coachName = coachType === 'alma' ? 'Alma' : 'Mateo';
  const coachVoice = coachType === 'alma' ? 'Kore' : 'Puck';

  // Synchronize the isEnding prop with a ref to avoid stale closures in audio process handlers
  useEffect(() => {
    isEndingRef.current = isEnding;
    if (isEnding) {
      // Hard stop on any remaining audio
      sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) { } });
      sourcesRef.current.clear();
      setIsCoachSpeaking(false);
      setIsUserSpeaking(false);
      if (sessionRef.current) {
        try { sessionRef.current.close(); } catch (e) { }
        sessionRef.current = null;
      }
    }
  }, [isEnding]);

  const getSpeedInstruction = (speed: SpeakingSpeed) => {
    switch (speed) {
      case 'beginner':
        return "Speak at a very slow and unhurried pace. Use a relaxed delivery with slightly longer pauses between phrases and very clear separation between words to help the learner segment the speech easily. Keep the tone natural and human, but prioritize maximum listening comfort and a safe, non-judgmental feel.";
      case 'moderate':
        return "Speak at a crisp, moderate pace. It should be clearly faster than beginner speed and only slightly slower than native speed. Transition between phrases with very brief pauses while maintaining clear pronunciation.";
      case 'natural':
      default:
        return "Speak at a fast, fluid, and confident real-life native Spanish speed. Minimize pauses between sentences and use the rhythmic flow of a native speaker in everyday conversation. This should feel close to how people speak in Spain or Latin America.";
    }
  };

  const getSystemInstruction = (speed: SpeakingSpeed) => {
    const base = coachType === 'alma'
      ? `You are Alma, a friendly AI Spanish Coach. ONLY SPEAK SPANISH. You are encouraging, warm, and helpful. User Level: ${state.userProfile?.level}. Goal: ${state.userProfile?.goal}.`
      : `You are Mateo, a calm and grounded AI Spanish Speaking Coach. Your tone is dry and intelligent with subtle humor. You are a smart mentor, patient but direct. You use short, confident sentences and avoid excessive enthusiasm. ONLY SPEAK SPANISH. Corrections come after the learner finishes speaking. User Level: ${state.userProfile?.level}. Goal: ${state.userProfile?.goal}.`;

    return `${base} Speaking Speed Requirement: ${getSpeedInstruction(speed)}`;
  };

  const handleUpdateSpeed = (speed: SpeakingSpeed) => {
    setSpeakingSpeed(speed);
    setShowSpeedMenu(false);
    if (sessionRef.current) {
      sessionRef.current.sendRealtimeInput({
        parts: [{ text: `System Notice: Please adjust your speaking speed to ${speed.toUpperCase()}. ${getSpeedInstruction(speed)} Continue to ONLY speak Spanish.` }]
      });
    }
  };

  const commitTurn = async (sender: 'coach' | 'user') => {
    if (isEndingRef.current) return;
    if (sender === 'user') {
      const text = userTranscriptionRef.current.trim();
      if (!text) return;
      // 1. UI即时反馈：立即在界面上显示用户的消息
      const userMessage = { id: `user-${Date.now()}`, sender: 'user', text, timestamp: new Date() };
      setMessages(prev => [...prev, userMessage]);
      userTranscriptionRef.current = "";
      setActiveUserText("");

      // 显示加载状态
      setIsLoadingAI(true);

      // 2. 调用Google GenAI API：获取AI回复
      try {
        const apiKey = import.meta.env.VITE_API_KEY;
        if (!apiKey) {
          throw new Error('Google GenAI API key is not set');
        }
        const ai = new GoogleGenAI(apiKey);

        // 准备系统指令
        const systemInstruction = getSystemInstruction(speakingSpeed);

        // 准备聊天历史
        const recentMessages = messages.slice(-5); // 获取最近5条消息作为上下文
        const history = recentMessages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));

        // 初始化模型
        const model = ai.getGenerativeModel({
          model: "gemini-2.0-flash-exp",
          systemInstruction
        });

        // 开始聊天
        const chat = model.startChat({ history });

        // 发送消息并获取回复
        const result = await chat.sendMessage(text);
        const aiMessage = result.response.text();

        // 3. 处理AI响应：在界面上显示AI的回复
        if (aiMessage) {
          setActiveCoachText(aiMessage);
          // 短暂延迟后提交教练的回复
          setTimeout(() => {
            if (!isEndingRef.current) {
              setMessages(prev => [...prev, { id: `coach-${Date.now()}`, sender: 'coach', text: aiMessage, translation: "", timestamp: new Date() }]);
              setActiveCoachText("");
              setIsLoadingAI(false);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Failed to get AI response:', error);
        // 出错时显示错误消息
        setActiveCoachText('Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.');
        setTimeout(() => {
          if (!isEndingRef.current) {
            setMessages(prev => [...prev, { id: `coach-${Date.now()}`, sender: 'coach', text: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.', translation: "", timestamp: new Date() }]);
            setActiveCoachText("");
            setIsLoadingAI(false);
          }
        }, 1000);
      }
    }
    if (sender === 'coach') {
      const text = coachTranscriptionRef.current.trim();
      if (!text) return;
      setMessages(prev => [...prev, { id: `coach-${Date.now()}`, sender: 'coach', text, translation: "", timestamp: new Date() }]);
      coachTranscriptionRef.current = "";
      setActiveCoachText("");
    }
  };

  const toggleTranslation = async (id: string) => {
    setVisibleTranslations(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    const target = messages.find(m => m.id === id);
    if (!target || target.translation) return;
    try {
      const english = await translateSpanishToEnglish(target.text);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, translation: english } : m));
    } catch (e) {
      console.error("Translation failed", e);
    }
  };

  const handleTogglePause = () => {
    if (isEndingRef.current) return;
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    isPausedRef.current = nextPaused;
    if (nextPaused) {
      // 暂停时的逻辑
      sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) { } });
      sourcesRef.current.clear();
      nextStartTimeRef.current = 0;
      setIsCoachSpeaking(false);
      setIsUserSpeaking(false);
      // 停止语音识别
      if (sessionRef.current?.recognition) {
        sessionRef.current.recognition.stop();
      }
      commitTurn('coach');
      commitTurn('user');
    } else {
      // 恢复时的逻辑
      // 重新开始语音识别
      if (sessionRef.current?.recognition) {
        setTimeout(() => {
          try {
            sessionRef.current.recognition.start();
          } catch (error) {
            console.error('Error starting speech recognition:', error);
          }
        }, 1000);
      }
    }
  };

  const handleInitiateFinishSession = () => {
    if (isEnding) return;

    // 1. HARD STOP - Stop all audio processing immediately
    isPausedRef.current = true;
    setIsPaused(true);
    sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) { } });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsCoachSpeaking(false);
    setIsUserSpeaking(false);

    // 2. Commit any pending transcriptions manually to ensure final turns are saved
    const finalMessages = [...messages];
    const userText = userTranscriptionRef.current.trim();
    if (userText) {
      finalMessages.push({ id: `user-end-${Date.now()}`, sender: 'user', text: userText, timestamp: new Date() });
      userTranscriptionRef.current = "";
    }
    const coachText = coachTranscriptionRef.current.trim();
    if (coachText) {
      finalMessages.push({ id: `coach-end-${Date.now()}`, sender: 'coach', text: coachText, translation: "", timestamp: new Date() });
      coachTranscriptionRef.current = "";
    }

    // 3. Clear UI feedback
    setActiveUserText("");
    setActiveCoachText("");

    // 4. Close the session pipeline to prevent any further model interaction
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) { }
      sessionRef.current = null;
    }

    // 5. Notify parent to start saving phase with the finalized transcript
    onEndSession(finalMessages, []);
  };

  const handleWordClick = async (word: string) => {
    const cleanWord = word.replace(/[.,!?;:]/g, "").trim();
    if (!cleanWord) return;
    setIsFetchingVocab(true);
    try {
      const explanation = await getWordExplanation(cleanWord, state.userProfile?.level || LearningLevel.BEGINNER);
      setSelectedWord(explanation);
    } catch (e) {
      console.error("Vocab fetch failed", e);
    } finally {
      setIsFetchingVocab(false);
    }
  };

  const handlePlayTTS = async (text: string) => {
    try {
      const base64 = await getSpanishTTS(text);
      if (base64 && outAudioContextRef.current) {
        const ctx = outAudioContextRef.current;
        const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.connect(ctx.destination);
        src.start();
      }
    } catch (e) {
      console.error("TTS failed", e);
    }
  };

  const handleRegenerateExample = async () => {
    if (!selectedWord) return;
    setIsRegeneratingExample(true);
    try {
      const result = await regenerateExample(selectedWord.word, selectedWord.example, state.userProfile?.level || LearningLevel.BEGINNER);
      setSelectedWord(prev => prev ? { ...prev, example: result.example, exampleTranslation: result.exampleTranslation } : null);
    } catch (e) {
      console.error("Example regeneration failed", e);
    } finally {
      setIsRegeneratingExample(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, activeCoachText, activeUserText, visibleTranslations]);

  useEffect(() => {
    const initSession = async () => {
      setConnectionError(null);
      try {
        const apiKey = import.meta.env.VITE_API_KEY;
        if (!apiKey) {
          throw new Error('Google GenAI API key is not set');
        }
        const ai = new GoogleGenAI({ apiKey });

        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        if (outAudioContextRef.current.state === 'suspended') {
          await outAudioContextRef.current.resume();
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsConnecting(false);

        // 设置音频处理
        const source = audioContextRef.current!.createMediaStreamSource(stream);

        const analyser = audioContextRef.current!.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        userAnalyserRef.current = analyser;

        // 初始化语音识别
        const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = 'es-ES'; // 设置为西班牙语

          // 处理语音识别结果
          recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript;
              } else {
                interimTranscript += transcript;
              }
            }

            // 更新实时转录
            if (interimTranscript) {
              setActiveUserText(interimTranscript);
              userTranscriptionRef.current = interimTranscript;
              setIsUserSpeaking(true);
            }

            // 当语音结束时（isFinal为true）
            if (finalTranscript) {
              setActiveUserText(finalTranscript);
              userTranscriptionRef.current = finalTranscript;
              setIsUserSpeaking(false);

              // 自动发送消息
              commitTurn('user');
            }
          };

          // 语音识别开始
          recognition.onstart = () => {
            setIsUserSpeaking(true);
          };

          // 语音识别结束
          recognition.onend = () => {
            setIsUserSpeaking(false);
            // 重新开始以持续监听，添加防抖延迟
            if (!isPausedRef.current && !isEndingRef.current) {
              // 添加1000ms的延迟，防止无限快速重启导致的API请求
              setTimeout(() => {
                if (!isPausedRef.current && !isEndingRef.current) {
                  try {
                    recognition.start();
                  } catch (error) {
                    console.error('Error restarting speech recognition:', error);
                  }
                }
              }, 1000);
            }
          };

          // 语音识别错误
          recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsUserSpeaking(false);
            // 忽略特定错误，不视为致命错误
            if (event.error === 'aborted' || event.error === 'no-speech') {
              // 这些错误是正常的，不需要停止整个流程
              // onend事件会处理重启逻辑，这里不需要重复处理
              return;
            }
          };

          // 开始语音识别
          recognition.start();

          // 保存语音识别引用
          sessionRef.current = {
            ...ai,
            recognition
          };
        } else {
          console.error('Speech recognition not supported in this browser');
        }

        // 模拟教练回应
        setTimeout(() => {
          if (!isEndingRef.current) {
            const welcomeMessage = coachType === 'alma'
              ? "¡Hola! Soy Alma, tu entrenadora de español. ¿Cómo estás hoy? ¿Qué te gustaría practicar?"
              : "Hola, soy Mateo. ¿Listo para practicar español hoy? Cuéntame algo sobre ti.";
            setActiveCoachText(welcomeMessage);
            setTimeout(() => {
              commitTurn('coach');
            }, 3000);
          }
        }, 2000);

        // 保存AI客户端引用
        if (!sessionRef.current) {
          sessionRef.current = ai;
        }
      } catch (err) {
        console.error("Failed to connect", err);
        if (!isEndingRef.current) {
          setConnectionError("Unable to establish a connection. Ensure your microphone is enabled and you have a stable network.");
        }
        setIsConnecting(false);
      }
    };
    initSession();
    return () => {
      audioContextRef.current?.close?.();
      outAudioContextRef.current?.close?.();
      if (sessionRef.current?.recognition) {
        sessionRef.current.recognition.stop();
      }
    };
  }, []);

  if (isConnecting) {
    return (
      <div className="flex flex-col items-center justify-center py-48 animate-in fade-in duration-1000">
        <div className="w-10 h-10 border-[3px] border-slate-200 border-t-slate-900 rounded-full animate-spin mb-6"></div>
        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Preparing your session...</p>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="max-w-xl mx-auto py-48 px-8 text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-4">Connection Failed</h2>
        <p className="text-slate-500 font-medium mb-10 leading-relaxed">{connectionError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-10 py-4 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
        >
          Try Reconnecting
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-120px)] bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] overflow-hidden relative">
      <div className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-900 font-bold transition-all duration-300 overflow-hidden">
            {isCoachSpeaking ? (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                <div className="w-6 h-6 bg-white/20 rounded-full animate-pulse" />
              </div>
            ) : (
              <img src={`https://picsum.photos/seed/${coachType}/100`} className="w-full h-full object-cover" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 leading-none mb-1.5">{coachName} Coach</h3>
            <div className={`transition-opacity duration-500 ${(isUserSpeaking || isCoachSpeaking) && !isPaused ? 'opacity-100' : 'opacity-0'}`}>
              <VoiceVisualizer analyser={userAnalyserRef.current} isActive={isUserSpeaking && !isPaused} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              disabled={isEnding}
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-all active:scale-95 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              {speakingSpeed} Speed
            </button>
            {showSpeedMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                {(['natural', 'moderate', 'beginner'] as SpeakingSpeed[]).map(speed => (
                  <button
                    key={speed}
                    onClick={() => handleUpdateSpeed(speed)}
                    className={`w-full px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-between ${speakingSpeed === speed ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    {speed}
                    {speakingSpeed === speed && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            disabled={isEnding}
            onClick={handleInitiateFinishSession}
            className={`px-6 py-2.5 bg-slate-100 text-slate-900 text-xs font-bold rounded-xl transition-all border border-slate-200/50 ${isEnding ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200 active:scale-95'}`}
          >
            {isEnding ? 'Saving...' : 'Finish Session'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative bg-slate-50/10">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 chat-scroll">
          {isPaused && (
            <div className="sticky top-0 z-10 flex justify-center py-2">
              <div className="bg-slate-900 text-white px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl animate-in fade-in zoom-in-95 duration-300">
                {isEnding ? 'Wrapping Up' : 'Conversation Paused'}
              </div>
            </div>
          )}

          {messages.map(m => (
            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[80%] p-5 rounded-3xl shadow-sm ${m.sender === 'user'
                ? 'bg-slate-900 text-white rounded-tr-none'
                : 'bg-white text-slate-900 border border-slate-200/60 rounded-tl-none'
                }`}>
                {m.sender === 'coach' ? (
                  <div className="flex flex-wrap gap-x-1.5 gap-y-1">
                    {m.text.split(' ').map((word, i) => (
                      <span
                        key={i}
                        onClick={() => !isEnding && handleWordClick(word)}
                        className={`cursor-pointer transition-colors font-bold decoration-slate-200 underline-offset-4 decoration-1 ${isEnding ? '' : 'hover:text-slate-500 hover:underline'}`}
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="font-bold leading-relaxed">{m.text}</p>
                )}

                {m.sender === 'coach' && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    {!visibleTranslations.has(m.id) ? (
                      <button
                        onClick={() => toggleTranslation(m.id)}
                        className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest hover:text-slate-900 flex items-center gap-1.5 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></svg>
                        Translate
                      </button>
                    ) : (
                      <div className="animate-in fade-in duration-300">
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                          {m.translation || "..."}
                        </p>
                        <button
                          onClick={() => toggleTranslation(m.id)}
                          className="mt-2.5 text-[8px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-500 transition-colors"
                        >
                          Hide
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {activeUserText && (
            <div className="flex justify-end opacity-40">
              <div className="max-w-[80%] p-5 rounded-3xl bg-slate-700 text-white rounded-tr-none">
                <p className="font-bold">{activeUserText}</p>
              </div>
            </div>
          )}

          {activeCoachText && (
            <div className="flex justify-start opacity-60">
              <div className="max-w-[80%] p-5 rounded-3xl bg-white text-slate-400 border border-slate-100 rounded-tl-none">
                <p className="font-bold italic">{activeCoachText}</p>
              </div>
            </div>
          )}

          {isLoadingAI && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-5 rounded-3xl bg-white text-slate-400 border border-slate-100 rounded-tl-none flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-bold italic">Pensando...</p>
              </div>
            </div>
          )}
        </div>

        {selectedWord && (
          <div className="w-80 border-l border-slate-200/60 bg-white p-8 animate-in slide-in-from-right duration-500 flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-start mb-10">
              <div className="flex flex-col gap-1.5">
                <h4 className="text-3xl font-extrabold text-slate-900 tracking-tighter capitalize">{selectedWord.word}</h4>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handlePlayTTS(selectedWord.word)}
                    className="p-1.5 bg-slate-50 text-slate-900 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200/50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
                  </button>
                  <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">{selectedWord.pronunciation}</span>
                </div>
              </div>
              <button onClick={() => setSelectedWord(null)} className="p-1 text-slate-300 hover:text-slate-900 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>

            <div className="space-y-10 flex-1 overflow-y-auto pr-2">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4">Core Meaning</span>
                <p className="text-sm font-bold text-slate-700 leading-relaxed bg-slate-50/80 p-5 rounded-2xl border border-slate-100/50">
                  {selectedWord.translation}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Contextual Example</span>
                  <button
                    onClick={handleRegenerateExample}
                    disabled={isRegeneratingExample}
                    className={`p-1 text-slate-400 hover:text-slate-900 transition-all ${isRegeneratingExample ? 'rotate-180 opacity-50' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
                  </button>
                </div>
                <div className="p-6 bg-orange-50/30 rounded-2xl border border-orange-100/30 space-y-3">
                  <p className="text-sm font-bold text-slate-900 leading-relaxed italic">"{selectedWord.example}"</p>
                  <p className="text-[11px] text-slate-400 font-medium">"{selectedWord.exampleTranslation}"</p>
                  <button
                    onClick={() => handlePlayTTS(selectedWord.example)}
                    className="flex items-center gap-2 text-[10px] font-bold text-slate-900 tracking-tight mt-4 opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /></svg>
                    Listen to Example
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => { onSaveWord(selectedWord); setSelectedWord(null); }}
              className="mt-10 w-full py-4 bg-slate-900 text-white text-xs font-bold uppercase tracking-[0.1em] rounded-2xl transition-all hover:bg-slate-800 active:scale-[0.98] shadow-lg shadow-slate-200 flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>
              Save to Notebook
            </button>
          </div>
        )}
      </div>

      <div className="p-10 border-t border-slate-100 bg-white flex flex-col items-center gap-4 relative">
        {isFetchingVocab && (
          <div className="absolute -top-12 bg-white px-6 py-2.5 rounded-full border border-slate-200 shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Decoding Word...</span>
          </div>
        )}

        <div className="flex items-center gap-6">
          <button
            disabled={isEnding}
            onClick={handleTogglePause}
            className={`px-12 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all flex items-center gap-4 shadow-sm active:scale-95 ${isPaused
              ? 'bg-slate-100 text-slate-900 border border-slate-200 hover:bg-slate-200'
              : 'bg-slate-900 text-white hover:bg-slate-800'
              } ${isEnding ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isPaused ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                {isEnding ? 'Saving...' : 'Continue Conversation'}
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="4" height="16" x="6" y="4" rx="1" /><rect width="4" height="16" x="14" y="4" rx="1" /></svg>
                Pause Conversation
              </>
            )}
          </button>

          <div className="flex items-center gap-3">
            <VoiceVisualizer analyser={userAnalyserRef.current} isActive={isUserSpeaking && !isPaused && !isEnding} />
          </div>
        </div>
      </div>
    </div>
  );
};
