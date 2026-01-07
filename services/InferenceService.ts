import { BehavioralFeature } from "../types";

export class InferenceService {
  private static readonly WINDOW_SIZE = 30; // 30 samples ~ 2 seconds at 15fps
  
  /**
   * Enhanced inference with real features
   */
  static processStreamingData(features: BehavioralFeature[]): number {
    if (features.length < this.WINDOW_SIZE) {
      return this.calculatePartialScore(features);
    }

    // Use last WINDOW_SIZE features for analysis
    const window = features.slice(-this.WINDOW_SIZE);
    
    // Calculate various metrics
    const metrics = {
      // Gaze stability (lower = more stable)
      gazeStability: this.calculateGazeStability(window),
      
      // Gaze saccades (rapid eye movements)
      gazeSaccades: this.detectGazeSaccades(window),
      
      // Affect variability
      affectVariability: this.calculateAffectVariability(window),
      
      // Attention to target (simplified - would need game target positions)
      attentionScore: this.estimateAttentionScore(window),
      
      // Motor coordination (response to target appearance)
      motorCoordination: this.assessMotorCoordination(window),
    };

    // Weighted risk score calculation
    const weights = {
      gazeStability: 0.35,
      gazeSaccades: 0.25,
      affectVariability: 0.20,
      attentionScore: 0.15,
      motorCoordination: 0.05,
    };

    let riskScore = 0;
    riskScore += metrics.gazeStability * weights.gazeStability;
    riskScore += metrics.gazeSaccades * weights.gazeSaccades;
    riskScore += metrics.affectVariability * weights.affectVariability;
    riskScore += metrics.attentionScore * weights.attentionScore;
    riskScore += metrics.motorCoordination * weights.motorCoordination;

    // Convert to 0-100 scale
    return Math.min(100, Math.max(0, riskScore * 100));
  }

  private static calculateGazeStability(features: BehavioralFeature[]): number {
    const gazePoints = features.map(f => ({ x: f.gazeX, y: f.gazeY }));
    
    // Calculate variance
    const meanX = gazePoints.reduce((sum, p) => sum + p.x, 0) / gazePoints.length;
    const meanY = gazePoints.reduce((sum, p) => sum + p.y, 0) / gazePoints.length;
    
    const varianceX = gazePoints.reduce((sum, p) => sum + Math.pow(p.x - meanX, 2), 0) / gazePoints.length;
    const varianceY = gazePoints.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0) / gazePoints.length;
    
    // Total variance (normalized)
    return Math.min(1, Math.sqrt(varianceX + varianceY));
  }

  private static detectGazeSaccades(features: BehavioralFeature[]): number {
    let saccadeCount = 0;
    const SACCADIC_THRESHOLD = 0.1; // Threshold for saccade detection
    
    for (let i = 1; i < features.length; i++) {
      const distance = Math.sqrt(
        Math.pow(features[i].gazeX - features[i-1].gazeX, 2) +
        Math.pow(features[i].gazeY - features[i-1].gazeY, 2)
      );
      
      if (distance > SACCADIC_THRESHOLD) {
        saccadeCount++;
      }
    }
    
    // Normalize by number of samples
    return Math.min(1, saccadeCount / features.length);
  }

  private static calculateAffectVariability(features: BehavioralFeature[]): number {
    const smileValues = features.map(f => f.smileIntensity);
    const frownValues = features.map(f => f.frownIntensity);
    
    const smileVar = this.calculateVariance(smileValues);
    const frownVar = this.calculateVariance(frownValues);
    
    return (smileVar + frownVar) / 2;
  }

  private static estimateAttentionScore(features: BehavioralFeature[]): number {
    // Simplified: assume attention = low gaze movement + moderate smile
    const gazeStability = 1 - this.calculateGazeStability(features);
    const avgSmile = features.reduce((sum, f) => sum + f.smileIntensity, 0) / features.length;
    
    // Ideal attention: stable gaze + positive affect (not too high, not too low)
    const smileScore = 1 - Math.abs(avgSmile - 0.5); // Closer to 0.5 is better
    
    return (gazeStability * 0.7 + smileScore * 0.3);
  }

  private static assessMotorCoordination(features: BehavioralFeature[]): number {
    // Placeholder - would need game interaction timing data
    // For now, return neutral score
    return 0.5;
  }

  private static calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.min(1, variance);
  }

  private static calculatePartialScore(features: BehavioralFeature[]): number {
    if (features.length === 0) return 0;
    
    // Simple average of available metrics
    const avgGazeStability = this.calculateGazeStability(features);
    const avgAffect = this.calculateAffectVariability(features);
    
    return Math.min(100, ((avgGazeStability + avgAffect) / 2) * 100);
  }
}