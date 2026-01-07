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
  poseConfidence: number;
  faceConfidence: number;
  smileIntensity: number;
  vocalPitch?: number;
  vocalVolume?: number;
  affect: 'positive' | 'neutral' | 'negative';
  attentionLevel: number;
}

export interface InferenceResult {
  score: number;
  confidence: number;
  patternId: string;
  explanation: string;
  behavioralTags: string[];
  features: Record<string, any>;
}

// Thêm vào interface LongitudinalRecord
export interface LongitudinalRecord {
  id: string;
  date: string;
  riskScore: number;
  observations: string[];
  features: BehavioralFeature[];
  metrics?: Record<string, number>; // Thêm metrics
  classification?: BehavioralClassification; // Thêm classification data
}

// Thêm BehavioralClassification (nếu chưa có)
export interface BehavioralClassification {
  gazePattern: 'focused' | 'scanning' | 'distracted' | 'avoidant';
  gazeStability: 'stable' | 'moderate' | 'unstable';
  visualTracking: 'smooth' | 'saccadic' | 'discontinuous';
  affectType: 'positive' | 'neutral' | 'negative' | 'mixed';
  engagementLevel: 'high' | 'medium' | 'low';
  frustrationTolerance: 'high' | 'medium' | 'low';
  attentionSpan: 'sustained' | 'intermittent' | 'brief';
  responseConsistency: 'consistent' | 'variable' | 'random';
  taskPersistence: 'persistent' | 'moderate' | 'fleeting';
}

// Thêm vào InferenceResult
export interface InferenceResult {
  score: number;
  confidence: number;
  patternId: string;
  explanation: string;
  behavioralTags: string[];
  behavioralClassification?: BehavioralClassification; // THÊM
  features: Record<string, any>;
}

export interface SessionData {
  sessionId: string;
  subjectId: string;
  startTime: number;
  endTime?: number;
  features: BehavioralFeature[];
}
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
export interface PoseData {
  jointAngles: Record<string, number>;
  symmetry: number;
  stability: Record<string, number>;
  rangeOfMotion: Record<string, number>;
}

export interface ClinicalAnalysis {
  analysisId: string;
  [key: string]: any; // Cấu trúc linh hoạt cho các loại phân tích khác nhau
  timestamp: string;
  confidence?: number;
}