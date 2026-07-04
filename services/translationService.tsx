
import { GoogleGenAI } from "@google/genai";

/**
 * Translates Spanish text to English using Gemini 3 Flash.
 * Follows the latest SDK guidelines for model selection and initialization.
 */
export async function translateSpanishToEnglish(spanish: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Translate the following Spanish sentence into natural English. Only output the English translation: "${spanish}"`,
  });

  return response.text || "";
}
