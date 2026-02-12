export enum AppMode {
  PATIENT = 'PATIENT',
  CLINICIAN = 'CLINICIAN',
  ADMIN = 'ADMIN'
}
export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export type Emotion =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'surprised'
  | 'fearful'
  | 'disgusted';
  export interface AudioFeatures {
    volume: number;
    vad: boolean;
    pitch?: number;
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
  affect: Emotion; 
  attentionLevel: number;
  targetX?: number;
  targetY?: number;
  targetSize?: number;
  audioStimulus?: string | null;
  isLookingAtTarget?: boolean;
  gameId?: string;
  sessionTime?: number;
  childName?: string;
  faceLandmarks?: Landmark[];
  poseLandmarks?: Landmark[];
  handLandmarks?: Landmark[][];
  handConfidence?: number;
  gaze?: { x: number; y: number; z: number };
  headStability?: number;
  audioFeatures?: AudioFeatures; 
}

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

export interface InferenceResult {
  score: number;
  confidence: number;
  patternId: string;
  explanation: string;
  behavioralTags: string[];
  behavioralClassification?: BehavioralClassification;
  features: {
    gazeStability: number;
    windowSize: number;
    hasFaceData: boolean;
    timestamp: number;
    dominantEmotion?: Emotion;
    avgAttention?: number;
    [key: string]: any;
  };
}

export interface LongitudinalRecord {
  id: string;
  date: string;
  riskScore: number;
  observations: string[];
  features: BehavioralFeature[];
  metrics?: {
    attention: number;
    smile: number;
    gazeStability: number;
    engagement: number | string;
  }; 
  classification?: BehavioralClassification;
}

export interface SessionData {
  sessionId: string;
  subjectId: string;
  startTime: number;
  endTime?: number;
  features: BehavioralFeature[];
}

export interface GameTheme {
  id: string;
  name: string;
  assets: string[];
  background: string;
}

export interface GameConfig {
  ageRange: string;
  jumpInterval: number;
  duration: number;
  targetSizeRange: [number, number];
  audioPrompts: string[];
  theme: GameTheme;
}

export interface GameEngineProps {
  age: number;
  themeId: string;
  specificAsset: string | null;
  childName: string;
  onFeatureCapture: (feature: BehavioralFeature) => void;
  onSessionEnd: (features: BehavioralFeature[]) => void;
  gameId?: string;
  gameTitle?: string;
  gameDuration?: number;
}

export interface GameModule {
  id: string;
  name: string;
  duration: string;
  isOptional?: boolean;
}

export interface AgeGroupConfig {
  id: string;
  label: string;
  description: string;
  targetTime: string;
  numericAge: number;
  games: GameModule[];
}

export interface SubGameProps {
  config: GameConfig;
  latestAIResult: React.MutableRefObject<InferenceResult | null>;
  onFeatureCapture: (feature: BehavioralFeature) => void;
  onGameComplete?: (success: boolean) => void;
  timeElapsed: number;
  childName: string;
  gameDuration?: number;
}


export interface SquirrelCharacterProps {
  isClapping: boolean;
  scale?: number;
}

export interface PlaceholderGameProps extends SubGameProps {
  title: string;
  color: string;
}

export enum UserRole {
  PARENT = 'parent',
  CLINICIAN = 'clinician'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  childProfiles?: ChildProfile[];
  clinicId?: string;
}

export interface ChildProfile {
  id: string;
  name: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  region: string;
  primaryLanguage: string;
  age?: {
    years: number;
    months: number;
  };
}

export interface ReportDomainAnalysis {
  domain: string;
  score: number;
  percentile: number;
  age_equivalent: string;
  indicators: {
    skill: string;
    status: 'RED' | 'ORANGE' | 'GREEN';
    details: string;
  }[];
}

// Cấu trúc báo cáo hoàn chỉnh (JSON Output)
export interface ClinicalReport {
  report_id: string;
  child_info: {
    name: string;
    age_months: number;
    assessment_date: string;
    gender?: string;
  };
  executive_summary: {
    overall_risk: string;
    key_strengths: string[];
    key_concerns: string[];
    developmental_discrepancy: string;
  };
  domain_analysis: ReportDomainAnalysis[];
  behavioral_patterns: {
    attention_pattern: string;
    social_engagement: string;
    sensory_profile: string;
    gaze_stability_note?: string; // Thêm dựa trên features của bạn
  };
  recommendations: {
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    actions: string[];
    resources: Array<{ type: string; name: string; contact?: string }>;
  };
  disclaimer: string;
}