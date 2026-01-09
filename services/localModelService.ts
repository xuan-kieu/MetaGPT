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
  
  private createSimpleModel(): tf.LayersModel {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 8, activation: 'relu', inputShape: [8] }));
    model.add(tf.layers.dense({ units: 6, activation: 'softmax' }));
    model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy' });
    return model;
  }
  
  async analyzeBehavior(
    features: BehavioralFeature[]
  ): Promise<{
    classification: BehavioralClassification;
    confidence: number;
    predictions: Record<string, number>;
  }> {
    return this.ruleBasedAnalysis(features);
  }
  
  
  private ruleBasedAnalysis(features: BehavioralFeature[]) {
    const classification: BehavioralClassification = {
      gazePattern: this.determineGazePattern(features),
      gazeStability: this.determineGazeStability(features),
      visualTracking: this.determineVisualTracking(features),
      affectType: this.determineAffectType(features),
      engagementLevel: this.determineEngagementLevel(features),
      frustrationTolerance: 'medium',
      attentionSpan: this.determineAttentionSpan(features),
      responseConsistency: this.determineResponseConsistency(features), // Updated
      taskPersistence: this.determineTaskPersistence(features)          // Updated
    };
    
    const confidence = this.calculateConfidence(features);
    
    return {
      classification,
      confidence,
      predictions: { rule_based: 1.0 }
    };
  }
  
  private determineGazePattern(features: BehavioralFeature[]): BehavioralClassification['gazePattern'] {
    const variance = this.calculateGazeVariance(features);
    if (variance < 0.1) return 'focused';
    if (variance < 0.25) return 'scanning';
    if (variance < 0.45) return 'distracted';
    return 'avoidant';
  }
  
  private determineGazeStability(features: BehavioralFeature[]): BehavioralClassification['gazeStability'] {
    const variance = this.calculateGazeVariance(features);
    if (variance < 0.15) return 'stable';
    if (variance < 0.35) return 'moderate';
    return 'unstable';
  }
  
  private determineVisualTracking(features: BehavioralFeature[]): BehavioralClassification['visualTracking'] {
    const stability = this.determineGazeStability(features);
    return stability === 'stable' ? 'smooth' : stability === 'moderate' ? 'saccadic' : 'discontinuous';
  }
  
  private determineAffectType(features: BehavioralFeature[]): BehavioralClassification['affectType'] {
    const positiveCount = features.filter(f => f.affect === 'positive').length;
    const ratio = positiveCount / features.length;
    
    if (ratio > 0.6) return 'positive';
    if (ratio < 0.2) return 'negative';
    return ratio > 0.3 ? 'mixed' : 'neutral';
  }
  
  private determineEngagementLevel(features: BehavioralFeature[]): BehavioralClassification['engagementLevel'] {
    const avgAttention = features.reduce((a, b) => a + b.attentionLevel, 0) / features.length;
    if (avgAttention > 0.7) return 'high';
    if (avgAttention > 0.4) return 'medium';
    return 'low';
  }
  
  private determineAttentionSpan(features: BehavioralFeature[]): BehavioralClassification['attentionSpan'] {
    const avgAttention = features.reduce((a, b) => a + b.attentionLevel, 0) / features.length;
    if (avgAttention > 0.75) return 'sustained';
    if (avgAttention > 0.4) return 'intermittent';
    return 'brief';
  }

  private determineResponseConsistency(features: BehavioralFeature[]): BehavioralClassification['responseConsistency'] {
    const variance = this.calculateGazeVariance(features);
    if (variance < 0.2) return 'consistent';
    if (variance < 0.5) return 'variable';
    return 'random';
  }

  private determineTaskPersistence(features: BehavioralFeature[]): BehavioralClassification['taskPersistence'] {
     const avgAttention = features.reduce((a, b) => a + b.attentionLevel, 0) / features.length;
     if (avgAttention > 0.7) return 'persistent';
     if (avgAttention > 0.4) return 'moderate';
     return 'fleeting';
  }
  
  private calculateGazeVariance(features: BehavioralFeature[]): number {
    if (features.length < 2) return 0.5;
    const xVals = features.map(f => f.gazeX);
    const yVals = features.map(f => f.gazeY);
    return (this.variance(xVals) + this.variance(yVals)) / 2;
  }
  
  private variance(nums: number[]): number {
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    return nums.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / nums.length;
  }
  
  private calculateConfidence(features: BehavioralFeature[]): number {
    return Math.min(0.9, 0.5 + (features.length / 100));
  }
}

export default new LocalModelService();