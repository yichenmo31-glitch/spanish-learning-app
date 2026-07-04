
import React, { useState, useEffect, useRef } from 'react';
import { AppState, LearningLevel, LearningGoal, SessionSummary, ChatMessage, WordDefinition } from './types';
import { Navigation } from './components/Navigation';
import { ChatSession } from './components/ChatSession';
import { Summary } from './components/Summary';
import { History } from './components/History';
import { Notebook } from './components/Notebook';
import { Dashboard } from './components/Dashboard';
import { generateConversationOverview } from './services/summaryService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const savedProfile = localStorage.getItem('alma_profile');
    const profile = savedProfile ? JSON.parse(savedProfile) : {
      level: LearningLevel.BEGINNER,
      goal: LearningGoal.DAILY,
      coach: 'alma'
    };
    
    return {
      view: 'dashboard',
      userProfile: profile,
      activeSession: null,
      history: [],
      notebook: []
    };
  });

  // Guard to prevent concurrent session ending processes
  const [isEndingSession, setIsEndingSession] = useState(false);
  // Track processed session IDs to ensure idempotency
  const processedSessionIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (state.userProfile) {
      localStorage.setItem('alma_profile', JSON.stringify(state.userProfile));
    }
  }, [state.userProfile]);

  const handleUpdateCoach = (coach: 'alma' | 'mateo') => {
    setState(prev => ({
      ...prev,
      userProfile: { ...prev.userProfile, coach }
    }));
  };

  const handleStartSession = () => {
    setState(prev => ({ ...prev, view: 'chat' }));
  };

  const handleEndSession = async (messages: ChatMessage[], sessionVocab: WordDefinition[]) => {
    // 1. Single-Submission Guard: Check if we are already processing an end-session request
    if (isEndingSession) return;
    
    // Create a temporary ID for this session attempt to ensure idempotency
    // In a real app, this would be generated when the chat starts
    const currentSessionAttemptId = messages.length > 0 ? messages[0].id : Math.random().toString();
    
    if (processedSessionIds.current.has(currentSessionAttemptId)) {
      return;
    }

    setIsEndingSession(true);

    try {
      // Calculate Duration
      let durationStr = "0 min 0 sec";
      if (messages.length > 1) {
        const start = messages[0].timestamp.getTime();
        const end = messages[messages.length - 1].timestamp.getTime();
        const diffSeconds = Math.floor((end - start) / 1000);
        const mins = Math.floor(diffSeconds / 60);
        const secs = diffSeconds % 60;
        durationStr = `${mins} min ${secs} sec`;
      }

      // Generate Overview
      const overview = await generateConversationOverview(messages);

      const summary: SessionSummary = {
        id: Math.random().toString(),
        date: new Date(),
        level: state.userProfile.level,
        goal: state.userProfile.goal,
        coach: state.userProfile.coach,
        duration: durationStr,
        overview: overview,
        transcript: messages,
        vocabulary: sessionVocab,
        grammarPoints: [],
        feedback: {
          strengths: [],
          improvements: [],
          note: ""
        }
      };

      processedSessionIds.current.add(currentSessionAttemptId);

      setState(prev => ({
        ...prev,
        activeSession: summary,
        history: [summary, ...prev.history],
        view: 'summary'
      }));
    } catch (error) {
      console.error("Failed to end session gracefully:", error);
      // FAILURE HANDLING: Re-enable the action if something goes wrong so user can retry
    } finally {
      setIsEndingSession(false);
    }
  };

  const handleSaveWord = (word: WordDefinition) => {
    setState(prev => {
      if (prev.notebook.some(w => w.word.toLowerCase() === word.word.toLowerCase())) return prev;
      return {
        ...prev,
        notebook: [word, ...prev.notebook]
      };
    });
  };

  const setView = (view: AppState['view']) => {
    setState(prev => ({ ...prev, view }));
  };

  const reviewSession = (session: SessionSummary) => {
    setState(prev => ({ ...prev, activeSession: session, view: 'summary' }));
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-16 font-sans">
      <Navigation 
        currentView={state.view} 
        setView={setView} 
      />
      
      <main className="container mx-auto pb-12">
        {state.view === 'dashboard' && (
          <Dashboard 
            state={state} 
            onStartSession={handleStartSession} 
            onUpdateCoach={handleUpdateCoach}
            onViewHistory={() => setView('history')}
            onViewNotebook={() => setView('notebook')}
            onReviewSession={reviewSession}
          />
        )}
        
        {state.view === 'chat' && (
          <ChatSession 
            state={state} 
            isEnding={isEndingSession}
            onEndSession={handleEndSession}
            onSaveWord={handleSaveWord}
          />
        )}
        
        {state.view === 'summary' && state.activeSession && (
          <Summary 
            summary={state.activeSession} 
            onFinish={() => setView('dashboard')} 
          />
        )}

        {state.view === 'history' && (
          <History history={state.history} onReviewSession={reviewSession} />
        )}

        {state.view === 'notebook' && (
          <Notebook words={state.notebook} />
        )}
      </main>
    </div>
  );
};

export default App;
