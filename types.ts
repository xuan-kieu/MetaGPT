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
  targetX?: number;
  targetY?: number;
  targetSize?: number;
  audioStimulus?: string | null;
  isLookingAtTarget?: boolean;
  gameId?: string;
  sessionTime?: number;
  childName?: string;
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
  features: Record<string, any>;
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
  
  // Props mới từ App.tsx
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