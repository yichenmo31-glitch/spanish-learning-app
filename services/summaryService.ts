
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, LearningLevel, LearningGoal } from "../types";

export interface SessionAnalysis {
  overview: string;
  grammarPoints: string[];
  feedback: {
    strengths: string[];
    improvements: string[];
    note: string;
  };
}

const emptyAnalysis = (overview: string): SessionAnalysis => ({
  overview,
  grammarPoints: [],
  feedback: { strengths: [], improvements: [], note: "" },
});

/**
 * Analyzes a finished conversation and returns a concise overview plus
 * actionable, learner-facing feedback (grammar points, strengths, things to
 * work on, and an encouraging note). Falls back to an overview-only result if
 * the model call fails so ending a session never breaks.
 */
export async function generateSessionAnalysis(
  messages: ChatMessage[],
  level: LearningLevel,
  goal: LearningGoal
): Promise<SessionAnalysis> {
  if (messages.length === 0) {
    return emptyAnalysis("A brief introductory exchange.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const transcript = messages
    .map(m => `${m.sender === 'user' ? 'Learner' : 'Coach'}: ${m.text}`)
    .join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a supportive Spanish tutor reviewing a practice conversation with a ${level} learner whose goal is "${goal}".
Analyze ONLY the learner's Spanish (the "Learner:" lines) and produce constructive, specific feedback.

Conversation:
${transcript}

Return a JSON object with:
- overview: one neutral English sentence (~30 words) describing what was discussed.
- grammarPoints: 2-4 short English bullet strings naming grammar structures the learner used or should review (e.g. "Past tense (pretérito) of regular -ar verbs"). Empty array if there is too little to assess.
- strengths: 1-3 short English bullet strings on what the learner did well.
- improvements: 1-3 short English bullet strings on concrete things to work on, referencing Spanish examples where helpful.
- note: one short warm, encouraging sentence to the learner.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING },
            grammarPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            note: { type: Type.STRING },
          },
          required: ["overview", "grammarPoints", "strengths", "improvements", "note"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");

    return {
      overview: data.overview?.trim() || "A Spanish conversation session exploring various topics.",
      grammarPoints: Array.isArray(data.grammarPoints) ? data.grammarPoints : [],
      feedback: {
        strengths: Array.isArray(data.strengths) ? data.strengths : [],
        improvements: Array.isArray(data.improvements) ? data.improvements : [],
        note: data.note?.trim() || "",
      },
    };
  } catch (error) {
    console.error("Failed to generate session analysis:", error);
    return emptyAnalysis("A Spanish conversation session exploring various topics.");
  }
}

/**
 * Backwards-compatible helper: returns just the one-sentence overview.
 */
export async function generateConversationOverview(messages: ChatMessage[]): Promise<string> {
  const { overview } = await generateSessionAnalysis(
    messages,
    LearningLevel.BEGINNER,
    LearningGoal.DAILY
  );
  return overview;
}
