import * as db from './dbService';
import { ChildProfile } from '../types';
import { UIUser } from '../context/AuthContext';
import { 
    SessionResultInput, 
    BehavioralAnalysis, 
    GatewayResult,
    AssessmentReportJson 
  } from '../types/assessment.types';
  
  import { FullAssessmentResult } from '../services/scoringService';

// ============================================
// HÀM TIỆN ÍCH
// ============================================
const getRiskLevelMap = (): Record<string, 'RẤT CAO' | 'CAO' | 'TRUNG BÌNH' | 'THẤP'> => ({
  'VERY_HIGH': 'RẤT CAO',
  'HIGH': 'CAO',
  'MEDIUM': 'TRUNG BÌNH',
  'LOW': 'THẤP',
});

// ============================================
// LẤY ASSESSMENTS THEO CHILD
// ============================================
export const getAssessmentsByChild = (childId: string) => {
  return db.getAssessmentsByChild(childId);
};

// ============================================
// LẤY ASSESSMENT THEO ID
// ============================================
export const getAssessmentById = (assessmentId: string) => {
  return db.getAssessmentById(assessmentId);
};

// ============================================
// LẤY TẤT CẢ ASSESSMENTS
// ============================================
export const getAllAssessments = () => {
  return db.getAllAssessments();
};

// ============================================
// TẠO ASSESSMENT MỚI (CHO SCREENER)
// ============================================
export const createAssessment = (data: {
  child_id: string;
  started_by: string;
  started_at: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'abandoned';
  adaptive_flow: string | null;
  device_info?: string | null;
  environment_notes?: string | null;
  parent_assisted?: boolean;
}) => {
  return db.createAssessment({
    child_id: data.child_id,
    started_by: data.started_by,
    started_at: data.started_at,
    status: data.status,
    adaptive_flow: data.adaptive_flow,
    device_info: data.device_info || null,
    environment_notes: data.environment_notes || null,
    parent_assisted: data.parent_assisted || false,
    overall_risk_score: null,
    risk_level: null,
    developmental_age_estimate: null,
    report_json: null,
    completed_at: null,
  });
};

// ============================================
// TẠO HOẶC CẬP NHẬT ASSESSMENT (KHI KẾT THÚC SESSION)
// ============================================
export const createOrUpdateAssessment = (
  result: SessionResultInput,
  currentChild: ChildProfile,
  currentUser: UIUser,
  currentAssessmentId: string | null,
  scoringResult: FullAssessmentResult,
  behavioralAnalysis: BehavioralAnalysis,
  gatewayResults: GatewayResult[],
  phase: string
): string | null => {
  let assessmentIdToUse = currentAssessmentId;
  
  if (!assessmentIdToUse && result.assessmentId) {
    assessmentIdToUse = result.assessmentId;
  }
  
  // Tạo mới nếu chưa có
  if (!assessmentIdToUse) {
    const newAssessment = db.createAssessment({
      child_id: currentChild.id,
      started_by: currentUser.id,
      started_at: new Date(result.startedAt).toISOString(),
      status: 'in_progress',
      adaptive_flow: null,
      device_info: result.deviceInfo || null,
      environment_notes: result.environmentNotes || null,
      parent_assisted: result.parentAssisted || false,
      overall_risk_score: null,
      risk_level: null,
      developmental_age_estimate: null,
      report_json: null,
      completed_at: null,
    });
    assessmentIdToUse = newAssessment.id;
  }

  // Tạo report JSON
  const reportJson: AssessmentReportJson = {
    analysis: behavioralAnalysis,
    scoring: scoringResult,
    featuresCount: result.features?.length || 0,
    gatewayResults,
    summary: result.summary,
    phase
  };

  const riskLevelMap = getRiskLevelMap();
  
  // Cập nhật assessment
  db.updateAssessment(assessmentIdToUse, {
    status: 'completed',
    completed_at: new Date(result.endedAt).toISOString(),
    overall_risk_score: scoringResult.totalRiskScore,
    risk_level: riskLevelMap[scoringResult.riskLevel] || 'THẤP',
    developmental_age_estimate: scoringResult.developmentalAgeMonths,
    report_json: reportJson,
  });

  return assessmentIdToUse;
};

