import { BehavioralFeature, InferenceResult, BehavioralClassification } from "../types";
import localModelService from "./localModelService";

export const analyzeBehavioralPatterns = async (
  features: BehavioralFeature[]
): Promise<InferenceResult> => {
  console.log(`🧠 Local behavior analysis on ${features.length} features`);
  
  if (!features || features.length < 5) {
    return createFallbackResult(features, "Insufficient data (needs > 5 frames)");
  }
  
  try {
    // 1. Phân loại bằng Rule-based Model
    const modelResult = await localModelService.analyzeBehavior(features);
    
    // 2. Tính toán Metrics (Updated để khớp với App.tsx)
    const metrics = calculateMetrics(features, modelResult.classification);
    
    // 3. Tạo giải thích
    const explanation = generateExplanation(modelResult.classification);
    
    // 4. Tính điểm
    const score = calculateBehavioralScore(modelResult.classification);
    
    return {
      patternId: `local-${Date.now()}`,
      explanation,
      behavioralTags: generateBehavioralTags(modelResult.classification),
      behavioralClassification: modelResult.classification,
      confidence: modelResult.confidence,
      score,
      features: {
        ...metrics, // Spread metrics để App.tsx có thể đọc trực tiếp
        classification: modelResult.classification,
        predictions: modelResult.predictions,
        modelConfidence: modelResult.confidence,
        analysisMethod: "local_rule_based"
      }
    };
    
  } catch (error) {
    console.error('Local model analysis failed:', error);
    return createFallbackResult(features, error instanceof Error ? error.message : "Analysis Error");
  }
};

// --- Helpers ---

const calculateMetrics = (features: BehavioralFeature[], classification: BehavioralClassification) => {
  const sum = (key: keyof BehavioralFeature) => features.reduce((acc, f) => acc + (f[key] as number), 0);
  const avg = (key: keyof BehavioralFeature) => sum(key) / features.length;

  // Tính gaze stability numeric (0-1) dựa trên classification
  const stabilityScore = classification.gazeStability === 'stable' ? 0.9 : 
                         classification.gazeStability === 'moderate' ? 0.6 : 0.3;

  // Tính engagement numeric (0-1) dựa trên classification
  const engagementScore = classification.engagementLevel === 'high' ? 0.9 : 
                          classification.engagementLevel === 'medium' ? 0.6 : 0.3;

  return {
    avgGazeX: avg('gazeX'),
    avgGazeY: avg('gazeY'),
    avgSmile: avg('smileIntensity'),
    avgAttention: avg('attentionLevel'),
    gazeStability: stabilityScore,   // Đã thêm cho App.tsx
    engagementLevel: engagementScore, // Đã thêm cho App.tsx
    sampleSize: features.length
  };
};

const generateExplanation = (cls: BehavioralClassification): string => {
  return `Observed ${cls.gazePattern} gaze pattern with ${cls.engagementLevel} engagement level.`;
};

const generateBehavioralTags = (cls: BehavioralClassification): string[] => {
  return [
    `gaze_${cls.gazePattern}`,
    `engagement_${cls.engagementLevel}`,
    `affect_${cls.affectType}`
  ];
};

const calculateBehavioralScore = (cls: BehavioralClassification): number => {
  let score = 5;
  if (cls.engagementLevel === 'high') score += 2;
  if (cls.gazePattern === 'focused') score += 2;
  if (cls.affectType === 'positive') score += 1;
  return Math.min(10, Math.round(score));
};

const createFallbackResult = (features: BehavioralFeature[], error: string): InferenceResult => {
  return {
    patternId: `fallback-${Date.now()}`,
    explanation: "Analysis fallback due to insufficient data.",
    behavioralTags: ["incomplete_analysis"],
    confidence: 0,
    score: 0,
    features: {
        error: error,
        fallback: true
    }
  };
};