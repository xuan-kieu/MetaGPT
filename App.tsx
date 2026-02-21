import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import {
  AppMode,
  BehavioralFeature,
  LongitudinalRecord,
  InferenceResult,
  UserRole,
  ChildProfile
} from './types';
import {
  User as DBUser,
  Child as DBChild,
  Assessment as DBAssessment,
  GameSession as DBGameSession,
  GameSessionMetric as DBGameSessionMetric
} from './types';
import GameEngine from './components/GameEngine';
import { ClinicianDashboard } from './components/ClinicianDashboard';
import { analyzeBehavioralPatterns } from './services/behaviorAnalysisService';
import LoginScreen from './components/Auth/LoginScreen';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import PrivateRoute from './components/Auth/PrivateRoute';
import RoleRoute from './components/Auth/RoleRoute';
import ChildProfileScreen from './components/Onboarding/ChildProfile';
import Screener from './components/Assessment/Screener';
import AssessmentPrep from './components/Assessment/AssessmentPrep';
import SpecialistChildren from './components/Specialist/SpecialistChildren';
import ChildDetail from './components/Specialist/ChildDetail';
import AdminLayout from './components/Admin/AdminLayout';
import UserManagement from './components/Admin/UserManagement';
import ChildManagement from './components/Admin/ChildManagement';
import NormManagement from './components/Admin/NormManagement';
import GameManagement from './components/Admin/GameManagement';
import SystemStats from './components/Admin/SystemStats';
import { DataMapper } from './services/dataMapper';
import { ScoringService, DEFAULT_NORMS, FullAssessmentResult as ScoringResult } from './services/scoringService';
import { ReportService } from './services/reportService';
import * as db from './services/dbService';
import './styles.css';

// --- Định nghĩa kiểu UIUser ---
interface UIUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// --- CẤU HÌNH NHÓM TUỔI ---
type AgeGroupInfo = {
  id: string;
  label: string;
  description: string;
  targetTime: string;
  numericAge: number;
  previewList: string[];
};

const PROGRAM_INFO: Record<string, AgeGroupInfo> = {
  GROUP_A: { 
    id: 'GROUP_A', 
    label: 'Nhóm 12-18 tháng', 
    description: 'Vận động tinh & Tương tác sớm', 
    targetTime: '10 phút', 
    numericAge: 15, 
    previewList: ['Bong Bóng Bay', 'Vỗ Tay', 'Quay Lại', 'Ú Òa', 'Đồ Chơi'] 
  },
  GROUP_B: { 
    id: 'GROUP_B', 
    label: 'Nhóm 18-24 tháng', 
    description: 'Ngôn ngữ & Bắt chước', 
    targetTime: '15 phút', 
    numericAge: 20, 
    previewList: ['Chỉ Tay', 'Xếp Tháp', 'Tiếng Kêu', 'Cho Ăn', 'Tìm Bóng'] 
  },
  GROUP_C: { 
    id: 'GROUP_C', 
    label: 'Nhóm 2-3 tuổi', 
    description: 'Nhận thức & Cảm xúc', 
    targetTime: '18 phút', 
    numericAge: 30, 
    previewList: ['Về Đúng Nhà', 'Cảm Xúc', 'Đến Lượt', 'Ghép Cặp', 'Mê Cung'] 
  },
  GROUP_D: { 
    id: 'GROUP_D', 
    label: 'Nhóm 3-5 tuổi', 
    description: 'Tư duy logic & Xã hội', 
    targetTime: '20 phút', 
    numericAge: 48, 
    previewList: ['Vì Sao Thế', 'Kể Chuyện', 'Cửa Hàng', 'Chỉ Dẫn', 'Quy Tắc'] 
  }
};

// --- Hàm mapping giữa DB và UI ---
const mapDBUserToUser = (dbUser: DBUser): UIUser => ({
  id: dbUser.id,
  email: dbUser.email || '',
  name: dbUser.full_name,
  role: dbUser.role === 'parent' ? UserRole.PARENT : 
        dbUser.role === 'specialist' ? UserRole.CLINICIAN : 
        dbUser.role === 'admin' ? UserRole.ADMIN : UserRole.PARENT,
});

