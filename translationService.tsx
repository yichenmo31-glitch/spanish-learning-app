
import { GoogleGenAI } from "@google/genai";

/**
 * Translates Spanish text to English using Gemini 3 Flash.
 * Follows the latest SDK guidelines for model selection and initialization.
 */
export async function translateSpanishToEnglish(spanish: string): Promise<string> {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error('Google GenAI API key is not set');
  }
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: `Translate the following Spanish sentence into natural English. Only output the English translation: "${spanish}"`,
  });

  return response.text || "";
}
