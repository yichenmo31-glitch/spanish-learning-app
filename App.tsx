
import React, { useState, useEffect, useRef } from 'react';
import { AppState, LearningLevel, LearningGoal, SessionSummary, ChatMessage, WordDefinition } from './types';
import { Navigation } from './Navigation';
import { ChatSession } from './ChatSession';
import { Summary } from './Summary';
import { History } from './History';
import { Notebook } from './Notebook';
import { Dashboard } from './Dashboard';
import Auth from './components/Auth';
import { generateConversationOverview } from './summaryService';
import { authAPI, profileAPI, sessionAPI, vocabularyAPI } from './services/apiService';

const App: React.FC = () => {
  // 认证状态
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('token');
  });
  const [loading, setLoading] = useState<boolean>(true);

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

  // 初始化加载用户数据
  useEffect(() => {
    const loadUserData = async () => {
      if (isAuthenticated) {
        try {
          // 首先检查用户是否真的存在
          const userResponse = await authAPI.getCurrentUser();
          if (userResponse.user && userResponse.user.id) {
            // 加载用户配置文件
            const profileResponse = await profileAPI.getProfile();
            if (profileResponse.profile) {
              setState(prev => ({
                ...prev,
                userProfile: profileResponse.profile
              }));
            }

            // 加载会话历史
            const historyResponse = await sessionAPI.getHistory();
            if (historyResponse.history) {
              setState(prev => ({
                ...prev,
                history: historyResponse.history
              }));
            }

            // 加载单词笔记本
            const notebookResponse = await vocabularyAPI.getNotebook();
            if (notebookResponse.notebook) {
              setState(prev => ({
                ...prev,
                notebook: notebookResponse.notebook
              }));
            }
          }
        } catch (error) {
          console.error('Failed to load user data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadUserData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (state.userProfile && isAuthenticated) {
      // 首先检查用户是否真的存在
      authAPI.getCurrentUser().then(userResponse => {
        if (userResponse.user && userResponse.user.id) {
          // 同步用户配置文件到后端
          profileAPI.updateProfile(
            state.userProfile.level,
            state.userProfile.goal,
            state.userProfile.coach
          ).catch(error => {
            console.error('Failed to update profile:', error);
          });
        }
      }).catch(error => {
        console.error('Failed to get user:', error);
      });

      // 本地存储作为备份
      localStorage.setItem('alma_profile', JSON.stringify(state.userProfile));
    }
  }, [state.userProfile, isAuthenticated]);

  // 认证成功回调
  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  // 登出
  const handleLogout = async () => {
    try {
      await authAPI.logout();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      // 重置状态
      setState({
        view: 'dashboard',
        userProfile: {
          level: LearningLevel.BEGINNER,
          goal: LearningGoal.DAILY,
          coach: 'alma'
        },
        activeSession: null,
        history: [],
        notebook: []
      });
    } catch (error) {
      console.error('Failed to logout:', error);
      // 即使登出失败，也清除本地状态
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setState({
        view: 'dashboard',
        userProfile: {
          level: LearningLevel.BEGINNER,
          goal: LearningGoal.DAILY,
          coach: 'alma'
        },
        activeSession: null,
        history: [],
        notebook: []
      });
    }
  };

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

      // 保存到后端
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
            feedback: summary.feedback
          });
        } catch (error) {
          console.error('Failed to save session to backend:', error);
          // 即使后端保存失败，也继续更新本地状态
        }
      }

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

  const handleSaveWord = async (word: WordDefinition) => {
    // 检查单词是否已存在
    setState(prev => {
      if (prev.notebook.some(w => w.word.toLowerCase() === word.word.toLowerCase())) return prev;
      return {
        ...prev,
        notebook: [word, ...prev.notebook]
      };
    });

    // 保存到后端
    if (isAuthenticated) {
      try {
        await vocabularyAPI.addWord({
          word: word.word,
          translation: word.translation,
          example: word.example,
          exampleTranslation: word.exampleTranslation,
          pronunciation: word.pronunciation
        });
      } catch (error) {
        console.error('Failed to save word to backend:', error);
        // 即使后端保存失败，也继续更新本地状态
      }
    }
  };

  const setView = (view: AppState['view']) => {
    setState(prev => ({ ...prev, view }));
  };

  const reviewSession = (session: SessionSummary) => {
    setState(prev => ({ ...prev, activeSession: session, view: 'summary' }));
  };

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // 未认证状态
  if (!isAuthenticated) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-16 font-sans">
      <Navigation
        currentView={state.view}
        setView={setView}
        onLogout={handleLogout}
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