const mapDBChildToChildProfile = (dbChild: DBChild): ChildProfile => {
  const birthDate = new Date(dbChild.birth_date);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  if (months < 0) { years--; months += 12; }
  return {
    id: dbChild.id,
    name: dbChild.full_name,
    birthDate: dbChild.birth_date,
    gender: (dbChild.gender as any) || 'other',
    region: dbChild.region || '',
    primaryLanguage: dbChild.primary_language || 'vi',
    age: { years, months },
  };
};

const mapChildProfileToDBChild = (profile: ChildProfile, parentId: string): Omit<DBChild, 'id' | 'created_at' | 'updated_at'> => ({
  full_name: profile.name,
  birth_date: profile.birthDate,
  gender: profile.gender,
  region: profile.region,
  primary_language: profile.primaryLanguage,
  notes: null,
  parent_id: parentId,
  created_by: parentId,
});

// --- COMPONENT BÁO CÁO PHỤ HUYNH ---
const ParentReport: React.FC<{
  assessmentResult: ScoringResult;
  childName: string;
  onBack: () => void
}> = ({ assessmentResult, childName, onBack }) => {
  const { totalRiskScore, riskLevel, developmentalAgeMonths, childAgeMonths } = assessmentResult;

  const riskText = {
    'LOW': 'Thấp',
    'MEDIUM': 'Trung bình',
    'HIGH': 'Cao',
    'VERY_HIGH': 'Rất cao'
  }[riskLevel] || riskLevel;

  const riskColor = {
    'LOW': '#22c55e',
    'MEDIUM': '#eab308',
    'HIGH': '#f97316',
    'VERY_HIGH': '#ef4444'
  }[riskLevel] || '#64748b';

  const dashboardData = ReportService.getDashboardData(assessmentResult);

  return (
    <div className="report-container fade-in-up">
      <div className="report-header-mobile">
        <div className="report-icon-wrapper">🎉</div>
        <h2>Hoan hô bé {childName}!</h2>
        <p>Bé đã hoàn thành buổi chơi hôm nay.</p>
      </div>

      <div style={{ background: riskColor + '20', borderColor: riskColor, padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: '#1e293b' }}>Mức độ nguy cơ:</span>
          <span style={{ fontWeight: 800, color: riskColor, fontSize: '1.3rem' }}>{riskText}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#475569' }}>Tuổi thực: {childAgeMonths} tháng</span>
          <span style={{ fontSize: '0.9rem', color: '#475569' }}>Tuổi phát triển: {developmentalAgeMonths} tháng</span>
        </div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', background: 'white', padding: '0.5rem', borderRadius: '8px' }}>
          <strong>Điểm Z tổng hợp:</strong> {totalRiskScore.toFixed(2)}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ textAlign: 'left', fontSize: '1rem', marginBottom: '0.5rem' }}>📊 Điểm theo nhóm kỹ năng</h3>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-around' }}>
          {dashboardData.domainPie.labels.map((label, i) => (
            <div key={i} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ width: '100%', background: '#f1f5f9', borderRadius: '8px', height: '8px', marginBottom: '0.3rem' }}>
                <div style={{ width: `${dashboardData.domainPie.values[i]}%`, height: '8px', backgroundColor: dashboardData.domainPie.colors[i], borderRadius: '8px' }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#334155' }}>{label}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block' }}>{Math.round(dashboardData.domainPie.values[i])}%</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#f8fafc', padding: '1.2rem', borderRadius: '16px', marginBottom: '1.5rem', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ background: '#6366f1', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>🎯 KỸ NĂNG CẦN HỖ TRỢ</span>
        </div>
        <ul style={{ paddingLeft: '1.2rem', margin: '0.5rem 0', color: '#334155' }}>
          {dashboardData.skillBars.filter(s => s.status === 'RED').slice(0, 3).map((s, idx) => (
            <li key={idx} style={{ marginBottom: '0.3rem' }}>• {s.skillName}: {s.rawScore}% (xếp hạng {s.percentile}%)</li>
          ))}
          {dashboardData.skillBars.filter(s => s.status === 'RED').length === 0 && (
            <li>Chưa phát hiện kỹ năng yếu đặc thù</li>
          )}
        </ul>
      </div>

      <button onClick={onBack} className="report-home-btn">
        Về màn hình chính
      </button>
    </div>
  );
};

