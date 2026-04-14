import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface SongRecommendation {
  title: string;
  artist: string;
  album?: string;
  reason: string;
  year?: string;
  genre?: string;
  tags: string[];
}

export interface VibeAnalysis {
  explanation: string;
  vibeColor: string; // Hex color representing the mood
  recommendations: SongRecommendation[];
}

export async function analyzeVibe(userInput: string): Promise<VibeAnalysis> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the mood of this text and recommend 8-10 songs that match it: "${userInput}"`,
    config: {
      systemInstruction: "Act as an expert music curator. Analyze the user's mood and provide a list of specific song recommendations. For each song, include the title, artist, and a brief reason why it fits the mood. Also provide a 'vibeColor' (hex) that represents the overall mood. Return a JSON response.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: {
            type: Type.STRING,
            description: "A brief summary of the detected mood.",
          },
          vibeColor: {
            type: Type.STRING,
            description: "A hex color code representing the mood (e.g., #FF5733).",
          },
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                artist: { type: Type.STRING },
                album: { type: Type.STRING },
                year: { type: Type.STRING },
                genre: { type: Type.STRING },
                reason: { type: Type.STRING, description: "Why this song fits the mood." },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "2-3 mood tags for the song.",
                },
              },
              required: ["title", "artist", "reason", "tags"],
            },
          },
        },
        required: ["explanation", "vibeColor", "recommendations"],
      },
    },
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse Gemini response:", response.text);
    throw new Error("Failed to analyze vibe and get recommendations");
  }
}
