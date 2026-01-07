import { BehavioralFeature, InferenceResult, BehavioralClassification } from "../types";
import localModelService from "./localModelService";

export const analyzeBehavioralPatterns = async (
  features: BehavioralFeature[]
): Promise<InferenceResult> => {
  console.log(`🧠 Local behavior analysis on ${features.length} features`);
  
  if (!features || features.length < 5) {
    return createFallbackResult(features, "Insufficient data");
  }
  
  try {
    // 1. Use local model for behavioral classification
    const modelResult = await localModelService.analyzeBehavior(features);
    
    // 2. Calculate metrics
    const metrics = calculateMetrics(features);
    
    // 3. Generate explanation based on classification
    const explanation = generateExplanation(modelResult.classification, metrics);
    
    // 4. Generate behavioral tags
    const behavioralTags = generateBehavioralTags(modelResult.classification);
    
    // 5. Calculate score
    const score = calculateBehavioralScore(
      modelResult.classification,
      metrics,
      modelResult.confidence
    );
    
    return {
      patternId: `local-${Date.now()}`,
      explanation,
      behavioralTags,
      behavioralClassification: modelResult.classification,
      confidence: modelResult.confidence,
      score: Math.min(10, Math.round(score)),
      features: {
        ...metrics,
        classification: modelResult.classification,
        predictions: modelResult.predictions,
        modelConfidence: modelResult.confidence,
        sampleSize: features.length,
        sessionDuration: metrics.sessionDuration,
        analysisMethod: "local_tfjs_model"
      }
    };
    
  } catch (error) {
    console.error('Local model analysis failed:', error);
    return createFallbackResult(features, error instanceof Error ? error.message : "Model error");
  }
};

// Helper functions (giữ từ geminiService offline version)
const calculateMetrics = (features: BehavioralFeature[]) => {
  const avgGazeX = features.reduce((acc, f) => acc + f.gazeX, 0) / features.length;
  const avgGazeY = features.reduce((acc, f) => acc + f.gazeY, 0) / features.length;
  const avgSmile = features.reduce((acc, f) => acc + f.smileIntensity, 0) / features.length;
  const avgAttention = features.reduce((acc, f) => acc + f.attentionLevel, 0) / features.length;
  const avgFrown = features.reduce((acc, f) => acc + f.frownIntensity, 0) / features.length;
  
  // Calculate variance and stability
  const gazeStability = calculateGazeStability(features);
  const affectConsistency = calculateAffectConsistency(features);
  const engagementLevel = calculateEngagementLevel(features);
  
  // Calculate session duration in seconds
  const sessionDuration = features.length > 1 
    ? (features[features.length-1].timestamp - features[0].timestamp) / 1000 
    : 0;

  return {
    avgGazeX,
    avgGazeY,
    avgSmile,
    avgAttention,
    avgFrown,
    gazeStability,
    affectConsistency,
    engagementLevel,
    sessionDuration,
    sampleSize: features.length
  };
};

const calculateGazeStability = (features: BehavioralFeature[]): number => {
  if (features.length < 2) return 0.5;
  
  let totalChange = 0;
  for (let i = 1; i < features.length; i++) {
    totalChange += Math.abs(features[i].gazeX - features[i-1].gazeX);
    totalChange += Math.abs(features[i].gazeY - features[i-1].gazeY);
  }
  
  const avgChange = totalChange / ((features.length - 1) * 2);
  return Math.max(0, 1 - avgChange * 2);
};

const calculateAffectConsistency = (features: BehavioralFeature[]): number => {
  const positiveCount = features.filter(f => f.affect === 'positive').length;
  const neutralCount = features.filter(f => f.affect === 'neutral').length;
  const negativeCount = features.filter(f => f.affect === 'negative').length;
  
  const maxCount = Math.max(positiveCount, neutralCount, negativeCount);
  return maxCount / features.length;
};

const calculateEngagementLevel = (features: BehavioralFeature[]): number => {
  const avgAttention = features.reduce((acc, f) => acc + f.attentionLevel, 0) / features.length;
  const avgSmile = features.reduce((acc, f) => acc + f.smileIntensity, 0) / features.length;
  
  // Engagement is combination of attention and positive affect
  return (avgAttention * 0.6 + avgSmile * 0.4);
};