// --- MÀN HÌNH BẮT ĐẦU (START SCREEN) ---
interface StartScreenProps {
  childName: string;
  setChildName: (name: string) => void;
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string) => void;
  onStartSession: () => void;
  onManageProfiles: () => void;
  programInfo: Record<string, AgeGroupInfo>;
  currentUser: UIUser;
  currentChild: ChildProfile | null;
}

const StartScreen: React.FC<StartScreenProps> = ({
  childName, setChildName, selectedGroupId, setSelectedGroupId, onStartSession, onManageProfiles,
  programInfo, currentUser, currentChild
}) => {
  useEffect(() => {
    if (currentChild && currentChild.age) {
      const ageInMonths = currentChild.age.years * 12 + currentChild.age.months;
      let closestGroup = Object.values(programInfo).reduce((prev, curr) =>
        Math.abs(curr.numericAge - ageInMonths) < Math.abs(prev.numericAge - ageInMonths) ? curr : prev
      );
      setSelectedGroupId(closestGroup.id);
    }
  }, [currentChild, programInfo, setSelectedGroupId]);

  return (
    <div className="setup-container">
      <div className="user-welcome">
        <div className="welcome-left">
          <span className="welcome-text">Xin chào, {currentUser.name}</span>
          <span className="user-role-badge">
            {currentUser.role === UserRole.PARENT ? '👨‍👩‍👧‍👦 Phụ huynh' : 
             currentUser.role === UserRole.CLINICIAN ? '👨‍⚕️ Chuyên gia' : 
             '👑 Admin'}
          </span>
        </div>
        {currentChild && (
          <div className="current-child-info">
            <span className="child-label">👶 Bé đang đánh giá:</span>
            <span className="child-name">{currentChild.name} ({currentChild.age?.years || 0} tuổi {currentChild.age?.months || 0} tháng)</span>
          </div>
        )}
      </div>

      <h2 className="setup-title">Thiết lập buổi đánh giá</h2>

      {currentUser.role === UserRole.PARENT && !currentChild && (
        <div className="input-group">
          <label>Tên bé:</label>
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="Nhập tên bé..."
            className="name-input"
            autoFocus
          />
        </div>
      )}

      {(currentUser.role === UserRole.CLINICIAN || currentUser.role === UserRole.ADMIN) && (
        <div className="clinician-note">
          <div className="note-icon">💡</div>
          <div className="note-content">
            <strong>Chế độ {currentUser.role === UserRole.ADMIN ? 'Admin' : 'Chuyên gia'}:</strong> 
            {currentUser.role === UserRole.ADMIN 
              ? ' Bạn có thể quản lý hệ thống qua Admin Panel.'
              : ' Bạn có thể tạo buổi đánh giá demo hoặc xem kết quả trong Dashboard.'}
          </div>
        </div>
      )}

      <div className="program-grid">
        {Object.values(programInfo).map((group) => (
          <div
            key={group.id}
            onClick={() => setSelectedGroupId(group.id)}
            className={`program-card ${selectedGroupId === group.id ? 'selected' : ''}`}
          >
            <div className="card-header">
              <span className="card-label">{group.label}</span>
              {selectedGroupId === group.id && <span className="check-icon">✓</span>}
            </div>
            <div className="card-meta">⏱ {group.targetTime}</div>
            <div className="card-desc">{group.description}</div>
            {currentChild?.age && (
              <div className="age-match">
                <span className={`match-indicator ${Math.abs(currentChild.age.years * 12 + currentChild.age.months - group.numericAge) <= 6 ? 'match-good' : 'match-fair'}`}>
                  {Math.abs(currentChild.age.years * 12 + currentChild.age.months - group.numericAge) <= 6 ? '✓ Phù hợp' : '∼ Có thể thử'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedGroupId && (
        <div className="preview-box">
          <h4>📋 Lộ trình bài tập dự kiến:</h4>
          <div className="tags-container">
            {PROGRAM_INFO[selectedGroupId].previewList.map((gameName, idx) => (
              <span key={idx} className="game-tag">{idx + 1}. {gameName}</span>
            ))}
          </div>
        </div>
      )}

      <div className="session-actions">
        <button
          onClick={onStartSession}
          disabled={!selectedGroupId}
          className="start-btn"
        >
          🚀 Chuẩn bị đánh giá
        </button>

        {currentUser.role === UserRole.PARENT && (
          <button className="manage-profiles-btn" onClick={onManageProfiles}>
            👥 Quản lý hồ sơ trẻ
          </button>
        )}
      </div>
    </div>
  );
};

// --- APP CONTENT (Phần nội dung chính sau khi đăng nhập) ---
const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UIUser | null>(null);
  const [currentChild, setCurrentChild] = useState<ChildProfile | null>(null);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);
  const [showScreener, setShowScreener] = useState(false);
  const [showChildProfile, setShowChildProfile] = useState(false);
  const [mode, setMode] = useState<AppMode>(AppMode.PATIENT);
  const [childName, setChildName] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showAssessmentPrep, setShowAssessmentPrep] = useState(false);
  const [deviceCheckPassed, setDeviceCheckPassed] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [showParentReport, setShowParentReport] = useState(false);
  const [records, setRecords] = useState<LongitudinalRecord[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<InferenceResult | undefined>();
  const [assessmentResult, setAssessmentResult] = useState<ScoringResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const navigate = useNavigate();

  // --- Khôi phục phiên từ localStorage ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      navigate('/login', { replace: true });
      return;
    }
    
    try {
      const userData = JSON.parse(userStr);
      const uiUser: UIUser = {
        id: userData.id,
        email: userData.email || '',
        name: userData.full_name || userData.name || 'User',
        role: userData.role === 'parent' ? UserRole.PARENT : 
              userData.role === 'specialist' ? UserRole.CLINICIAN : 
              userData.role === 'admin' ? UserRole.ADMIN : UserRole.PARENT,
      };
      setCurrentUser(uiUser);
      
      // QUAN TRỌNG: Đảm bảo user tồn tại trong db_users khi khôi phục session
      const existingUser = db.getUserById(uiUser.id);
      if (!existingUser) {
        console.log('📝 Đồng bộ user vào db_users khi khôi phục session:', userData);
        
        db.createUser({
          username: userData.email?.split('@')[0] || `user_${Date.now()}`,
          password_hash: 'hashed_password_demo',
          email: userData.email,
          phone: null,
          full_name: userData.full_name || userData.name || 'User',
          role: userData.role,
        });
      }
      
      if (uiUser.role === UserRole.PARENT) {
        const storedChildId = localStorage.getItem('neuropath_child_id');
        if (storedChildId) {
          const dbChild = db.getChildById(storedChildId);
          if (dbChild) {
            const child = mapDBChildToChildProfile(dbChild);
            setCurrentChild(child);
            setChildName(child.name);
          }
        } else {
          const children = db.getChildrenByParent(uiUser.id);
          if (children.length > 0) {
            const child = mapDBChildToChildProfile(children[0]);
            setCurrentChild(child);
            setChildName(child.name);
            localStorage.setItem('neuropath_child_id', child.id);
          }
        }
      } else if (uiUser.role === UserRole.CLINICIAN) {
        setMode(AppMode.CLINICIAN);
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // --- Đăng nhập ---
  const handleLogin = useCallback((role: UserRole, email?: string, name?: string, token?: string, userData?: any) => {
    if (token) {
      localStorage.setItem('token', token);
    }
    
    if (userData) {
      const uiUser: UIUser = {
        id: userData.id,
        email: userData.email,
        name: userData.full_name || userData.name || name || 'User',
        role: userData.role === 'parent' ? UserRole.PARENT : 
              userData.role === 'specialist' ? UserRole.CLINICIAN : 
              userData.role === 'admin' ? UserRole.ADMIN : UserRole.PARENT,
      };
      setCurrentUser(uiUser);
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('neuropath_user_id', uiUser.id);
      
      // QUAN TRỌNG: Đồng bộ user vào db_users nếu chưa có
      const existingUser = db.getUserById(uiUser.id);
      if (!existingUser) {
        console.log('📝 Đồng bộ user vào db_users:', userData);
        
        db.createUser({
          username: userData.email?.split('@')[0] || `user_${Date.now()}`,
          password_hash: 'hashed_password_demo',
          email: userData.email,
          phone: null,
          full_name: userData.full_name || userData.name || name || 'User',
          role: userData.role,
        });
      }
      
      if (uiUser.role === UserRole.PARENT) {
        // Kiểm tra xem parent đã có child chưa
        const children = db.getChildrenByParent(uiUser.id);
        
        if (children.length === 0) {
          setShowChildProfile(true);
        } else {
          const child = mapDBChildToChildProfile(children[0]);
          setCurrentChild(child);
          setChildName(child.name);
          localStorage.setItem('neuropath_child_id', child.id);
          const assessments = db.getAssessmentsByChild(child.id);
          const hasScreener = assessments.some(a => a.status === 'scheduled' && a.adaptive_flow);
          if (!hasScreener) {
            setShowScreener(true);
          }
        }
      } else if (uiUser.role === UserRole.CLINICIAN) {
        setMode(AppMode.CLINICIAN);
      }
    }
  }, []);

  const handleChildProfileComplete = useCallback((childData: ChildProfile) => {
    if (!currentUser) return;
    const dbChildInput = mapChildProfileToDBChild(childData, currentUser.id);
    const dbChild = db.createChild(dbChildInput);
    const newChild = mapDBChildToChildProfile(dbChild);
    setCurrentChild(newChild);
    setChildName(newChild.name);
    localStorage.setItem('neuropath_child_id', newChild.id);
    setShowChildProfile(false);
    setShowScreener(true);
  }, [currentUser]);

  const handleScreenerComplete = useCallback((result: any) => {
    if (!currentChild || !currentUser) return;

    const assessment = db.createAssessment({
      child_id: currentChild.id,
      started_by: currentUser.id,
      started_at: new Date().toISOString(),
      status: 'scheduled',
      adaptive_flow: JSON.stringify(result),
      device_info: null,
      environment_notes: null,
      parent_assisted: false,
      overall_risk_score: null,
      risk_level: null,
      developmental_age_estimate: null,
      report_json: null,
      completed_at: null,
    });

    setCurrentAssessmentId(assessment.id);
    setShowScreener(false);
    setShowAssessmentPrep(true);
  }, [currentChild, currentUser]);

  const handleStartSession = useCallback(() => {
    setShowAssessmentPrep(true);
  }, []);

  const handleDeviceCheckComplete = useCallback(() => {
    setDeviceCheckPassed(true);
    setShowAssessmentPrep(false);
    setIsSessionActive(true);
  }, []);

  const handleSessionEnd = useCallback(async (allFeatures: BehavioralFeature[]) => {
    console.log("🏁 Session Complete. Total Data Points:", allFeatures.length);
    setIsSessionActive(false);
    setIsAnalyzing(true);

    try {
      const behavioralAnalysis = await analyzeBehavioralPatterns(allFeatures);
      const childAgeMonths = currentChild?.age
        ? currentChild.age.years * 12 + currentChild.age.months
        : (selectedGroupId ? PROGRAM_INFO[selectedGroupId].numericAge : 30);

      const inputs = DataMapper.mapSessionToInputs(allFeatures);
      const scoringResult = ScoringService.calculateAssessment(inputs, DEFAULT_NORMS, childAgeMonths);

      const engagementLevelValue =
        behavioralAnalysis.behavioralClassification?.engagementLevel === 'high' ? 0.9 :
        behavioralAnalysis.behavioralClassification?.engagementLevel === 'medium' ? 0.6 : 0.3;

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
          avgAttention: behavioralAnalysis.features.avgAttention || 0
        }
      };

      setCurrentAnalysis(combinedAnalysis);
      setAssessmentResult(scoringResult);

      if (currentChild && currentUser) {
        let assessmentId = currentAssessmentId;
        if (!assessmentId) {
          const newAssessment = db.createAssessment({
            child_id: currentChild.id,
            started_by: currentUser.id,
            started_at: new Date(allFeatures[0]?.timestamp || Date.now()).toISOString(),
            status: 'in_progress',
            adaptive_flow: null,
            device_info: null,
            environment_notes: null,
            parent_assisted: false,
            overall_risk_score: null,
            risk_level: null,
            developmental_age_estimate: null,
            report_json: null,
            completed_at: null,
          });
          assessmentId = newAssessment.id;
        }

        const riskLevelMap: Record<string, 'RẤT CAO' | 'CAO' | 'TRUNG BÌNH' | 'THẤP'> = {
          'VERY_HIGH': 'RẤT CAO',
          'HIGH': 'CAO',
          'MEDIUM': 'TRUNG BÌNH',
          'LOW': 'THẤP',
        };
        db.updateAssessment(assessmentId, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          overall_risk_score: scoringResult.totalRiskScore,
          risk_level: riskLevelMap[scoringResult.riskLevel] || 'THẤP',
          developmental_age_estimate: scoringResult.developmentalAgeMonths,
          report_json: {
            analysis: behavioralAnalysis,
            scoring: scoringResult,
            featuresCount: allFeatures.length,
          },
        });

        const gameSession = db.createGameSession({
          assessment_id: assessmentId,
          game_id: 1,
          sequence_order: 1,
          started_at: new Date(allFeatures[0]?.timestamp || Date.now()).toISOString(),
          ended_at: new Date().toISOString(),
          status: 'completed',
          raw_data_json: allFeatures,
          result_scores: scoringResult,
        });

        const now = new Date().toISOString();
        const metrics: Omit<DBGameSessionMetric, 'id'>[] = [
          {
            game_session_id: gameSession.id,
            metric_key: 'avg_attention',
            metric_value: behavioralAnalysis.features.avgAttention || 0,
            unit: '%',
            captured_at: now,
          },
          {
            game_session_id: gameSession.id,
            metric_key: 'avg_smile',
            metric_value: behavioralAnalysis.features.avgSmile || 0,
            unit: '%',
            captured_at: now,
          },
          {
            game_session_id: gameSession.id,
            metric_key: 'gaze_stability',
            metric_value: behavioralAnalysis.features.gazeStability || 0,
            unit: '',
            captured_at: now,
          },
          {
            game_session_id: gameSession.id,
            metric_key: 'engagement',
            metric_value: engagementLevelValue,
            unit: '',
            captured_at: now,
          }
        ];
        metrics.forEach(m => db.createGameSessionMetric(m));
      }

      const newRecord: LongitudinalRecord = {
        id: `sess-${Date.now()}`,
        date: new Date().toISOString(),
        riskScore: scoringResult.totalRiskScore,
        observations: [
          `Chương trình: ${selectedGroupId ? PROGRAM_INFO[selectedGroupId].label : 'Không xác định'}`,
          ...combinedAnalysis.behavioralTags
        ],
        features: allFeatures,
        metrics: {
          attention: Number(behavioralAnalysis.features.avgAttention) || 0,
          smile: Number(behavioralAnalysis.features.avgSmile) || 0,
          gazeStability: Number(behavioralAnalysis.features.gazeStability) || 0,
          engagement: engagementLevelValue
        },
        classification: behavioralAnalysis.behavioralClassification
      };
      setRecords(prev => [...prev, newRecord]);

      if (currentUser?.role === UserRole.CLINICIAN) {
        setMode(AppMode.CLINICIAN);
      } else if (currentUser?.role === UserRole.PARENT) {
        setShowParentReport(true);
      }
    } catch (error) {
      console.error("Analysis Failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentUser, currentChild, selectedGroupId, currentAssessmentId]);

  const handleFeatureStream = useCallback((feature: BehavioralFeature) => {
    // Có thể dùng để debug
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('neuropath_user_id');
    localStorage.removeItem('neuropath_child_id');
    setCurrentUser(null);
    setCurrentChild(null);
    setChildName('');
    setSelectedGroupId(null);
    setIsSessionActive(false);
    setShowAssessmentPrep(false);
    setDeviceCheckPassed(false);
    setShowScreener(false);
    setShowChildProfile(false);
    setShowParentReport(false);
    setAssessmentResult(null);
    setCurrentAssessmentId(null);
    setRecords([]);
    setCurrentAnalysis(undefined);
    setMode(AppMode.PATIENT);
    
    // Chuyển về login
    navigate('/login', { replace: true });
  }, [navigate]);

  const currentProgramInfo = useMemo(() =>
    selectedGroupId ? PROGRAM_INFO[selectedGroupId] : null,
    [selectedGroupId]
  );

  // Nếu chưa có user, không render gì (useEffect sẽ chuyển hướng)
  if (!currentUser) {
    return null;
  }

  if (showChildProfile && currentUser.role === UserRole.PARENT) {
    return (
      <div className="app-container">
        <header className="main-header">
          <div className="brand">
            <div className="logo">NP</div>
            <h1>NeuroPath</h1>
          </div>
          <div className="nav-tabs">
            <button onClick={() => setShowChildProfile(false)}>
              Quay lại
            </button>
            <div className="user-info">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role">👨‍👩‍👧‍👦</span>
              <button onClick={handleLogout} className="logout-btn" title="Đăng xuất">⎋</button>
            </div>
          </div>
        </header>
        <main className="main-body">
          <ChildProfileScreen onComplete={handleChildProfileComplete} />
        </main>
      </div>
    );
  }

  if (showScreener && currentUser.role === UserRole.PARENT && currentChild) {
    return (
      <div className="app-container">
        <header className="main-header">
          <div className="brand">
            <div className="logo">NP</div>
            <h1>NeuroPath</h1>
          </div>
          <div className="nav-tabs">
            <button onClick={() => setShowScreener(false)}>
              Quay lại
            </button>
            <div className="user-info">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role">👨‍👩‍👧‍👦</span>
              <button onClick={handleLogout} className="logout-btn" title="Đăng xuất">⎋</button>
            </div>
          </div>
        </header>
        <main className="main-body">
          <div className="screener-header-info">
            <h2>Bảng câu hỏi sàng lọc sơ bộ</h2>
            <div className="child-info-badge">
              <span>👶 Bé: {currentChild.name}</span>
              <span>🎂 {currentChild.age?.years || 0} tuổi {currentChild.age?.months || 0} tháng</span>
            </div>
          </div>
          <Screener onComplete={handleScreenerComplete} />
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      {isAnalyzing && (
        <div className="analysis-overlay">
          <div className="loading-box">
            <div className="spinner"></div>
            <h3>Đang phân tích hành vi AI...</h3>
            <p>Vui lòng đợi trong giây lát</p>
          </div>
        </div>
      )}

      <header className="main-header">
        <div className="brand">
          <div className="logo">NP</div>
          <h1>NeuroPath</h1>
        </div>
        <div className="nav-tabs">
          {currentUser.role === UserRole.PARENT ? (
            <>
              <button
                onClick={() => { setMode(AppMode.PATIENT); setIsSessionActive(false); setShowParentReport(false); }}
                className={mode === AppMode.PATIENT && !showParentReport ? 'active' : ''}
              >
                Đánh giá
              </button>
              <button
                onClick={() => setShowChildProfile(true)}
                className="child-profile-btn"
              >
                👶 Hồ sơ trẻ
              </button>
            </>
          ) : currentUser.role === UserRole.CLINICIAN ? (
            <>
              <button
                onClick={() => { setMode(AppMode.PATIENT); setIsSessionActive(false); setShowAssessmentPrep(false); }}
                className={mode === AppMode.PATIENT ? 'active' : ''}
              >
                Demo Game
              </button>
              <button
                onClick={() => setMode(AppMode.CLINICIAN)}
                className={mode === AppMode.CLINICIAN ? 'active' : ''}
              >
                Dashboard
              </button>
              <a
                href="/specialist"
                className="specialist-link"
                style={{ marginLeft: '0.5rem', color: '#6366f1', textDecoration: 'none' }}
              >
                📋 Danh sách trẻ
              </a>
            </>
          ) : (
            <a
              href="/admin"
              className="admin-link"
              style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}
            >
              👑 Admin Panel
            </a>
          )}

          <div className="user-info">
            <span className="user-name">{currentUser.name}</span>
            <span className="user-role">
              {currentUser.role === UserRole.PARENT ? '👨‍👩‍👧‍👦' : 
               currentUser.role === UserRole.CLINICIAN ? '👨‍⚕️' : '👑'}
            </span>
            <button onClick={handleLogout} className="logout-btn" title="Đăng xuất">⎋</button>
          </div>
        </div>
      </header>

      <main className="main-body">
        {showAssessmentPrep ? (
          <AssessmentPrep
            onStartAssessment={handleDeviceCheckComplete}
            childName={currentChild?.name || childName || 'Bé'}
          />
        ) : showParentReport && assessmentResult && currentChild ? (
          <ParentReport
            assessmentResult={assessmentResult}
            childName={currentChild.name}
            onBack={() => { setShowParentReport(false); setMode(AppMode.PATIENT); }}
          />
        ) : mode === AppMode.PATIENT ? (
          isSessionActive && currentProgramInfo ? (
            <div className="game-wrapper">
              <GameEngine
                age={currentProgramInfo.numericAge}
                childName={childName || currentChild?.name || 'Bé'}
                themeId="default"
                specificAsset={null}
                onFeatureCapture={handleFeatureStream}
                onSessionEnd={handleSessionEnd}
              />
            </div>
          ) : (
            <StartScreen
              childName={childName}
              setChildName={setChildName}
              selectedGroupId={selectedGroupId}
              setSelectedGroupId={setSelectedGroupId}
              onStartSession={handleStartSession}
              onManageProfiles={() => setShowChildProfile(true)}
              programInfo={PROGRAM_INFO}
              currentUser={currentUser}
              currentChild={currentChild}
            />
          )
        ) : (
          <div className="dashboard-wrapper">
            <div className="dashboard-header">
              <h2>Hồ sơ bệnh án điện tử</h2>
              <div className="stats-row">
                <div className="stat-pill">Tổng Sessions: <b>{records.length}</b></div>
                <div className="user-info-pill">
                  <span className="user-icon">
                    {currentUser.role === UserRole.PARENT ? '👨‍👩‍👧‍👦' : 
                     currentUser.role === UserRole.CLINICIAN ? '👨‍⚕️' : '👑'}
                  </span>
                  <span>{currentUser.name}</span>
                </div>
              </div>
            </div>
            <ClinicianDashboard records={records} latestAnalysis={currentAnalysis} />
          </div>
        )}
      </main>
    </div>
  );
};

// --- App chính với Router ---
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginScreen onLogin={(role, email, name, token, userData) => {
          // LoginScreen sẽ tự xử lý chuyển hướng
        }} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected routes - cần đăng nhập */}
        <Route path="/" element={
          <PrivateRoute>
            <AppContent />
          </PrivateRoute>
        } />

        {/* Specialist routes */}
        <Route path="/specialist" element={
          <RoleRoute allowedRoles={['specialist']}>
            <div className="app-container" style={{ padding: '20px' }}>
              <SpecialistChildren />
            </div>
          </RoleRoute>
        } />
        <Route path="/specialist/children/:childId" element={
          <RoleRoute allowedRoles={['specialist']}>
            <div className="app-container" style={{ padding: '20px' }}>
              <ChildDetail />
            </div>
          </RoleRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin" element={
          <RoleRoute allowedRoles={['admin']}>
            <AdminLayout />
          </RoleRoute>
        }>
          <Route index element={<Navigate to="/admin/stats" replace />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="children" element={<ChildManagement />} />
          <Route path="norms" element={<NormManagement />} />
          <Route path="games" element={<GameManagement />} />
          <Route path="stats" element={<SystemStats />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;