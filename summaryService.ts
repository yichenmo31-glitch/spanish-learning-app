
import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

/**
 * Generates a concise English overview of the conversation.
 */
export async function generateConversationOverview(messages: ChatMessage[]): Promise<string> {
  if (messages.length === 0) return "A brief introductory exchange.";

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const transcript = messages.map(m => `${m.sender}: ${m.text}`).join('\n');

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: `Summarize the following Spanish-learning conversation in exactly one neutral and informative English sentence (approximately 30 words). Focus on what was discussed:
    
    ${transcript}`,
  });

  return response.text?.trim() || "A Spanish conversation session exploring various topics.";
}
