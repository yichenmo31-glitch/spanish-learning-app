import React, { useState, useEffect, useRef } from 'react';
import { AppState, LearningLevel, LearningGoal, SessionSummary, ChatMessage, WordDefinition } from './types';
import { Navigation } from './components/Navigation';
import { ChatSession } from './components/ChatSession';
import { Summary } from './components/Summary';
import { History } from './components/History';
import { Notebook } from './components/Notebook';
import { Dashboard } from './components/Dashboard';
import { PreSession } from './components/PreSession';
import Auth from './components/Auth';
import { DemoChat } from './components/DemoChat';
import { generateSessionAnalysis } from './services/summaryService';
import { generateSessionPlan } from './services/plannerAgent';
import { authAPI, profileAPI, sessionAPI, vocabularyAPI } from './services/apiService';
import {
  demoProfile,
  demoHistory,
  demoNotebook,
  demoMistakes,
  demoDueVocab,
  demoScript,
  demoSessionVocab,
  demoAnalysis,
} from './services/demoData';

const defaultProfile = {
  level: LearningLevel.BEGINNER,
  goal: LearningGoal.DAILY,
  coach: 'alma' as const,
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  // Guided demo: everything runs on in-memory sample data, no backend / LLM / mic.
  const [isDemo, setIsDemo] = useState<boolean>(false);

  const [state, setState] = useState<AppState>(() => {
    const savedProfile = localStorage.getItem('alma_profile');
    const profile = savedProfile ? JSON.parse(savedProfile) : { ...defaultProfile };

    return {
      view: 'dashboard',
      userProfile: profile,
      activeSession: null,
      sessionPlan: null,
      history: [],
      notebook: [],
    };
  });

  // Guard to prevent concurrent session ending processes
  const [isEndingSession, setIsEndingSession] = useState(false);
  // True while the learning-planner agent is preparing the next session's plan
  const [isPlanning, setIsPlanning] = useState(false);
  // Track processed session IDs to ensure idempotency
  const processedSessionIds = useRef<Set<string>>(new Set());

  // Determine auth state on load, then hydrate user data from the backend.
  useEffect(() => {
    const init = async () => {
      try {
        const { user } = await authAPI.getCurrentUser();
        if (user && user.id) {
          setIsAuthenticated(true);

          const [profileResponse, historyResponse, notebookResponse] = await Promise.all([
            profileAPI.getProfile(),
            sessionAPI.getHistory(),
            vocabularyAPI.getNotebook(),
          ]);

          setState(prev => ({
            ...prev,
            userProfile: profileResponse.profile ?? prev.userProfile,
            history: historyResponse.history ?? [],
            notebook: notebookResponse.notebook ?? [],
          }));
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Keep the backend profile in sync (and mirror to localStorage as a backup).
  useEffect(() => {
    if (state.userProfile && isAuthenticated && !isDemo) {
      profileAPI
        .updateProfile(state.userProfile.level, state.userProfile.goal, state.userProfile.coach)
        .catch(error => console.error('Failed to update profile:', error));

      localStorage.setItem('alma_profile', JSON.stringify(state.userProfile));
    }
  }, [state.userProfile, isAuthenticated, isDemo]);

  // Enter the guided demo: load sample data, no login required.
  const handleStartDemo = () => {
    setIsDemo(true);
    setIsAuthenticated(true);
    setLoading(false);
    processedSessionIds.current.clear();
    setState({
      view: 'dashboard',
      userProfile: { ...demoProfile },
      activeSession: null,
      sessionPlan: null,
      history: demoHistory,
      notebook: demoNotebook,
    });
  };

  // After a successful login/registration, reload the user's data.
  const handleAuthSuccess = async () => {
    setIsAuthenticated(true);
    setLoading(true);
    try {
      const [profileResponse, historyResponse, notebookResponse] = await Promise.all([
        profileAPI.getProfile(),
        sessionAPI.getHistory(),
        vocabularyAPI.getNotebook(),
      ]);
      setState(prev => ({
        ...prev,
        userProfile: profileResponse.profile ?? prev.userProfile,
        history: historyResponse.history ?? [],
        notebook: notebookResponse.notebook ?? [],
      }));
    } catch (error) {
      console.error('Failed to load user data after auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (!isDemo) await authAPI.logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    } finally {
      localStorage.removeItem('alma_profile');
      setIsDemo(false);
      setIsAuthenticated(false);
      processedSessionIds.current.clear();
      setState({
        view: 'dashboard',
        userProfile: { ...defaultProfile },
        activeSession: null,
        sessionPlan: null,
        history: [],
        notebook: [],
      });
    }
  };

  const handleUpdateCoach = (coach: 'alma' | 'mateo') => {
    setState(prev => ({
      ...prev,
      userProfile: { ...prev.userProfile, coach },
    }));
  };

  // Start of the session flow: show the plan screen and kick off the planner agent.
  const handleStartSession = async () => {
    setState(prev => ({ ...prev, view: 'presession', sessionPlan: null }));
    setIsPlanning(true);
    try {
      // In demo mode feed the planner the sample context so it produces a
      // personalized plan without hitting Supabase.
      const context = isDemo ? { mistakes: demoMistakes, dueVocab: demoDueVocab } : undefined;
      const plan = await generateSessionPlan(state.userProfile.level, state.userProfile.goal, context);
      setState(prev => (prev.view === 'presession' ? { ...prev, sessionPlan: plan } : prev));
    } finally {
      setIsPlanning(false);
    }
  };

  // Learner confirmed the plan — enter the live conversation.
  const handleEnterClassroom = () => {
    setState(prev => ({ ...prev, view: 'chat' }));
  };

  // Demo session end: skip the LLM + backend, use the canned analysis.
  const handleEndDemoSession = (messages: ChatMessage[]) => {
    const summary: SessionSummary = {
      id: crypto.randomUUID(),
      date: new Date(),
      level: state.userProfile.level,
      goal: state.userProfile.goal,
      coach: state.userProfile.coach,
      duration: '4 min 30 sec',
      overview: demoAnalysis.overview,
      transcript: messages,
      vocabulary: demoSessionVocab,
      grammarPoints: demoAnalysis.grammarPoints,
      feedback: demoAnalysis.feedback,
    };
    setState(prev => {
      const mergedNotebook = [...prev.notebook];
      for (const w of demoSessionVocab) {
        if (!mergedNotebook.some(x => x.word.toLowerCase() === w.word.toLowerCase())) {
          mergedNotebook.unshift(w);
        }
      }
      return {
        ...prev,
        activeSession: summary,
        history: [summary, ...prev.history],
        notebook: mergedNotebook,
        view: 'summary',
      };
    });
  };

  const handleEndSession = async (messages: ChatMessage[], sessionVocab: WordDefinition[]) => {
    // Single-Submission Guard: bail if we are already processing an end-session request
    if (isEndingSession) return;

    const currentSessionAttemptId = messages.length > 0 ? messages[0].id : Math.random().toString();

    if (processedSessionIds.current.has(currentSessionAttemptId)) {
      return;
    }

    setIsEndingSession(true);

    try {
      // Calculate Duration
      let durationStr = '0 min 0 sec';
      if (messages.length > 1) {
        const start = messages[0].timestamp.getTime();
        const end = messages[messages.length - 1].timestamp.getTime();
        const diffSeconds = Math.floor((end - start) / 1000);
        const mins = Math.floor(diffSeconds / 60);
        const secs = diffSeconds % 60;
        durationStr = `${mins} min ${secs} sec`;
      }

      // Analyze the session: overview + grammar points + learner feedback
      const analysis = await generateSessionAnalysis(
        messages,
        state.userProfile.level,
        state.userProfile.goal
      );

      const summary: SessionSummary = {
        id: crypto.randomUUID(),
        date: new Date(),
        level: state.userProfile.level,
        goal: state.userProfile.goal,
        coach: state.userProfile.coach,
        duration: durationStr,
        overview: analysis.overview,
        transcript: messages,
        vocabulary: sessionVocab,
        grammarPoints: analysis.grammarPoints,
        feedback: analysis.feedback,
      };

      processedSessionIds.current.add(currentSessionAttemptId);

      // Persist to the backend (non-blocking for local UX).
      if (isAuthenticated) {
        try {
          await sessionAPI.createSession({
            session_id: summary.id,
            date: summary.date,
            level: summary.level,
            goal: summary.goal,
            coach: summary.coach,
            duration: summary.duration,
            overview: summary.overview,
            transcript: summary.transcript,
            vocabulary: summary.vocabulary,
            grammarPoints: summary.grammarPoints,
            feedback: summary.feedback,
          });
        } catch (error) {
          console.error('Failed to save session to backend:', error);
        }
      }

      setState(prev => ({
        ...prev,
        activeSession: summary,
        history: [summary, ...prev.history],
        view: 'summary',
      }));
    } catch (error) {
      console.error('Failed to end session gracefully:', error);
    } finally {
      setIsEndingSession(false);
    }
  };

  const handleSaveWord = async (word: WordDefinition) => {
    let isNew = false;
    setState(prev => {
      if (prev.notebook.some(w => w.word.toLowerCase() === word.word.toLowerCase())) return prev;
      isNew = true;
      return {
        ...prev,
        notebook: [word, ...prev.notebook],
      };
    });

    if (isNew && isAuthenticated && !isDemo) {
      try {
        await vocabularyAPI.addWord({
          word: word.word,
          translation: word.translation,
          example: word.example,
          exampleTranslation: word.exampleTranslation,
          pronunciation: word.pronunciation,
        });
      } catch (error) {
        console.error('Failed to save word to backend:', error);
      }
    }
  };

  const setView = (view: AppState['view']) => {
    setState(prev => ({ ...prev, view }));
  };

  const reviewSession = (session: SessionSummary) => {
    setState(prev => ({ ...prev, activeSession: session, view: 'summary' }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth onAuthSuccess={handleAuthSuccess} onDemo={handleStartDemo} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-16 font-sans">
      {isDemo && (
        <div className="fixed top-14 left-0 right-0 z-40 bg-blue-600 text-white text-xs font-bold tracking-wide px-6 py-2 flex items-center justify-center gap-3">
          <span>Demo mode · sample data — no live AI or microphone</span>
          <button onClick={handleLogout} className="underline underline-offset-2 hover:text-blue-100">Exit demo</button>
        </div>
      )}
      <Navigation
        currentView={state.view}
        setView={setView}
        onLogout={handleLogout}
      />

      <main className={`container mx-auto pb-12 ${isDemo ? 'pt-8' : ''}`}>
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

        {state.view === 'presession' && (
          <PreSession
            level={state.userProfile.level}
            goal={state.userProfile.goal}
            coachName={state.userProfile.coach}
            plan={state.sessionPlan}
            loading={isPlanning}
            onStart={handleEnterClassroom}
          />
        )}

        {state.view === 'chat' && isDemo && (
          <DemoChat
            script={demoScript}
            coachName={state.userProfile.coach}
            onFinish={handleEndDemoSession}
          />
        )}

        {state.view === 'chat' && !isDemo && (
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
