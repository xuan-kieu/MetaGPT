
import { BehavioralFeature, InferenceResult } from "../types";

export class InferenceService {
  /**
   * Simulates a Longitudinal Temporal Convolutional Network inference
   */
  static processStreamingData(window: BehavioralFeature[]): number {
    if (window.length < 10) return 0;
    
    // Logic simulating a temporal analysis of gaze and affect
    const gazeVariability = window.reduce((acc, curr, idx, arr) => {
      if (idx === 0) return 0;
      return acc + Math.abs(curr.gazeX - arr[idx-1].gazeX);
    }, 0);

    return Math.min(100, (gazeVariability / window.length) * 50);
  }
}
