import * as tf from '@tensorflow/tfjs';
import { BehavioralFeature, BehavioralClassification } from '../types';

export class LocalModelService {
  private model: tf.LayersModel | null = null;
  private isModelLoaded = false;
  
  constructor() {
    // Sử dụng webgl backend nếu có thể
    if (typeof window !== 'undefined') {
      tf.setBackend('webgl').catch(() => {
        console.log('WebGL not available, using CPU backend');
        tf.setBackend('cpu');
      });
    }
  }
  
  async loadModel(): Promise<boolean> {
    try {
      console.log('Loading local behavior classification model...');
      
      // Tạo model đơn giản tại chỗ
      this.model = this.createSimpleModel();
      this.isModelLoaded = true;
      
      console.log('Local model created successfully');
      return true;
    } catch (error) {
      console.error('Failed to create model, using rule-based:', error);
      this.isModelLoaded = false;
      return false;
    }
  }
  
  private createSimpleModel(): tf.LayersModel {
    const model = tf.sequential();
    
    // Input layer: 8 features
    model.add(tf.layers.dense({
      units: 8,
      activation: 'relu',
      inputShape: [8]
    }));
    
    // Hidden layer
    model.add(tf.layers.dense({
      units: 4,
      activation: 'relu'
    }));
    
    // Output layer: 6 behavioral classes
    model.add(tf.layers.dense({
      units: 6,
      activation: 'softmax'
    }));
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  }
  
  async analyzeBehavior(
    features: BehavioralFeature[]
  ): Promise<{
    classification: BehavioralClassification;
    confidence: number;
    predictions: Record<string, number>;
  }> {
    // Rule-based analysis fallback
    return this.ruleBasedAnalysis(features);
  }
  
  private ruleBasedAnalysis(features: BehavioralFeature[]): {
    classification: BehavioralClassification;
    confidence: number;
    predictions: Record<string, number>;
  } {
    const classification: BehavioralClassification = {
      gazePattern: this.determineGazePattern(features),
      gazeStability: this.determineGazeStability(features),
      visualTracking: this.determineVisualTracking(features),
      affectType: this.determineAffectType(features),
      engagementLevel: this.determineEngagementLevel(features),
      frustrationTolerance: 'medium',
      attentionSpan: this.determineAttentionSpan(features),
      responseConsistency: 'variable',
      taskPersistence: 'moderate'
    };
    
    const confidence = this.calculateConfidence(features);
    
    return {
      classification,
      confidence,
      predictions: {
        rule_based: 1.0
      }
    };
  }
  
  private determineGazePattern(features: BehavioralFeature[]): BehavioralClassification['gazePattern'] {
    const variance = this.calculateGazeVariance(features);
    if (variance < 0.1) return 'focused';
    if (variance < 0.3) return 'scanning';
    if (variance < 0.5) return 'distracted';
    return 'avoidant';
  }
  
  private determineGazeStability(features: BehavioralFeature[]): BehavioralClassification['gazeStability'] {
    const stability = 1 - this.calculateGazeVariance(features);
    if (stability > 0.8) return 'stable';
    if (stability > 0.6) return 'moderate';
    return 'unstable';
  }
  
  private determineVisualTracking(features: BehavioralFeature[]): BehavioralClassification['visualTracking'] {
    const stability = this.determineGazeStability(features);
    return stability === 'stable' ? 'smooth' : 
           stability === 'moderate' ? 'saccadic' : 'discontinuous';
  }
  
  private determineAffectType(features: BehavioralFeature[]): BehavioralClassification['affectType'] {
    const positiveRatio = features.filter(f => f.affect === 'positive').length / features.length;
    const avgSmile = features.reduce((a, f) => a + f.smileIntensity, 0) / features.length;
    
    if (positiveRatio > 0.7 && avgSmile > 0.6) return 'positive';
    if (positiveRatio < 0.3 && avgSmile < 0.2) return 'negative';
    if (positiveRatio > 0.4) return 'mixed';
    return 'neutral';
  }
  
  private determineEngagementLevel(features: BehavioralFeature[]): BehavioralClassification['engagementLevel'] {
    const avgAttention = features.reduce((a, f) => a + f.attentionLevel, 0) / features.length;
    const affectConsistency = this.calculateAffectConsistency(features);
    
    const engagementScore = (avgAttention * 0.6 + affectConsistency * 0.4);
    
    if (engagementScore > 0.7) return 'high';
    if (engagementScore > 0.4) return 'medium';
    return 'low';
  }
  
  private determineAttentionSpan(features: BehavioralFeature[]): BehavioralClassification['attentionSpan'] {
    const attentionVariance = this.calculateVariance(features.map(f => f.attentionLevel));
    
    if (attentionVariance < 0.2) return 'sustained';
    if (attentionVariance < 0.4) return 'intermittent';
    return 'brief';
  }
  
  private calculateGazeVariance(features: BehavioralFeature[]): number {
    if (features.length < 2) return 0.5;
    
    const gazeXValues = features.map(f => f.gazeX);
    const gazeYValues = features.map(f => f.gazeY);
    
    const varianceX = this.calculateVariance(gazeXValues);
    const varianceY = this.calculateVariance(gazeYValues);
    
    return (varianceX + varianceY) / 2;
  }
  
  private calculateAffectConsistency(features: BehavioralFeature[]): number {
    const positiveCount = features.filter(f => f.affect === 'positive').length;
    return positiveCount / features.length;
  }
  
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sqDiff, val) => sqDiff + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
  
  private calculateConfidence(features: BehavioralFeature[]): number {
    let confidence = 0.5;
    
    if (features.length > 30) confidence += 0.2;
    else if (features.length > 15) confidence += 0.1;
    
    const gazeStability = this.determineGazeStability(features);
    if (gazeStability === 'stable') confidence += 0.1;
    
    const engagement = this.determineEngagementLevel(features);
    if (engagement === 'high' || engagement === 'low') confidence += 0.05;
    
    return Math.min(0.9, confidence);
  }
  
  async dispose(): Promise<void> {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.isModelLoaded = false;
  }
}

// Export singleton
const instance = new LocalModelService();
export default instance;