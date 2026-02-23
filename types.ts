// ============================================
// CÁC INTERFACE LIÊN QUAN ĐẾN DATABASE (SQL)
// ============================================

export type UUID = string;

export interface User {
  id: UUID;
  username: string;
  password_hash: string;
  email: string | null;
  phone: string | null;
  full_name: string;
  role: 'parent' | 'teacher' | 'specialist' | 'admin';
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Child {
  id: string;
  full_name: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other' | null;
  region: string | null;
  primary_language: string;
  notes: string | null;
  parent_id: string | null;
  created_by: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ChildGuardian {
  child_id: string;
  user_id: string;
  relationship: string | null;
  is_primary: boolean;
}

export interface AgeGroup {
  id: number;
  name: string;
  min_months: number;
  max_months: number;
}

export interface Skill {
  id: number;
  code: string | null;
  name: string;
  domain: 'social' | 'communication' | 'cognitive' | 'motor';
  description: string | null;
  weight: number;
}

export interface Game {
  id: number;
  code: string;
  name: string;
  description: string | null;
  instructions: string | null;
  min_age_months: number;
  max_age_months: number;
  target_duration_seconds: number | null;
  media_url: string | null;
  is_gateway: boolean;
  created_at: Date | string;
}

export interface GameSkill {
  game_id: number;
  skill_id: number;
  weight: number;
  skill_type: 'primary' | 'secondary' | null;
}

export interface Assessment {
  id: string;
  child_id: string;
  started_by: string | null;
  started_at: Date | string;
  completed_at: Date | string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'abandoned';
  adaptive_flow: any | null;
  device_info: string | null;
  environment_notes: string | null;
  parent_assisted: boolean;
  overall_risk_score: number | null;
  risk_level: 'RẤT CAO' | 'CAO' | 'TRUNG BÌNH' | 'THẤP' | null;
  developmental_age_estimate: number | null;
  report_json: any | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface GameSession {
  id: string;
  assessment_id: string;
  game_id: number;
  sequence_order: number;
  started_at: Date | string | null;
  ended_at: Date | string | null;
  status: 'completed' | 'interrupted' | 'skipped';
  raw_data_json: any | null;
  result_scores: any | null;
  created_at: Date | string;
}

export interface GameSessionMetric {
  id: string;
  game_session_id: string;
  metric_key: string;
  metric_value: number | null;
  unit: string | null;
  captured_at: Date | string;
}

export interface MediaFile {
  id: string;
  game_session_id: string | null;
  file_type: 'video' | 'audio' | null;
  file_path: string;
  uploaded_at: Date | string;
}

export interface Norm {
  id: number;
  skill_id: number;
  age_group_id: number;
  mean: number;
  std_dev: number;
  sample_size: number | null;
  updated_at: Date | string;
}

export interface QuickNote {
  id: string;
  child_id: string;
  created_by: string | null;
  note_type: 'progress' | 'behavior' | 'other' | null;
  content: string;
  created_at: Date | string;
}

export interface DailyReport {
  id: string;
  child_id: string;
  report_date: string;
  summary: string | null;
  mood: string | null;
  sleep_quality: string | null;
  eating_quality: string | null;
  activities: string | null;
  notes: string | null;
  created_by: string | null;
  sent_to_parent: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Message {
  id: string;
  from_user_id: string | null;
  to_user_id: string | null;
  child_id: string | null;
  content: string;
  is_read: boolean;
  created_at: Date | string;
  read_at: Date | string | null;
}

export interface InterventionPlan {
  id: string;
  child_id: string;
  specialist_id: string | null;
  start_date: string;
  end_date: string | null;
  goals_json: any | null;
  activities_json: any | null;
  status: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

// ============================================
// CÁC INTERFACE UI VÀ GATEWAY GAMES (ĐÃ CẬP NHẬT)
// ============================================

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

export type SessionPhase = 'gateway' | 'full';
export type AdaptiveFlow = 'full' | 'reduced';

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
  gameName?: string;  // Thêm trường này
  phase?: SessionPhase;
  adaptiveFlow?: AdaptiveFlow;  // Thêm trường này
  sessionTime?: number;
  childName?: string;
  childId?: string;
  assessmentId?: string;
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

export interface GatewayResult {
  gameId: string;
  gameCode: string;
  gameName: string;
  success: boolean;
  duration: number;
  completedAt: number;
  metrics?: {
    attentionLevel: number;
    engagementScore: number;
    smileIntensity: number;
    gazeStability: number;
    [key: string]: any;
  };
}

export interface GatewayDecision {
  successCount: number;
  totalGames: number;
  decision: AdaptiveFlow;
  reason: string;
}

export interface SessionSummary {
  attentionScore?: number;
  socialEngagement?: number;
  cognitiveScore?: number;
  motorScore?: number;
  languageScore?: number;
  gazeStability?: number;
  smileFrequency?: number;
  vocalizationRate?: number;
  gatewaySuccessRate?: number;
  averageAttention?: number;
  averageSmile?: number;
  totalDuration?: number;
  adaptiveFlow?: AdaptiveFlow;  // Thêm trường này
  totalGamesPlayed?: number;    // Thêm trường này
  gatewayResults?: GatewayResult[];  // Thêm trường này
  [key: string]: any;
}

export interface SessionResult {
  status: 'completed' | 'incomplete' | 'aborted';
  reason?: 'low_engagement' | 'user_cancelled' | 'error' | 'timeout';
  phase: SessionPhase;
  adaptiveFlow?: AdaptiveFlow;  // Thêm trường này
  gatewayResults?: GatewayResult[];
  gatewayDecision?: GatewayDecision;  // Thêm trường này
  totalGames: number;
  completedGames: number;
  features: BehavioralFeature[];
  summary?: SessionSummary;
  
  // Liên kết với database
  assessmentId?: string;
  childId?: string;
  startedBy?: string;
  
  // Metadata
  startedAt: number;
  endedAt: number;
  deviceInfo?: string;
  environmentNotes?: string;
  parentAssisted?: boolean;
}

export interface GameEngineProps {
  age: number;
  themeId: string;
  specificAsset: string | null;
  childName: string;
  childId?: string;
  assessmentId?: string;
  userId?: string;
  onFeatureCapture: (feature: BehavioralFeature) => void;
  onSessionEnd: (result: SessionResult) => void;
  gameId?: string;
  gameTitle?: string;
  gameDuration?: number;
}

export interface GameModule {
  id: string;
  name: string;
  duration: number;
  isGateway: boolean;
  isOptional: boolean;
  component: React.ComponentType<any>;
}

export interface AgeGroupConfig {
  totalDuration: number;
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
  CLINICIAN = 'specialist',
  ADMIN = 'admin'
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
    gaze_stability_note?: string;
  };
  recommendations: {
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    actions: string[];
    resources: Array<{ type: string; name: string; contact?: string }>;
  };
  disclaimer: string;
}


