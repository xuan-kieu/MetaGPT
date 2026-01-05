import { GoogleGenAI } from "@google/genai";
import { BehavioralFeature, InferenceResult } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing VITE_GEMINI_API_KEY in .env");
}

const ai = new GoogleGenAI({ apiKey });

export const analyzeBehavioralPatterns = async (
  features: BehavioralFeature[]
): Promise<InferenceResult> => {
  // Kiểm tra dữ liệu đầu vào
  if (!features || features.length === 0) {
    console.warn("No features provided for analysis");
    return createFallbackResult(features, "No data provided");
  }

  // Tính toán các metrics
  const avgGazeX = features.reduce((acc, f) => acc + f.gazeX, 0) / features.length;
  const avgGazeY = features.reduce((acc, f) => acc + f.gazeY, 0) / features.length;
  const avgSmile = features.reduce((acc, f) => acc + f.smileIntensity, 0) / features.length;
  const avgAttention = features.reduce((acc, f) => acc + f.attentionLevel, 0) / features.length;
  const avgFrown = features.reduce((acc, f) => acc + f.frownIntensity, 0) / features.length;
  
  // Tính thêm các metrics variance
  const gazeXVariance = calculateVariance(features, 'gazeX');
  const gazeYVariance = calculateVariance(features, 'gazeY');
  const affectRatio = avgSmile / Math.max(0.1, avgFrown);
  
  // Tính toán behavioral score dựa trên các metrics
  const behavioralScore = calculateBehavioralScore(
    avgAttention, 
    avgSmile, 
    gazeXVariance, 
    gazeYVariance
  );

  const prompt = `ANALYZE BEHAVIORAL PATTERNS - CHILD DEVELOPMENT SCREENING

SESSION CONTEXT:
- Activity: Interactive "Catch the Cloud" visual tracking game
- Duration: ${((features[features.length-1].timestamp - features[0].timestamp) / 1000).toFixed(1)} seconds
- Data Points: ${features.length}

BEHAVIORAL METRICS (extracted on-device, no raw video):
1. VISUAL ATTENTION:
   - Gaze Stability X: ${(1 - gazeXVariance).toFixed(3)} (0=unstable, 1=stable)
   - Gaze Stability Y: ${(1 - gazeYVariance).toFixed(3)}
   - Attention Level: ${avgAttention.toFixed(3)} (0-1 scale)

2. AFFECT & ENGAGEMENT:
   - Positive Affect (Smile): ${avgSmile.toFixed(3)} (0-1)
   - Engagement Ratio: ${affectRatio.toFixed(2)} (higher=more positive)
   - Average Gaze Position: (${avgGazeX.toFixed(3)}, ${avgGazeY.toFixed(3)})

ANALYSIS REQUEST:
Provide a concise 2-3 sentence behavioral observation focusing on:
- Visual tracking consistency
- Engagement with interactive stimuli
- Affect regulation during task
- Age-appropriate interaction patterns

IMPORTANT: NO medical diagnoses. Use descriptive, observational language only.

FORMAT: Return ONLY a JSON object with this structure:
{
  "explanation": "Your analysis here",
  "behavioralTags": ["tag1", "tag2", "tag3"],
  "confidence": 0.85
}`;

  try {
    console.log(`Calling Gemini API with ${features.length} features...`);
    
    // Sử dụng model gemini-3-pro-preview
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Model mới nhất
      contents: [{ 
        role: "user", 
        parts: [{ text: prompt }]
      }],
      config: {
        temperature: 0.7,
        maxOutputTokens: 500,
        responseMimeType: "application/json"
      }
    });

    console.log("Gemini API response received");

    // Parse response - cách 1: response.text
    let resultText = '';
    
    if (typeof response === 'string') {
      resultText = response;
    } else if (response.text) {
      resultText = response.text;
    } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
      resultText = response.candidates[0].content.parts[0].text;
    } else {
      console.warn("Unexpected response format:", response);
      return createFallbackResult(features, "Unexpected API response format");
    }

    console.log("Raw Gemini response:", resultText.substring(0, 200) + "...");

    // Clean and parse JSON
    const cleanedText = resultText.replace(/```json\s*|\s*```/g, '').trim();
    let result;
    
    try {
      result = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse JSON, trying to extract:", parseError);
      
      // Try to extract JSON with regex
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error("Regex extraction failed:", e);
          return createFallbackResult(features, "JSON parsing failed");
        }
      } else {
        return createFallbackResult(features, "No JSON found in response");
      }
    }

    // Validate required fields
    if (!result.explanation || !Array.isArray(result.behavioralTags)) {
      console.warn("Missing required fields in response:", result);
      return createFallbackResult(features, "Invalid response structure");
    }

    // Ensure confidence is a valid number
    const confidence = typeof result.confidence === 'number' 
      ? Math.min(0.99, Math.max(0.5, result.confidence))
      : 0.8;

    // Calculate final score (combine behavioral score and AI confidence)
    const finalScore = Math.min(10, Math.round(
      behavioralScore * 0.6 + // 60% từ behavioral metrics
      confidence * 10 * 0.4    // 40% từ AI confidence
    ));

    // Generate tags từ analysis
    const generatedTags = generateBehavioralTags(
      result.behavioralTags,
      behavioralScore,
      avgAttention,
      avgSmile,
      gazeXVariance
    );

    return {
      patternId: `analysis-${Date.now()}`,
      explanation: result.explanation,
      behavioralTags: generatedTags,
      confidence: confidence,
      score: finalScore,
      features: {
        avgGazeX,
        avgGazeY,
        avgSmile,
        avgAttention,
        avgFrown,
        gazeXVariance,
        gazeYVariance,
        affectRatio,
        sampleSize: features.length,
        sessionDuration: (features[features.length-1].timestamp - features[0].timestamp) / 1000,
        modelUsed: "gemini-3-pro-preview"
      }
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    
    // Detailed error handling
    const errorMessage = error instanceof Error ? error.message : "Unknown API error";
    
    // Check for specific API errors
    if (errorMessage.includes("model") && errorMessage.includes("not found")) {
      console.error("Model not found, trying fallback...");
      return await tryFallbackModel(features, behavioralScore, {
        avgGazeX, avgGazeY, avgSmile, avgAttention, avgFrown,
        gazeXVariance, gazeYVariance, affectRatio
      });
    }
    
    return createFallbackResult(features, errorMessage);
  }
};

