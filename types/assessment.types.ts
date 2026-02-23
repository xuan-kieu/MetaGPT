import { SessionPhase, AdaptiveFlow } from '../types';
import { FullAssessmentResult } from '../services/scoringService';
// ============================================
// KIỂU CHO SESSION RESULT
// ============================================
export interface GatewayMetric {
  attentionLevel?: number;
  engagementScore?: number;
  smileIntensity?: number;
  gazeStability?: number;
  [key: string]: any;
}

export interface GatewayResult {
  gameId: string;
  gameCode: string;
  gameName: string;
  success: boolean;
  duration: number;
  completedAt: number;
  metrics?: GatewayMetric;
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
  adaptiveFlow?: AdaptiveFlow;
  totalGamesPlayed?: number;
  gatewayResults?: GatewayResult[];
  [key: string]: any;
}

export interface SessionResultInput {
  status: 'completed' | 'incomplete' | 'aborted';
  reason?: 'low_engagement' | 'user_cancelled' | 'error' | 'timeout';
  phase: SessionPhase;
  adaptiveFlow?: AdaptiveFlow;
  gatewayResults?: GatewayResult[];
  gatewayDecision?: any;
  totalGames: number;
  completedGames: number;
  features: any[];
  summary?: SessionSummary;
  assessmentId?: string;
  childId?: string;
  startedBy?: string;
  startedAt: number;
  endedAt: number;
  deviceInfo?: string;
  environmentNotes?: string;
  parentAssisted?: boolean;
  avgAttention?: number;
  avgSmile?: number;
  gazeStability?: number;
  engagementLevelValue?: number;
}

// ============================================
// KIỂU CHO SCORING RESULT
// ============================================
export interface ScoringResult {
  totalRiskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  developmentalAgeMonths: number;
  childAgeMonths: number;
  domainScores: Record<string, number>;
  skillScores: Record<string, number>;
  percentiles: Record<string, number>;
  zScores: Record<string, number>;
  [key: string]: any;
}

// ============================================
// KIỂU CHO BEHAVIORAL ANALYSIS
// ============================================
export interface BehavioralFeatures {
  avgAttention?: number;
  avgSmile?: number;
  gazeStability?: number;
  [key: string]: any;
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

export interface BehavioralAnalysis {
  explanation: string;
  behavioralTags: string[];
  behavioralClassification?: BehavioralClassification;
  score: number;
  features: BehavioralFeatures;
  [key: string]: any;
}

// ============================================
// KIỂU CHO REPORT JSON
// ============================================
export interface AssessmentReportJson {
  analysis: BehavioralAnalysis;
  scoring: FullAssessmentResult;
  featuresCount: number;
  gatewayResults?: GatewayResult[];
  summary?: SessionSummary;
  phase: string;
}