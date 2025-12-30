
export enum AppMode {
  PATIENT = 'PATIENT',
  CLINICIAN = 'CLINICIAN',
  ADMIN = 'ADMIN'
}

export interface BehavioralFeature {
  timestamp: number;
  gazeX: number;
  gazeY: number;
  frownIntensity: number;
  smileIntensity: number;
  vocalPitch?: number;
  vocalVolume?: number;
  affect: 'positive' | 'neutral' | 'negative';
  attentionLevel: number;
}

export interface InferenceResult {
 score: number;
  confidence: number;
  patternId?: string;
  explanation?: string;
  behavioralTags?: string[];
  features: Record<string, any>;
}

export interface LongitudinalRecord {
  id: string;
  date: string;
  riskScore: number;
  observations: string[];
  features: BehavioralFeature[];
}

export interface SessionData {
  sessionId: string;
  subjectId: string;
  startTime: number;
  endTime?: number;
  features: BehavioralFeature[];
}
// Thêm vào file types.ts hiện có
export interface Keypoint {
  x: number;
  y: number;
  score: number;
  name?: string;
}

export interface PoseResult {
  keypoints: Keypoint[];
  score: number;
  normalized?: boolean;
}

export interface ExercisePose {
  name: string;
  expectedKeypoints: string[];
  thresholds: {
    minAngle: number;
    maxAngle: number;
    minConfidence: number;
  };
}

export interface Pose {
  keypoints: Keypoint[];
  score?: number;
  box?: any;
}