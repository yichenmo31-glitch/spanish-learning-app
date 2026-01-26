
export enum LearningLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced'
}

export enum LearningGoal {
  DAILY = 'Daily Conversation',
  TRAVEL = 'Travel',
  WORK = 'Professional/Work',
  CONFIDENCE = 'Confidence Building'
}

export interface WordDefinition {
  word: string;
  translation: string;
  example: string;
  exampleTranslation?: string;
  pronunciation: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  translation?: string;
  timestamp: Date;
}

export interface SessionSummary {
  id: string;
  date: Date;
  level: LearningLevel;
  goal: LearningGoal;
  coach: 'alma' | 'mateo';
  duration: string;
  overview: string;
  transcript: ChatMessage[];
  vocabulary: WordDefinition[];
  grammarPoints: string[];
  feedback: {
    strengths: string[];
    improvements: string[];
    note: string;
  };
}

export interface AppState {
  view: 'dashboard' | 'chat' | 'summary' | 'history' | 'notebook';
  userProfile: {
    level: LearningLevel;
    goal: LearningGoal;
    coach: 'alma' | 'mateo';
  };
  activeSession: SessionSummary | null;
  history: SessionSummary[];
  notebook: WordDefinition[];
}
