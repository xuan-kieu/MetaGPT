import React, { createContext, useState, useContext, useCallback } from 'react';
import {
  BehavioralFeature,
  LongitudinalRecord,
  InferenceResult,
  SessionResult,
  ChildProfile,
  UserRole,
} from '../types';
import {
  GameSession as DBGameSession,
  GameSessionMetric as DBGameSessionMetric
} from '../types';
import { analyzeBehavioralPatterns } from '../services/behaviorAnalysisService';
import { DataMapper } from '../services/dataMapper';
import { ScoringService, DEFAULT_NORMS, FullAssessmentResult } from '../services/scoringService';
import { ReportService } from '../services/reportService';
import { PROGRAM_INFO } from '../config/programInfo';
import * as assessmentService from '../services/assessmentService';
import * as gameSessionService from '../services/gameSessionService';
import { useAuth } from './AuthContext';

// ============================================
// ĐỊNH NGHĨA KIỂU
// ============================================

export interface AssessmentContextType {
  records: LongitudinalRecord[];
  currentAnalysis: InferenceResult | undefined;
  assessmentResult: FullAssessmentResult | null;
  isAnalyzing: boolean;
  sessionMessage: string | null;
  handleSessionEnd: (result: SessionResult, currentChild: ChildProfile | null, selectedGroupId: string | null, currentAssessmentId: string | null) => Promise<void>;
  handleFeatureStream: (feature: BehavioralFeature) => void;
  clearSessionMessage: () => void;
}

// ============================================
// TẠO CONTEXT
// ============================================

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