// Fallback nếu model không tồn tại
const tryFallbackModel = async (
  features: BehavioralFeature[],
  behavioralScore: number,
  metrics: any
): Promise<InferenceResult> => {
  console.log("Trying fallback model...");
  
  // Try different models
  const modelsToTry = ["gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];
  
  for (const model of modelsToTry) {
    try {
      console.log(`Trying model: ${model}`);
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: model,
        contents: [{ 
          role: "user", 
          parts: [{ text: "Analyze behavioral patterns: " + 
            `Attention: ${metrics.avgAttention.toFixed(2)}, ` +
            `Smile: ${metrics.avgSmile.toFixed(2)}, ` +
            `Data Points: ${features.length}` }]
        }]
      });
      
      const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "Analysis complete.";
      
      return {
        patternId: `fallback-${model}-${Date.now()}`,
        explanation: `Analysis using ${model}: ${text.substring(0, 150)}...`,
        behavioralTags: ["fallback_analysis", "model_${model}"],
        confidence: 0.6,
        score: Math.min(10, Math.round(behavioralScore)),
        features: {
          ...metrics,
          sampleSize: features.length,
          fallbackModel: model
        }
      };
    } catch (fallbackError) {
      console.warn(`Model ${model} failed:`, fallbackError);
      continue;
    }
  }
  
  // All models failed, use local analysis
  return createFallbackResult(features, "All API models failed");
};

// Helper functions
const calculateVariance = (features: BehavioralFeature[], key: keyof BehavioralFeature): number => {
  if (features.length < 2) return 0;
  
  const values = features.map(f => f[key] as number);
  const mean = values.reduce((a, b) => a + b) / values.length;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  
  return Math.sqrt(variance); // Return standard deviation
};

const calculateBehavioralScore = (
  attention: number,
  smile: number,
  gazeXVariance: number,
  gazeYVariance: number
): number => {
  // Higher attention = better score (max 4)
  const attentionScore = attention * 4;
  
  // Higher smile = better score (max 3)
  const affectScore = smile * 3;
  
  // Lower variance = more stable = better score
  const gazeStabilityScore = (1 - Math.min(1, gazeXVariance * 2)) * 2;
  const gazeStabilityScoreY = (1 - Math.min(1, gazeYVariance * 2)) * 1;
  
  // Total out of 10
  return Math.min(10, attentionScore + affectScore + gazeStabilityScore + gazeStabilityScoreY);
};

const generateBehavioralTags = (
  apiTags: string[],
  behavioralScore: number,
  attention: number,
  smile: number,
  gazeVariance: number
): string[] => {
  const tags = [...apiTags];
  
  // Add quantitative tags
  if (behavioralScore > 8) tags.push("high_engagement");
  else if (behavioralScore > 5) tags.push("moderate_engagement");
  else tags.push("low_engagement");
  
  if (attention > 0.7) tags.push("focused_attention");
  if (smile > 0.6) tags.push("positive_affect");
  if (gazeVariance < 0.2) tags.push("stable_gaze");
  
  // Ensure unique tags
  return [...new Set(tags)].slice(0, 8);
};

const createFallbackResult = (features: BehavioralFeature[], error: string): InferenceResult => {
  const avgAttention = features.reduce((acc, f) => acc + f.attentionLevel, 0) / Math.max(1, features.length);
  const avgSmile = features.reduce((acc, f) => acc + f.smileIntensity, 0) / Math.max(1, features.length);
  const avgFrown = features.reduce((acc, f) => acc + f.frownIntensity, 0) / Math.max(1, features.length);
  
  const score = Math.min(10, avgAttention * 5 + avgSmile * 4 + (1 - avgFrown));
  
  // Generate descriptive explanation
  let explanation = `Local behavioral analysis completed. `;
  
  if (features.length > 30) {
    explanation += `Robust dataset of ${features.length} behavioral features analyzed. `;
  }
  
  if (avgAttention > 0.7) {
    explanation += `Sustained attention patterns observed. `;
  }
  
  if (avgSmile > 0.5) {
    explanation += `Positive affect maintained throughout the activity.`;
  } else {
    explanation += `Neutral affect observed during interactive tasks.`;
  }
  
  return {
    patternId: `local-${Date.now()}`,
    explanation,
    behavioralTags: features.length > 20 ? 
      ["local_analysis", "sufficient_data", "behavioral_patterns"] : 
      ["local_analysis", "limited_data", "preliminary"],
    confidence: 0.65,
    score: Math.round(score),
    features: {
      avgAttention,
      avgSmile,
      avgFrown,
      sampleSize: features.length,
      error: error.substring(0, 100),
      fallback: true,
      localAnalysis: true
    }
  };
};