const generateExplanation = (
  classification: BehavioralClassification,
  metrics: ReturnType<typeof calculateMetrics>
): string => {
  const parts = [];
  
  // Visual Attention
  if (classification.gazePattern === 'focused') {
    parts.push("Sustained focused attention on task");
  } else if (classification.gazePattern === 'scanning') {
    parts.push("Active visual scanning observed");
  } else if (classification.gazePattern === 'distracted') {
    parts.push("Variable attention with distractions");
  }
  
  // Affect
  if (classification.affectType === 'positive') {
    parts.push("positive emotional engagement maintained");
  } else if (classification.affectType === 'mixed') {
    parts.push("mixed emotional responses");
  } else if (classification.affectType === 'negative') {
    parts.push("minimal positive affect");
  }
  
  // Engagement
  if (classification.engagementLevel === 'high') {
    parts.push("with high overall task engagement");
  } else if (classification.engagementLevel === 'medium') {
    parts.push("with moderate engagement");
  }
  
  // Data quality note
  if (metrics.sampleSize > 30) {
    parts.push(`(based on ${metrics.sampleSize} behavioral samples)`);
  }
  
  return parts.join(". ") + ".";
};

const generateBehavioralTags = (
  classification: BehavioralClassification
): string[] => {
  const tags = [];
  
  // Map classification to tags
  tags.push(`gaze_${classification.gazePattern}`);
  tags.push(`affect_${classification.affectType}`);
  tags.push(`engagement_${classification.engagementLevel}`);
  tags.push(`attention_${classification.attentionSpan}`);
  tags.push(`stability_${classification.gazeStability}`);
  
  // Add developmental markers
  if (classification.engagementLevel === 'high' && 
      classification.gazeStability === 'stable') {
    tags.push('age_appropriate_engagement');
  }
  
  if (classification.affectType === 'positive' && 
      classification.frustrationTolerance === 'high') {
    tags.push('good_affect_regulation');
  }
  
  return tags;
};

const calculateBehavioralScore = (
  classification: BehavioralClassification,
  metrics: ReturnType<typeof calculateMetrics>,
  confidence: number
): number => {
  let score = 5; // Base score
  
  // Adjust based on classification
  if (classification.gazePattern === 'focused') score += 2;
  if (classification.affectType === 'positive') score += 2;
  if (classification.engagementLevel === 'high') score += 1;
  if (classification.attentionSpan === 'sustained') score += 1;
  if (classification.gazeStability === 'stable') score += 1;
  
  // Adjust based on data quality
  if (metrics.sampleSize > 30) score += 1;
  if (confidence > 0.7) score += 1;
  
  return Math.min(10, score);
};

const createFallbackResult = (features: BehavioralFeature[], error: string): InferenceResult => {
  const avgAttention = features.reduce((acc, f) => acc + f.attentionLevel, 0) / Math.max(1, features.length);
  const avgSmile = features.reduce((acc, f) => acc + f.smileIntensity, 0) / Math.max(1, features.length);
  
  const score = Math.min(10, avgAttention * 5 + avgSmile * 4);
  
  return {
    patternId: `fallback-${Date.now()}`,
    explanation: `Local analysis completed. ${features.length} behavioral features analyzed.`,
    behavioralTags: features.length > 20 ? 
      ["local_analysis", "adequate_data", "basic_patterns"] : 
      ["local_analysis", "limited_data"],
    behavioralClassification: {
      gazePattern: 'distracted',
      gazeStability: 'moderate',
      visualTracking: 'saccadic',
      affectType: 'neutral',
      engagementLevel: 'medium',
      frustrationTolerance: 'medium',
      attentionSpan: 'intermittent',
      responseConsistency: 'variable',
      taskPersistence: 'moderate'
    },
    confidence: 0.6,
    score: Math.round(score),
    features: {
      avgAttention,
      avgSmile,
      sampleSize: features.length,
      error: error.substring(0, 100),
      fallback: true,
      analysisMethod: "rule_based_fallback"
    }
  };
};