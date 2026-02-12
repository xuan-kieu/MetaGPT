// services/LocalModelService.ts
import * as tf from '@tensorflow/tfjs';
import { BehavioralFeature, BehavioralClassification } from '../types';

export class LocalModelService {
  private model: tf.LayersModel | null = null;
  private isModelLoaded = false;

  constructor() {
    if (typeof window !== 'undefined') {
      tf.setBackend('webgl').catch(() => tf.setBackend('cpu'));
    }
  }

  /**
   * Tải / tạo mô hình.
   * Hiện tại chỉ tạo mô hình đơn giản – chưa được dùng cho inference.
   * Đây là placeholder cho tích hợp ML thật sau này.
   */
  async loadModel(): Promise<boolean> {
    try {
      this.model = this.createSimpleModel();
      this.isModelLoaded = true;
      return true;
    } catch (error) {
      console.error('Failed to create model:', error);
      this.isModelLoaded = false;
      return false;
    }
  }

  /**
   * Tạo mô hình Sequential đơn giản (placeholder).
   * Input: 8 features, Output: 6 classes (softmax).
   */
  private createSimpleModel(): tf.LayersModel {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 8, activation: 'relu', inputShape: [8] }));
    model.add(tf.layers.dense({ units: 6, activation: 'softmax' }));
    model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy' });
    return model;
  }

  /**
   * Phân tích hành vi dựa trên cửa sổ dữ liệu.
   * Hiện tại dùng luật (heuristics), sau này có thể tích hợp model thật.
   */
  async analyzeBehavior(
    features: BehavioralFeature[]
  ): Promise<{
    classification: BehavioralClassification;
    confidence: number;
    predictions: Record<string, number>;
  }> {
    return this.ruleBasedAnalysis(features);
  }

  // -----------------------------------------------------------------
  //  PHÂN TÍCH DỰA TRÊN LUẬT (RULE-BASED)
  // -----------------------------------------------------------------
  private ruleBasedAnalysis(features: BehavioralFeature[]) {
    const classification: BehavioralClassification = {
      gazePattern: this.determineGazePattern(features),
      gazeStability: this.determineGazeStability(features),
      visualTracking: this.determineVisualTracking(features),
      affectType: this.determineAffectType(features),
      engagementLevel: this.determineEngagementLevel(features),
      frustrationTolerance: this.determineFrustrationTolerance(features),
      attentionSpan: this.determineAttentionSpan(features),
      responseConsistency: this.determineResponseConsistency(features),
      taskPersistence: this.determineTaskPersistence(features),
    };

    const confidence = this.calculateConfidence(features);

    return {
      classification,
      confidence,
      predictions: { rule_based: 1.0 },
    };
  }

  // --- Gaze Pattern ---
  private determineGazePattern(
    features: BehavioralFeature[]
  ): BehavioralClassification['gazePattern'] {
    const variance = this.calculateGazeVariance(features);
    if (variance < 0.1) return 'focused';
    if (variance < 0.25) return 'scanning';
    if (variance < 0.45) return 'distracted';
    return 'avoidant';
  }

  // --- Gaze Stability ---
  private determineGazeStability(
    features: BehavioralFeature[]
  ): BehavioralClassification['gazeStability'] {
    const variance = this.calculateGazeVariance(features);
    if (variance < 0.15) return 'stable';
    if (variance < 0.35) return 'moderate';
    return 'unstable';
  }

  // --- Visual Tracking ---
  private determineVisualTracking(
    features: BehavioralFeature[]
  ): BehavioralClassification['visualTracking'] {
    const stability = this.determineGazeStability(features);
    return stability === 'stable'
      ? 'smooth'
      : stability === 'moderate'
      ? 'saccadic'
      : 'discontinuous';
  }

  // --- Affect Type (cảm xúc tổng thể) ---
  private determineAffectType(
    features: BehavioralFeature[]
  ): BehavioralClassification['affectType'] {
    const positiveCount = features.filter((f) => f.affect === 'happy' || f.affect === 'surprised')
      .length;
    const negativeCount = features.filter(
      (f) => f.affect === 'sad' || f.affect === 'angry' || f.affect === 'fearful' || f.affect === 'disgusted'
    ).length;
    const neutralCount = features.filter((f) => f.affect === 'neutral').length;

    if (positiveCount > negativeCount + neutralCount) return 'positive';
    if (negativeCount > positiveCount + neutralCount) return 'negative';
    if (neutralCount > positiveCount + negativeCount) return 'neutral';
    return 'mixed';
  }

  // --- Engagement Level ---
  private determineEngagementLevel(
    features: BehavioralFeature[]
  ): BehavioralClassification['engagementLevel'] {
    const avgAttention =
      features.reduce((a, b) => a + b.attentionLevel, 0) / features.length;
    if (avgAttention > 0.7) return 'high';
    if (avgAttention > 0.4) return 'medium';
    return 'low';
  }

  // --- Frustration Tolerance (ước lượng từ frown intensity & attention drop) ---
  private determineFrustrationTolerance(
    features: BehavioralFeature[]
  ): BehavioralClassification['frustrationTolerance'] {
    const avgFrown = features.reduce((a, b) => a + b.frownIntensity, 0) / features.length;
    const attentionDrop = this.calculateAttentionDrop(features);
    if (avgFrown < 0.2 && attentionDrop < 0.1) return 'high';
    if (avgFrown < 0.5 && attentionDrop < 0.3) return 'medium';
    return 'low';
  }

  // --- Attention Span ---
  private determineAttentionSpan(
    features: BehavioralFeature[]
  ): BehavioralClassification['attentionSpan'] {
    const avgAttention =
      features.reduce((a, b) => a + b.attentionLevel, 0) / features.length;
    if (avgAttention > 0.75) return 'sustained';
    if (avgAttention > 0.4) return 'intermittent';
    return 'brief';
  }

  // --- Response Consistency (dùng gaze variance) ---
  private determineResponseConsistency(
    features: BehavioralFeature[]
  ): BehavioralClassification['responseConsistency'] {
    const variance = this.calculateGazeVariance(features);
    if (variance < 0.2) return 'consistent';
    if (variance < 0.5) return 'variable';
    return 'random';
  }

  // --- Task Persistence (dùng attention level) ---
  private determineTaskPersistence(
    features: BehavioralFeature[]
  ): BehavioralClassification['taskPersistence'] {
    const avgAttention =
      features.reduce((a, b) => a + b.attentionLevel, 0) / features.length;
    if (avgAttention > 0.7) return 'persistent';
    if (avgAttention > 0.4) return 'moderate';
    return 'fleeting';
  }

  // -----------------------------------------------------------------
  //  HÀM TIỆN ÍCH
  // -----------------------------------------------------------------

  /**
   * Tính phương sai của gaze (dựa trên gazeX, gazeY).
   * Có thể mở rộng để dùng gaze vector 3D nếu cần.
   */
  private calculateGazeVariance(features: BehavioralFeature[]): number {
    if (features.length < 2) return 0.5;
    const xVals = features.map((f) => f.gazeX);
    const yVals = features.map((f) => f.gazeY);
    return (this.variance(xVals) + this.variance(yVals)) / 2;
  }

  private variance(nums: number[]): number {
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    return nums.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / nums.length;
  }

  /**
   * Tính độ giảm attention trong cửa sổ (dùng cho frustration tolerance).
   */
  private calculateAttentionDrop(features: BehavioralFeature[]): number {
    if (features.length < 2) return 0;
    const firstHalf = features.slice(0, Math.floor(features.length / 2));
    const secondHalf = features.slice(Math.floor(features.length / 2));
    const avgFirst =
      firstHalf.reduce((a, b) => a + b.attentionLevel, 0) / firstHalf.length;
    const avgSecond =
      secondHalf.reduce((a, b) => a + b.attentionLevel, 0) / secondHalf.length;
    return Math.max(0, avgFirst - avgSecond);
  }

  /**
   * Độ tin cậy của phân tích (tỉ lệ thuận với số lượng mẫu).
   */
  private calculateConfidence(features: BehavioralFeature[]): number {
    return Math.min(0.9, 0.5 + features.length / 100);
  }
}

export default new LocalModelService();