// ============================================
// ASSESSMENT PROVIDER COMPONENT
// ============================================

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<LongitudinalRecord[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<InferenceResult | undefined>();
  const [assessmentResult, setAssessmentResult] = useState<FullAssessmentResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  const { currentUser } = useAuth();

  // ============================================
  // TẠO HOẶC CẬP NHẬT ASSESSMENT
  // ============================================
  const createOrUpdateAssessment = useCallback((
    result: SessionResult,
    currentChild: ChildProfile | null,
    currentAssessmentId: string | null,
    scoringResult: FullAssessmentResult,
    behavioralAnalysis: any,
    gatewayResults: any[],
    phase: string
  ) => {
    if (!currentChild || !currentUser) return null;

    let assessmentIdToUse = assessmentService.createOrUpdateAssessment(
      result,
      currentChild,
      currentUser,
      currentAssessmentId,
      scoringResult,
      behavioralAnalysis,
      gatewayResults,
      phase
    );

    return assessmentIdToUse;
  }, [currentUser]);

  // ============================================
  // LƯU GAME SESSION
  // ============================================
  const saveGameSession = useCallback((
    assessmentId: string,
    result: SessionResult,
    features: BehavioralFeature[],
    scoringResult: FullAssessmentResult,
    gatewayResults: any[],
    summary: any,
    behavioralAnalysis: any
  ) => {
    return gameSessionService.createGameSession(
      assessmentId,
      result,
      features,
      scoringResult,
      gatewayResults,
      summary
    );
  }, []);

  // ============================================
  // TẠO LONGITUDINAL RECORD
  // ============================================
  const buildLongitudinalRecord = useCallback((
    selectedGroupId: string | null,
    phase: string,
    gatewayResults: any[],
    features: BehavioralFeature[],
    behavioralAnalysis: any,
    scoringResult: FullAssessmentResult,
    engagementLevelValue: number
  ): LongitudinalRecord => {
    return {
      id: `sess-${Date.now()}`,
      date: new Date().toISOString(),
      riskScore: scoringResult.totalRiskScore,
      observations: [
        `Chương trình: ${selectedGroupId ? PROGRAM_INFO[selectedGroupId].label : 'Không xác định'}`,
        `Phase: ${phase}`,
        gatewayResults ? `Gateway games: ${gatewayResults.length}` : '',
        ...behavioralAnalysis.behavioralTags
      ].filter(Boolean),
      features: features,
      metrics: {
        attention: Number(behavioralAnalysis.features.avgAttention) || 0,
        smile: Number(behavioralAnalysis.features.avgSmile) || 0,
        gazeStability: Number(behavioralAnalysis.features.gazeStability) || 0,
        engagement: engagementLevelValue
      },
      classification: behavioralAnalysis.behavioralClassification
    };
  }, []);

  // ============================================
  // XỬ LÝ KẾT THÚC KHÔNG HOÀN THÀNH
  // ============================================
  const handleIncompleteSession = useCallback((reason?: string) => {
    let message = '';
    switch (reason) {
      case 'low_engagement':
        message = '😔 Bé chưa hợp tác, hẹn chơi lần sau nhé!';
        break;
      case 'user_cancelled':
        message = '⏸️ Bạn đã tạm dừng đánh giá.';
        break;
      case 'timeout':
        message = '⏰ Đã hết thời gian đánh giá.';
        break;
      default:
        message = '⚠️ Phiên đánh giá kết thúc sớm.';
    }
    setSessionMessage(message);
  }, []);

  // ============================================
  // KẾT THÚC PHIÊN ĐÁNH GIÁ
  // ============================================
  const handleSessionEnd = useCallback(async (
    result: SessionResult, 
    currentChild: ChildProfile | null, 
    selectedGroupId: string | null,
    currentAssessmentId: string | null
  ) => {
    setIsAnalyzing(true);
    setSessionMessage(null);

    try {
      const { status, reason, phase, gatewayResults, features, summary, assessmentId } = result;

      // Xử lý trường hợp không hoàn thành
      if (status !== 'completed') {
        handleIncompleteSession(reason);
        setIsAnalyzing(false);
        return;
      }

      // Phân tích hành vi
      const behavioralAnalysis = await analyzeBehavioralPatterns(features);
      const childAgeMonths = currentChild?.age
        ? currentChild.age.years * 12 + currentChild.age.months
        : (selectedGroupId ? PROGRAM_INFO[selectedGroupId].numericAge : 30);

      // Tính điểm
      const inputs = DataMapper.mapSessionToInputs(features);
      const scoringResult = ScoringService.calculateAssessment(inputs, DEFAULT_NORMS, childAgeMonths);

      const engagementLevelValue =
        behavioralAnalysis.behavioralClassification?.engagementLevel === 'high' ? 0.9 :
        behavioralAnalysis.behavioralClassification?.engagementLevel === 'medium' ? 0.6 : 0.3;

      // Kết hợp phân tích
      const combinedAnalysis: InferenceResult = {
        patternId: `analysis-${Date.now()}`,
        explanation: behavioralAnalysis.explanation,
        behavioralTags: behavioralAnalysis.behavioralTags,
        behavioralClassification: behavioralAnalysis.behavioralClassification,
        confidence: 0.85,
        score: Math.round((behavioralAnalysis.score + 5) / 2),
        features: {
          ...behavioralAnalysis.features,
          ...scoringResult,
          avgAttention: behavioralAnalysis.features.avgAttention || 0,
          gatewayResults: gatewayResults || [],
          phase
        }
      };

      setCurrentAnalysis(combinedAnalysis);
      setAssessmentResult(scoringResult);

      // Lưu vào database
      const assessmentIdToUse = createOrUpdateAssessment(
        result,
        currentChild,
        currentAssessmentId,
        scoringResult,
        behavioralAnalysis,
        gatewayResults || [],
        phase
      );

      if (assessmentIdToUse) {
        saveGameSession(
          assessmentIdToUse,
          result,
          features,
          scoringResult,
          gatewayResults || [],
          summary,
          behavioralAnalysis
        );
      }

      // Tạo longitudinal record
      const newRecord = buildLongitudinalRecord(
        selectedGroupId,
        phase,
        gatewayResults || [],
        features,
        behavioralAnalysis,
        scoringResult,
        engagementLevelValue
      );
      
      setRecords(prev => [...prev, newRecord]);

    } catch (error) {
      console.error("Analysis Failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [createOrUpdateAssessment, saveGameSession, buildLongitudinalRecord, handleIncompleteSession]);

  // ============================================
  // XỬ LÝ FEATURE STREAM
  // ============================================
  const handleFeatureStream = useCallback((feature: BehavioralFeature) => {
    // Optional debug
    if (process.env.NODE_ENV === 'development') {
      console.log('Feature captured:', feature);
    }
  }, []);

  // ============================================
  // XÓA THÔNG BÁO PHIÊN
  // ============================================
  const clearSessionMessage = useCallback(() => {
    setSessionMessage(null);
  }, []);

  const value = {
    records,
    currentAnalysis,
    assessmentResult,
    isAnalyzing,
    sessionMessage,
    handleSessionEnd,
    handleFeatureStream,
    clearSessionMessage,
  };

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
};

// ============================================
// HOOK SỬ DỤNG ASSESSMENT
// ============================================
export const useAssessment = () => {
  const context = useContext(AssessmentContext);
  if (context === undefined) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};