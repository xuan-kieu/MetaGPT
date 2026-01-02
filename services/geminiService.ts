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
  
  // Tính thêm các metrics variance
  const gazeXVariance = calculateVariance(features, 'gazeX');
  const gazeYVariance = calculateVariance(features, 'gazeY');
  
  // Tính toán behavioral score dựa trên các metrics
  const behavioralScore = calculateBehavioralScore(
    avgAttention, 
    avgSmile, 
    gazeXVariance, 
    gazeYVariance
  );

  const prompt = `You are an expert developmental behavior analyst. Analyze these ANONYMIZED behavioral features extracted on-device (no raw video/audio):
  
SESSION METRICS:
- Average Gaze X Position: ${avgGazeX.toFixed(3)} (0=left, 1=right)
- Average Gaze Y Position: ${avgGazeY.toFixed(3)} (0=top, 1=bottom)
- Gaze X Variance: ${gazeXVariance.toFixed(3)} (lower = more stable)
- Gaze Y Variance: ${gazeYVariance.toFixed(3)} (lower = more stable)
- Positive Affect (Smile Intensity): ${avgSmile.toFixed(3)} (0-1 scale)
- Attention Level: ${avgAttention.toFixed(3)} (0-1 scale)
- Data Points: ${features.length}
- Session Duration: ${((features[features.length-1].timestamp - features[0].timestamp) / 1000).toFixed(1)} seconds

TASK: Subject was engaged in a visual tracking game (clicking moving targets).

INSTRUCTIONS:
1. Analyze gaze patterns for stability and engagement
2. Assess affect/emotional response consistency
3. Evaluate attention maintenance
4. Provide 3-5 behavioral observation tags
5. DO NOT provide medical diagnoses
6. DO NOT use technical jargon without explanation
7. Focus on observable behavioral patterns only

RESPONSE FORMAT (JSON):
{
  "explanation": "2-3 sentence clinical observation",
  "behavioralTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "confidence": 0.95
}`;

  try {
    console.log("Calling Gemini API with features:", features.length);
    
    // FIX: Sử dụng API call đúng với Google GenAI SDK mới nhất
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Model nhanh và hiệu quả
      contents: prompt, // FIX: SDK mới chỉ cần string prompt
      config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 500,
      }
    });

    // FIX: Parse response theo SDK mới
    let resultText = '';
    
    // Cách 1: Nếu response có text property
    if (response.text) {
      resultText = response.text;
    } 
    // Cách 2: Nếu response có candidates
    else if (response.candidates && response.candidates[0]?.content?.parts) {
      resultText = response.candidates[0].content.parts
        .map((part: any) => part.text || '')
        .join('');
    } 
    // Cách 3: Trực tiếp từ response
    else if (typeof response === 'string') {
      resultText = response;
    } else {
      console.warn("Unexpected response format:", response);
      throw new Error("Unexpected response format from Gemini");
    }

    console.log("Gemini raw response:", resultText);

    // Trích xuất JSON từ response (có thể có text ngoài JSON)
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("No JSON found in response, creating structured response from text");
      return createStructuredResult(resultText, behavioralScore, features);
    }

    const jsonStr = jsonMatch[0];
    let result;
    
    try {
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse JSON from response:", parseError);
      return createStructuredResult(resultText, behavioralScore, features);
    }

    // Validate required fields
    if (!result.explanation || !Array.isArray(result.behavioralTags)) {
      console.warn("Missing required fields in response, using fallback");
      return createFallbackResult(features, "Invalid response structure");
    }

    // Ensure confidence is a number
    const confidence = typeof result.confidence === 'number' 
      ? Math.min(1, Math.max(0, result.confidence))
      : 0.8;

    // Calculate final score combining behavioral score and AI confidence
    const finalScore = Math.min(10, Math.round(behavioralScore * 0.7 + confidence * 10 * 0.3));

    return {
      patternId: `pattern-${Date.now()}-${features.length}`,
      explanation: result.explanation,
      behavioralTags: result.behavioralTags.slice(0, 5), // Limit to 5 tags
      confidence: confidence,
      score: finalScore,
      features: {
        avgGazeX,
        avgGazeY,
        avgSmile,
        avgAttention,
        gazeXVariance,
        gazeYVariance,
        sampleSize: features.length,
        sessionDuration: (features[features.length-1].timestamp - features[0].timestamp) / 1000
      }
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    
    // Fallback với local analysis
    return createFallbackResult(features, error instanceof Error ? error.message : "Unknown error");
  }
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
  // Higher attention = better score
  const attentionScore = attention * 4;
  
  // Higher smile = better score
  const affectScore = smile * 3;
  
  // Lower variance = more stable = better score
  const gazeStabilityScore = (1 - Math.min(1, gazeXVariance * 2)) * 2;
  const gazeStabilityScoreY = (1 - Math.min(1, gazeYVariance * 2)) * 1;
  
  // Total out of 10
  return Math.min(10, attentionScore + affectScore + gazeStabilityScore + gazeStabilityScoreY);
};

const createFallbackResult = (features: BehavioralFeature[], error: string): InferenceResult => {
  const avgAttention = features.reduce((acc, f) => acc + f.attentionLevel, 0) / Math.max(1, features.length);
  const avgSmile = features.reduce((acc, f) => acc + f.smileIntensity, 0) / Math.max(1, features.length);
  
  const score = Math.min(10, avgAttention * 5 + avgSmile * 5);
  const confidence = 0.5;
  
  return {
    patternId: `fallback-${Date.now()}`,
    explanation: `Local analysis completed. ${features.length} behavioral features analyzed. ${error ? `(Error: ${error})` : ''}`,
    behavioralTags: features.length > 10 ? 
      ["local_analysis", "sufficient_data", "basic_patterns"] : 
      ["local_analysis", "limited_data"],
    confidence: confidence,
    score: Math.round(score),
    features: {
      avgAttention,
      avgSmile,
      sampleSize: features.length,
      error: error,
      fallback: true
    }
  };
};

const createStructuredResult = (text: string, behavioralScore: number, features: BehavioralFeature[]): InferenceResult => {
  // Extract key phrases from text
  const tags = [];
  if (text.toLowerCase().includes("stable")) tags.push("stable_gaze");
  if (text.toLowerCase().includes("attention") || text.toLowerCase().includes("focus")) tags.push("focused");
  if (text.toLowerCase().includes("smile") || text.toLowerCase().includes("positive")) tags.push("positive_affect");
  if (text.toLowerCase().includes("engage")) tags.push("engaged");
  if (features.length > 20) tags.push("adequate_sample");
  
  // Default tags
  if (tags.length === 0) {
    tags.push("behavioral_analysis", "pattern_observed");
  }
  
  return {
    patternId: `structured-${Date.now()}`,
    explanation: text.length > 200 ? text.substring(0, 200) + "..." : text,
    behavioralTags: tags,
    confidence: 0.7,
    score: Math.min(10, Math.round(behavioralScore)),
    features: {
      sampleSize: features.length,
      source: "text_analysis",
      textLength: text.length
    }
  };
};