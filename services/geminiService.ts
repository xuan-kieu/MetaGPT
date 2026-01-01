import { GoogleGenAI, Type } from "@google/genai";
import { BehavioralFeature, InferenceResult } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing VITE_GEMINI_API_KEY in .env");
}

const ai = new GoogleGenAI({ apiKey });

export const analyzeBehavioralPatterns = async (
  features: BehavioralFeature[]
): Promise<InferenceResult> => {

  const avgGazeX =
    features.reduce((acc, f) => acc + f.gazeX, 0) / features.length;

  const avgSmile =
    features.reduce((acc, f) => acc + f.smileIntensity, 0) / features.length;

  const prompt = `Analyze this anonymized developmental behavioral data (time-series summary):
- Avg Gaze Stability: ${avgGazeX.toFixed(2)}
- Avg Affect (Smile): ${avgSmile.toFixed(2)}
- Total Data Points: ${features.length}

Provide a clinical explanation of behavior patterns without diagnostic labels.
Return only the explanation and descriptive behavioral tags.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING },
          behavioralTags: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          confidence: { type: Type.NUMBER }
        },
        required: ["explanation", "behavioralTags", "confidence"]
      }
    }
  });

  const result = JSON.parse(response.text);

  return {
    patternId: crypto.randomUUID(), // tốt hơn Math.random
    ...result
  };
};