// ============================================
// CẬP NHẬT ASSESSMENT
// ============================================
export const updateAssessment = (
  assessmentId: string,
  updates: Partial<{
    status: 'scheduled' | 'in_progress' | 'completed' | 'abandoned';
    completed_at: string;
    overall_risk_score: number | null;
    risk_level: 'RẤT CAO' | 'CAO' | 'TRUNG BÌNH' | 'THẤP' | null;
    developmental_age_estimate: number | null;
    report_json: any;
  }>
) => {
  return db.updateAssessment(assessmentId, updates);
};

// ============================================
// XÓA ASSESSMENT
// ============================================
export const deleteAssessment = (assessmentId: string) => {
  return db.deleteAssessment(assessmentId);
};

// ============================================
// LẤY ASSESSMENTS THEO TRẠNG THÁI
// ============================================
export const getAssessmentsByStatus = (status: 'scheduled' | 'in_progress' | 'completed' | 'abandoned') => {
  const allAssessments = db.getAllAssessments();
  return allAssessments.filter(a => a.status === status);
};

// ============================================
// LẤY ASSESSMENTS THEO KHOẢNG THỜI GIAN
// ============================================
export const getAssessmentsByDateRange = (startDate: Date, endDate: Date) => {
  const allAssessments = db.getAllAssessments();
  const start = startDate.getTime();
  const end = endDate.getTime();
  
  return allAssessments.filter(a => {
    const createdTime = new Date(a.created_at as string).getTime();
    return createdTime >= start && createdTime <= end;
  });
};

// ============================================
// ĐẾM SỐ LƯỢNG ASSESSMENTS THEO CHILD
// ============================================
export const countAssessmentsByChild = (childId: string): number => {
  const assessments = getAssessmentsByChild(childId);
  return assessments.length;
};

// ============================================
// LẤY ASSESSMENT GẦN NHẤT CỦA CHILD
// ============================================
export const getLatestAssessmentByChild = (childId: string) => {
  const assessments = getAssessmentsByChild(childId);
  if (assessments.length === 0) return null;
  
  // Sắp xếp theo thời gian giảm dần và lấy cái đầu tiên
  return assessments.sort((a, b) => {
    const dateA = new Date(a.created_at as string).getTime();
    const dateB = new Date(b.created_at as string).getTime();
    return dateB - dateA;
  })[0];
};

// ============================================
// KIỂM TRA CHILD ĐÃ CÓ SCREENER CHƯA
// ============================================
export const hasScreener = (childId: string): boolean => {
  const assessments = getAssessmentsByChild(childId);
  return assessments.some(a => a.status === 'scheduled' && a.adaptive_flow);
};

// ============================================
// LẤY THỐNG KÊ ASSESSMENTS
// ============================================
export const getAssessmentStats = () => {
  const allAssessments = db.getAllAssessments();
  
  const total = allAssessments.length;
  const scheduled = allAssessments.filter(a => a.status === 'scheduled').length;
  const inProgress = allAssessments.filter(a => a.status === 'in_progress').length;
  const completed = allAssessments.filter(a => a.status === 'completed').length;
  const abandoned = allAssessments.filter(a => a.status === 'abandoned').length;
  
  // Thống kê theo mức độ nguy cơ
  const riskLevels = {
    'RẤT CAO': allAssessments.filter(a => a.risk_level === 'RẤT CAO').length,
    'CAO': allAssessments.filter(a => a.risk_level === 'CAO').length,
    'TRUNG BÌNH': allAssessments.filter(a => a.risk_level === 'TRUNG BÌNH').length,
    'THẤP': allAssessments.filter(a => a.risk_level === 'THẤP').length,
  };
  
  return {
    total,
    scheduled,
    inProgress,
    completed,
    abandoned,
    riskLevels,
    completionRate: total > 0 ? (completed / total * 100).toFixed(2) : '0',
  };
};