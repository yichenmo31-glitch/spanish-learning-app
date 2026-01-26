import { supabase } from './supabase';
import { SessionSummary, WordDefinition } from '../types';

// 认证相关API
export const authAPI = {
  // 注册
  register: async (email: string, password: string, level: string, goal: string, coach: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // 更新用户配置文件
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ level, goal, coach })
        .eq('user_id', data.user.id);

      if (profileError) throw profileError;
    }

    return { token: data.session?.access_token, user: data.user };
  },

  // 登录
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { token: data.session?.access_token, user: data.user };
  },

  // 获取当前用户信息
  getCurrentUser: async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }
    
    // 获取用户配置文件
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      throw new Error('Failed to get user profile');
    }

    return { user: { id: user.id, email: user.email, profile } };
  },

  // 登出
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};

// 用户配置文件相关API
export const profileAPI = {
  // 更新配置文件
  updateProfile: async (level: string, goal: string, coach: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ level, goal, coach })
      .eq('user_id', user?.id)
      .single();

    if (error) throw error;

    return { profile: data };
  },

  // 获取配置文件
  getProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user?.id)
      .single();

    if (error) throw error;

    return { profile: data };
  },
};

// 会话相关API
export const sessionAPI = {
  // 创建会话
  createSession: async (sessionData: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 开始事务
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user?.id,
        session_id: sessionData.session_id,
        date: sessionData.date,
        level: sessionData.level,
        goal: sessionData.goal,
        coach: sessionData.coach,
        duration: sessionData.duration,
        overview: sessionData.overview,
      })
      .select('id')
      .single();

    if (sessionError) throw sessionError;

    // 插入聊天消息
    for (const message of sessionData.transcript) {
      await supabase
        .from('chat_messages')
        .insert({
          session_id: session.id,
          message_id: message.id,
          sender: message.sender,
          text: message.text,
          translation: message.translation,
          timestamp: message.timestamp,
        });
    }

    // 插入词汇
    for (const word of sessionData.vocabulary) {
      await supabase
        .from('session_vocabulary')
        .insert({
          session_id: session.id,
          word: word.word,
          translation: word.translation,
          example: word.example,
          example_translation: word.exampleTranslation,
          pronunciation: word.pronunciation,
        });
    }

    // 插入语法点
    for (const point of sessionData.grammarPoints) {
      await supabase
        .from('session_grammar_points')
        .insert({
          session_id: session.id,
          point,
        });
    }

    // 插入反馈
    await supabase
      .from('session_feedback')
      .insert({
        session_id: session.id,
        strengths: sessionData.feedback.strengths,
        improvements: sessionData.feedback.improvements,
        note: sessionData.feedback.note,
      });

    return { message: 'Session created successfully', session_id: sessionData.session_id };
  },

  // 获取会话历史
  getHistory: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 获取所有会话
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user?.id)
      .order('date', { ascending: false });

    if (error) throw error;

    // 获取每个会话的详细信息
    const fullSessions = [];
    for (const session of sessions) {
      // 获取聊天消息
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('timestamp');

      // 获取词汇
      const { data: vocabulary } = await supabase
        .from('session_vocabulary')
        .select('*')
        .eq('session_id', session.id);

      // 获取语法点
      const { data: grammarPoints } = await supabase
        .from('session_grammar_points')
        .select('*')
        .eq('session_id', session.id);

      // 获取反馈
      const { data: feedback } = await supabase
        .from('session_feedback')
        .select('*')
        .eq('session_id', session.id)
        .single();

      fullSessions.push({
        id: session.session_id,
        date: session.date,
        level: session.level,
        goal: session.goal,
        coach: session.coach,
        duration: session.duration,
        overview: session.overview,
        transcript: messages.map((msg: any) => ({
          id: msg.message_id,
          sender: msg.sender,
          text: msg.text,
          translation: msg.translation,
          timestamp: msg.timestamp,
        })),
        vocabulary: vocabulary.map((word: any) => ({
          word: word.word,
          translation: word.translation,
          example: word.example,
          exampleTranslation: word.example_translation,
          pronunciation: word.pronunciation,
        })),
        grammarPoints: grammarPoints.map((point: any) => point.point),
        feedback: feedback ? {
          strengths: feedback.strengths,
          improvements: feedback.improvements,
          note: feedback.note,
        } : {
          strengths: [],
          improvements: [],
          note: '',
        },
      });
    }

    return { history: fullSessions };
  },

  // 获取单个会话详情
  getSessionById: async (sessionId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 获取会话
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user?.id)
      .eq('session_id', sessionId)
      .single();

    if (error) throw error;

    // 获取聊天消息
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', session.id)
      .order('timestamp');

    // 获取词汇
    const { data: vocabulary } = await supabase
      .from('session_vocabulary')
      .select('*')
      .eq('session_id', session.id);

    // 获取语法点
    const { data: grammarPoints } = await supabase
      .from('session_grammar_points')
      .select('*')
      .eq('session_id', session.id);

    // 获取反馈
    const { data: feedback } = await supabase
      .from('session_feedback')
      .select('*')
      .eq('session_id', session.id)
      .single();

    const fullSession = {
      id: session.session_id,
      date: session.date,
      level: session.level,
      goal: session.goal,
      coach: session.coach,
      duration: session.duration,
      overview: session.overview,
      transcript: messages.map((msg: any) => ({
        id: msg.message_id,
        sender: msg.sender,
        text: msg.text,
        translation: msg.translation,
        timestamp: msg.timestamp,
      })),
      vocabulary: vocabulary.map((word: any) => ({
        word: word.word,
        translation: word.translation,
        example: word.example,
        exampleTranslation: word.example_translation,
        pronunciation: word.pronunciation,
      })),
      grammarPoints: grammarPoints.map((point: any) => point.point),
      feedback: feedback ? {
        strengths: feedback.strengths,
        improvements: feedback.improvements,
        note: feedback.note,
      } : {
        strengths: [],
        improvements: [],
        note: '',
      },
    };

    return { session: fullSession };
  },
};

// 词汇相关API
export const vocabularyAPI = {
  // 添加单词到笔记本
  addWord: async (word: WordDefinition) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 检查单词是否已存在
    const { data: existingWord } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('user_id', user?.id)
      .ilike('word', word.word)
      .single();

    if (existingWord) {
      throw new Error('Word already exists in notebook');
    }

    // 添加单词
    const { error } = await supabase
      .from('vocabulary')
      .insert({
        user_id: user?.id,
        word: word.word,
        translation: word.translation,
        example: word.example,
        example_translation: word.exampleTranslation,
        pronunciation: word.pronunciation,
      });

    if (error) throw error;

    return { message: 'Word added to notebook' };
  },

  // 获取单词笔记本
  getNotebook: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: words, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      notebook: words.map((word: any) => ({
        word: word.word,
        translation: word.translation,
        example: word.example,
        exampleTranslation: word.example_translation,
        pronunciation: word.pronunciation,
      })),
    };
  },

  // 从笔记本中删除单词
  deleteWord: async (word: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('vocabulary')
      .delete()
      .eq('user_id', user?.id)
      .ilike('word', word);

    if (error) throw error;

    return { message: 'Word removed from notebook' };
  },
};