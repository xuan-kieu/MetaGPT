// services/behaviorAnalysisService.ts
import { BehavioralFeature, InferenceResult, BehavioralClassification, Emotion } from '../types';
import localModelService from './localModelService';

export const analyzeBehavioralPatterns = async (
  features: BehavioralFeature[]
): Promise<InferenceResult> => {
  console.log(`🧠 Local behavior analysis on ${features.length} features`);

  if (!features || features.length < 5) {
    return createFallbackResult(features, 'Insufficient data (needs > 5 frames)');
  }

  try {
    // 1. Phân loại bằng Rule-based Model
    const modelResult = await localModelService.analyzeBehavior(features);

    // 2. Xây dựng features object đúng chuẩn InferenceResult['features']
    const baseFeatures = buildInferenceFeatures(features);

    return {
      patternId: `local-${Date.now()}`,
      explanation: generateExplanation(modelResult.classification),
      behavioralTags: generateBehavioralTags(modelResult.classification),
      behavioralClassification: modelResult.classification,
      confidence: modelResult.confidence,
      score: calculateBehavioralScore(modelResult.classification),
      features: {
        ...baseFeatures,
        classification: modelResult.classification,
        predictions: modelResult.predictions,
        modelConfidence: modelResult.confidence,
        analysisMethod: 'local_rule_based',
      },
    };
  } catch (error) {
    console.error('Local model analysis failed:', error);
    return createFallbackResult(
      features,
      error instanceof Error ? error.message : 'Analysis Error'
    );
  }
};

/**
 * Xây dựng object features đúng với định nghĩa InferenceResult['features']
 * Bao gồm các trường bắt buộc và tính toán từ dữ liệu thực tế.
 */
const buildInferenceFeatures = (features: BehavioralFeature[]) => {
  const sum = (key: keyof BehavioralFeature) =>
    features.reduce((acc, f) => acc + (f[key] as number), 0);
  const avg = (key: keyof BehavioralFeature) => sum(key) / features.length;

  // 1. Độ ổn định gaze – tính từ phương sai
  const gazeVariance = calculateGazeVariance(features);
  const gazeStability = Math.max(0, Math.min(1, 1 - gazeVariance * 5));

  // 2. windowSize = số lượng features
  const windowSize = features.length;

  // 3. hasFaceData – kiểm tra có face landmark hoặc face confidence > 0.5
  const hasFaceData = features.some(
    (f) => f.faceConfidence > 0.5 || (f.faceLandmarks?.length || 0) > 0
  );

  // 4. timestamp – lấy từ feature cuối cùng hoặc hiện tại
  const timestamp = features[features.length - 1]?.timestamp ?? Date.now();

  // 5. avgAttention – trung bình attentionLevel
  const avgAttention = avg('attentionLevel');

  // 6. dominantEmotion – cảm xúc xuất hiện nhiều nhất
  const dominantEmotion = calculateDominantEmotion(features);

  // Các chỉ số phụ trợ (vẫn giữ để debug)
  const auxiliary = {
    avgGazeX: avg('gazeX'),
    avgGazeY: avg('gazeY'),
    avgSmile: avg('smileIntensity'),
    gazeVariance,
    sampleSize: features.length,
  };

  return {
    // Bắt buộc
    gazeStability,
    windowSize,
    hasFaceData,
    timestamp,
    avgAttention,
    dominantEmotion,
    // Phụ trợ
    ...auxiliary,
  };
};

/**
 * Tính phương sai của gaze (dựa trên gazeX, gazeY)
 */
const calculateGazeVariance = (features: BehavioralFeature[]): number => {
  if (features.length < 2) return 0;
  const xVals = features.map((f) => f.gazeX);
  const yVals = features.map((f) => f.gazeY);
  const variance = (nums: number[]) => {
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    return nums.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / nums.length;
  };
  return (variance(xVals) + variance(yVals)) / 2;
};

/**
 * Xác định cảm xúc chiếm ưu thế trong cửa sổ
 */
const calculateDominantEmotion = (features: BehavioralFeature[]): Emotion => {
  const counts: Record<Emotion, number> = {
    neutral: 0,
    happy: 0,
    sad: 0,
    angry: 0,
    surprised: 0,
    fearful: 0,
    disgusted: 0,
  };
  features.forEach((f) => {
    if (f.affect in counts) {
      counts[f.affect as Emotion] += 1;
    }
  });
  let maxEmotion: Emotion = 'neutral';
  let maxCount = 0;
  for (const [emotion, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxEmotion = emotion as Emotion;
    }
  }
  return maxEmotion;
};

// --- Các hàm hỗ trợ giữ nguyên ---
const generateExplanation = (cls: BehavioralClassification): string => {
  return `Observed ${cls.gazePattern} gaze pattern with ${cls.engagementLevel} engagement level.`;
};

const generateBehavioralTags = (cls: BehavioralClassification): string[] => {
  return [`gaze_${cls.gazePattern}`, `engagement_${cls.engagementLevel}`, `affect_${cls.affectType}`];
};

const calculateBehavioralScore = (cls: BehavioralClassification): number => {
  let score = 5;
  if (cls.engagementLevel === 'high') score += 2;
  if (cls.gazePattern === 'focused') score += 2;
  if (cls.affectType === 'positive') score += 1;
  return Math.min(10, Math.round(score));
};

/**
 * Tạo kết quả fallback khi không đủ dữ liệu hoặc có lỗi
 */
const createFallbackResult = (features: BehavioralFeature[], error: string): InferenceResult => {
  // Vẫn phải tạo features hợp lệ với các trường bắt buộc
  const timestamp = features.length > 0 ? features[features.length - 1]?.timestamp ?? Date.now() : Date.now();
  return {
    patternId: `fallback-${Date.now()}`,
    explanation: 'Analysis fallback due to insufficient data.',
    behavioralTags: ['incomplete_analysis'],
    confidence: 0,
    score: 0,
    features: {
      gazeStability: 0,
      windowSize: features.length,
      hasFaceData: false,
      timestamp,
      avgAttention: 0,
      dominantEmotion: 'neutral',
      error,
      fallback: true,
    },
  };
};