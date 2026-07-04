
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WordDefinition, LearningLevel } from "../types";

export interface WordExplanation extends WordDefinition {
  audioBase64?: string;
  exampleAudioBase64?: string;
}

export async function getWordExplanation(word: string, level: LearningLevel): Promise<WordExplanation> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 1. Get Text Explanation
  const textResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Explain the Spanish word "${word}" for a ${level} level learner.
    Return a JSON object with:
    - meaning: A simple English explanation of the word.
    - example: ONE natural Spanish example sentence.
    - exampleTranslation: The English translation of the example.
    - pronunciation: A simplified phonetic pronunciation guide.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          meaning: { type: Type.STRING },
          example: { type: Type.STRING },
          exampleTranslation: { type: Type.STRING },
          pronunciation: { type: Type.STRING }
        },
        required: ["meaning", "example", "exampleTranslation", "pronunciation"]
      }
    }
  });

  const data = JSON.parse(textResponse.text || "{}");
  
  return {
    word: word,
    translation: data.meaning,
    example: data.example,
    exampleTranslation: data.exampleTranslation,
    pronunciation: data.pronunciation
  };
}

export async function regenerateExample(word: string, currentExample: string, level: LearningLevel) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a NEW, different Spanish example sentence for the word "${word}" (Level: ${level}).
    Current example to avoid: "${currentExample}".
    Return a JSON object with:
    - example: The new Spanish sentence.
    - exampleTranslation: The English translation.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          example: { type: Type.STRING },
          exampleTranslation: { type: Type.STRING }
        },
        required: ["example", "exampleTranslation"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
}

export async function getSpanishTTS(text: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say clearly in Spanish: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // Warm, clear voice
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio || "";
}
