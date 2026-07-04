import { supabase } from './supabaseClient';
import {
  LearningLevel,
  LearningGoal,
  SessionSummary,
  WordDefinition,
  ChatMessage,
} from '../types';

/**
 * Thin API layer over Supabase (Auth + Postgres).
 *
 * The shape of these methods intentionally matches what App.tsx expects:
 *   authAPI.getCurrentUser() -> { user }
 *   profileAPI.getProfile()  -> { profile }
 *   sessionAPI.getHistory()  -> { history }
 *   vocabularyAPI.getNotebook() -> { notebook }
 *
 * Row Level Security (see supabase_schema.sql) guarantees each user can only
 * read/write their own rows, so we still pass user_id explicitly on writes.
 */

async function requireUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const authAPI = {
  async register(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { user };
  },
};

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
export const profileAPI = {
  async getProfile() {
    const userId = await requireUserId();
    if (!userId) return { profile: null };

    const { data, error } = await supabase
      .from('profiles')
      .select('level, goal, coach')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { profile: null };

    return {
      profile: {
        level: data.level as LearningLevel,
        goal: data.goal as LearningGoal,
        coach: data.coach as 'alma' | 'mateo',
      },
    };
  },

  async updateProfile(
    level: LearningLevel,
    goal: LearningGoal,
    coach: 'alma' | 'mateo'
  ) {
    const userId = await requireUserId();
    if (!userId) return;

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      level,
      goal,
      coach,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  },
};

// ---------------------------------------------------------------------------
// Sessions (learning history)
// ---------------------------------------------------------------------------
interface SessionPayload {
  session_id: string;
  date: Date;
  level: LearningLevel;
  goal: LearningGoal;
  coach: 'alma' | 'mateo';
  duration: string;
  overview: string;
  transcript: ChatMessage[];
  vocabulary: WordDefinition[];
  grammarPoints: string[];
  feedback: SessionSummary['feedback'];
}

export const sessionAPI = {
  async getHistory(): Promise<{ history: SessionSummary[] }> {
    const userId = await requireUserId();
    if (!userId) return { history: [] };

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;

    const history: SessionSummary[] = (data ?? []).map((row: any) => ({
      id: row.session_id,
      date: new Date(row.date),
      level: row.level,
      goal: row.goal,
      coach: row.coach,
      duration: row.duration,
      overview: row.overview,
      transcript: (row.transcript ?? []).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
      vocabulary: row.vocabulary ?? [],
      grammarPoints: row.grammar_points ?? [],
      feedback: row.feedback ?? { strengths: [], improvements: [], note: '' },
    }));

    return { history };
  },

  async createSession(session: SessionPayload) {
    const userId = await requireUserId();
    if (!userId) return;

    const { error } = await supabase.from('sessions').insert({
      user_id: userId,
      session_id: session.session_id,
      date: new Date(session.date).toISOString(),
      level: session.level,
      goal: session.goal,
      coach: session.coach,
      duration: session.duration,
      overview: session.overview,
      transcript: session.transcript,
      vocabulary: session.vocabulary,
      grammar_points: session.grammarPoints,
      feedback: session.feedback,
    });
    if (error) throw error;
  },
};

// ---------------------------------------------------------------------------
// Vocabulary (notebook)
// ---------------------------------------------------------------------------
interface WordPayload {
  word: string;
  translation: string;
  example: string;
  exampleTranslation?: string;
  pronunciation: string;
}

export const vocabularyAPI = {
  async getNotebook(): Promise<{ notebook: WordDefinition[] }> {
    const userId = await requireUserId();
    if (!userId) return { notebook: [] };

    const { data, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const notebook: WordDefinition[] = (data ?? []).map((row: any) => ({
      word: row.word,
      translation: row.translation,
      example: row.example,
      exampleTranslation: row.example_translation ?? undefined,
      pronunciation: row.pronunciation,
    }));

    return { notebook };
  },

  async addWord(word: WordPayload) {
    const userId = await requireUserId();
    if (!userId) return;

    // upsert so re-adding the same word for a user is a no-op instead of erroring
    const { error } = await supabase.from('vocabulary').upsert(
      {
        user_id: userId,
        word: word.word,
        translation: word.translation,
        example: word.example,
        example_translation: word.exampleTranslation ?? null,
        pronunciation: word.pronunciation,
      },
      { onConflict: 'user_id,word' }
    );
    if (error) throw error;
  },
};
