import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  AppMode, BehavioralFeature, LongitudinalRecord, InferenceResult, 
  UserRole, User, ChildProfile
} from './types';
import GameEngine from './components/GameEngine';
import { ClinicianDashboard } from './components/ClinicianDashboard';
import { analyzeBehavioralPatterns } from './services/behaviorAnalysisService';
import inferenceService from './services/InferenceService';
import LoginScreen from './components/Auth/LoginScreen';
import ChildProfileScreen from './components/Onboarding/ChildProfile';
import Screener from './components/Assessment/Screener';
import AssessmentPrep from './components/Assessment/AssessmentPrep';
import { DataMapper } from './services/dataMapper';
import { ScoringService, DEFAULT_NORMS, FullAssessmentResult} from './services/scoringService';
import { ReportService } from './services/reportService';
import './styles.css';

// --- CẤU HÌNH UI (giữ nguyên) ---
type AgeGroupInfo = {
  id: string;
  label: string;
  description: string;
  targetTime: string;
  numericAge: number;
  previewList: string[];
};

const PROGRAM_INFO: Record<string, AgeGroupInfo> = {
  GROUP_A: { id: 'GROUP_A', label: 'Nhóm 12-18 tháng', description: 'Vận động tinh & Tương tác sớm', targetTime: '10 phút', numericAge: 15, previewList: ['Bong Bóng Bay', 'Vỗ Tay', 'Quay Lại', 'Ú Òa', 'Đồ Chơi'] },
  GROUP_B: { id: 'GROUP_B', label: 'Nhóm 18-24 tháng', description: 'Ngôn ngữ & Bắt chước', targetTime: '15 phút', numericAge: 20, previewList: ['Chỉ Tay', 'Xếp Tháp', 'Tiếng Kêu', 'Cho Ăn', 'Tìm Bóng'] },
  GROUP_C: { id: 'GROUP_C', label: 'Nhóm 2-3 tuổi', description: 'Nhận thức & Cảm xúc', targetTime: '18 phút', numericAge: 30, previewList: ['Về Đúng Nhà', 'Cảm Xúc', 'Đến Lượt', 'Ghép Cặp', 'Mê Cung'] },
  GROUP_D: { id: 'GROUP_D', label: 'Nhóm 3-5 tuổi', description: 'Tư duy logic & Xã hội', targetTime: '20 phút', numericAge: 48, previewList: ['Vì Sao Thế', 'Kể Chuyện', 'Cửa Hàng', 'Chỉ Dẫn', 'Quy Tắc'] }
};

// --- COMPONENT PARENT REPORT NÂNG CẤP (hiển thị kết quả từ ScoringService) ---
const ParentReport: React.FC<{ 
  assessmentResult: FullAssessmentResult;
  childName: string;
  onBack: () => void 
}> = ({ assessmentResult, childName, onBack }) => {
  const { totalRiskScore, riskLevel, developmentalAgeMonths, childAgeMonths, domains } = assessmentResult;
  
  // Hàm chuyển mức độ nguy cơ sang tiếng Việt
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

  // Dữ liệu cho biểu đồ từ ReportService
  const dashboardData = ReportService.getDashboardData(assessmentResult);

  return (
    <div className="report-container fade-in-up">
      <div className="report-header-mobile">
        <div className="report-icon-wrapper">🎉</div>
        <h2>Hoan hô bé {childName}!</h2>
        <p>Bé đã hoàn thành buổi chơi hôm nay.</p>
      </div>

      {/* Tổng quan nguy cơ */}
      <div className="risk-summary" style={{ background: riskColor + '20', borderColor: riskColor, padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
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

      {/* Biểu đồ điểm các nhóm kỹ năng */}
      <div className="domain-scores" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ textAlign: 'left', fontSize: '1rem', marginBottom: '0.5rem' }}>📊 Điểm theo nhóm kỹ năng</h3>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-around' }}>
          {dashboardData.domainPie.labels.map((label, i) => (
            <div key={i} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ width: '100%', background: '#f1f5f9', borderRadius: '8px', height: '8px', marginBottom: '0.3rem' }}>
                <div style={{ width: `${dashboardData.domainPie.values[i]}%`, height: '8px', backgroundColor: dashboardData.domainPie.colors[i], borderRadius: '8px' }}></div>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#334155' }}>{label}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block' }}>{Math.round(dashboardData.domainPie.values[i])}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chi tiết các kỹ năng nổi bật */}
      <div className="report-insight-box" style={{ marginBottom: '1.5rem' }}>
        <div className="insight-badge">🎯 Kỹ năng cần hỗ trợ</div>
        <ul style={{ paddingLeft: '1.2rem', margin: '0.5rem 0', color: '#334155' }}>
          {dashboardData.skillBars.filter(s => s.status === 'RED').slice(0, 3).map((s, idx) => (
            <li key={idx} style={{ marginBottom: '0.3rem' }}>• {s.skillName}: {s.rawScore}% (xếp hạng {s.percentile}%)</li>
          ))}
          {dashboardData.skillBars.filter(s => s.status === 'RED').length === 0 && (
            <li>Chưa phát hiện kỹ năng yếu đặc thù</li>
          )}
        </ul>
      </div>

      {/* Khuyến nghị từ báo cáo */}
      <div style={{ background: '#f8fafc', padding: '1.2rem', borderRadius: '16px', marginBottom: '1.5rem', textAlign: 'left' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>📌 Khuyến nghị</h4>
        <ul style={{ paddingLeft: '1.2rem', margin: 0, color: '#334155' }}>
          {ReportService.generateDetailedRecommendationsText(assessmentResult).split('\n').map((line, i) => (
            line.trim() && <li key={i} style={{ marginBottom: '0.3rem', fontSize: '0.9rem' }}>{line}</li>
          ))}
        </ul>
      </div>

      <button onClick={onBack} className="report-home-btn">
        Về màn hình chính
      </button>
    </div>
  );
};

// --- START SCREEN (đã sửa) ---
interface StartScreenProps {
  childName: string;
  setChildName: (name: string) => void;
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string) => void;
  onStartSession: () => void;
  programInfo: Record<string, AgeGroupInfo>;
  currentUser: User;
  currentChild: ChildProfile | null;
}

const StartScreen: React.FC<StartScreenProps> = ({
  childName, setChildName, selectedGroupId, setSelectedGroupId, onStartSession,
  programInfo, currentUser, currentChild
}) => {
  const currentProgramInfo = selectedGroupId ? programInfo[selectedGroupId] : null;

  // Tự động chọn nhóm tuổi dựa trên tuổi thực của trẻ (nếu có)
  useEffect(() => {
    if (currentChild && currentChild.age) {
      const ageInMonths = currentChild.age.years * 12 + currentChild.age.months;
      // Tìm nhóm có numericAge gần nhất
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
            {currentUser.role === UserRole.PARENT ? '👨‍👩‍👧‍👦 Phụ huynh' : '👨‍⚕️ Chuyên gia'}
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
      
      {/* Chỉ hiển thị ô nhập tên cho PHỤ HUYNH và khi chưa có currentChild */}
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

      {currentUser.role === UserRole.CLINICIAN && (
        <div className="clinician-note">
          <div className="note-icon">💡</div>
          <div className="note-content">
            <strong>Chế độ Chuyên gia:</strong> Bạn có thể tạo buổi đánh giá demo hoặc xem kết quả trong Dashboard.
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
                <span className={`match-indicator ${
                  Math.abs(currentChild.age.years * 12 + currentChild.age.months - group.numericAge) <= 6 ? 'match-good' : 'match-fair'
                }`}>
                  {Math.abs(currentChild.age.years * 12 + currentChild.age.months - group.numericAge) <= 6 ? '✓ Phù hợp' : '∼ Có thể thử'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {currentProgramInfo && (
        <div className="preview-box">
          <h4>📋 Lộ trình bài tập dự kiến:</h4>
          <div className="tags-container">
            {currentProgramInfo.previewList.map((gameName, idx) => (
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
          <button 
            className="manage-profiles-btn"
            onClick={() => window.location.href = '/child-profile'}
          >
            👥 Quản lý hồ sơ trẻ
          </button>
        )}
      </div>
    </div>
  );
};

// --- APP CHÍNH ---
const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentChild, setCurrentChild] = useState<ChildProfile | null>(null);
  const [showScreener, setShowScreener] = useState(false);
  const [showChildProfile, setShowChildProfile] = useState(false);
  const [mode, setMode] = useState<AppMode>(AppMode.PATIENT);
  
  // State cho StartScreen
  const [childName, setChildName] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  // State cho AssessmentPrep
  const [showAssessmentPrep, setShowAssessmentPrep] = useState(false);
  const [deviceCheckPassed, setDeviceCheckPassed] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  
  // State hiển thị Parent Report
  const [showParentReport, setShowParentReport] = useState(false);
  
  // Dashboard State
  const [records, setRecords] = useState<LongitudinalRecord[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<InferenceResult | undefined>();
  const [assessmentResult, setAssessmentResult] = useState<FullAssessmentResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Kiểm tra đăng nhập và load dữ liệu khi mount
  useEffect(() => {
    const savedUser = localStorage.getItem('neuropath_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        
        if (user.role === UserRole.PARENT) {
          const savedChild = localStorage.getItem('current_child');
          if (savedChild) {
            const child = JSON.parse(savedChild);
            setCurrentChild(child);
            setChildName(child.name);
            
            const screenerResult = localStorage.getItem(`screener_${child.id}`);
            if (!screenerResult) {
              setShowScreener(true);
            }
          } else {
            setShowChildProfile(true);
          }
        } else {
          setMode(AppMode.CLINICIAN);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Hàm tính tuổi theo tháng từ ChildProfile
  const getChildAgeMonths = useCallback((): number => {
    if (currentChild?.age) {
      return currentChild.age.years * 12 + currentChild.age.months;
    }
    // Fallback: dùng tuổi từ nhóm đã chọn
    return selectedGroupId ? PROGRAM_INFO[selectedGroupId].numericAge : 30;
  }, [currentChild, selectedGroupId]);

  // Xử lý đăng nhập
  const handleLogin = useCallback((role: UserRole, email?: string, name?: string) => {
    const user: User = {
      id: `user_${Date.now()}`,
      email: email || (role === UserRole.PARENT ? 'parent@example.com' : 'clinician@example.com'),
      name: name || (role === UserRole.PARENT ? 'Phụ huynh' : 'Chuyên gia'),
      role
    };
    setCurrentUser(user);
    localStorage.setItem('neuropath_user', JSON.stringify(user));
    
    if (role === UserRole.PARENT) {
      const savedChild = localStorage.getItem('current_child');
      if (!savedChild) {
        setShowChildProfile(true);
      } else {
        const child = JSON.parse(savedChild);
        setCurrentChild(child);
        setChildName(child.name);
        const screenerResult = localStorage.getItem(`screener_${child.id}`);
        if (!screenerResult) {
          setShowScreener(true);
        }
      }
    } else {
      setMode(AppMode.CLINICIAN);
    }
  }, []);

  // Xử lý hoàn thành hồ sơ trẻ
  const handleChildProfileComplete = useCallback((childData: ChildProfile) => {
    setCurrentChild(childData);
    setChildName(childData.name);
    setShowChildProfile(false);
    localStorage.setItem('current_child', JSON.stringify(childData));
    setShowScreener(true);
  }, []);

  // Xử lý hoàn thành screener
  const handleScreenerComplete = useCallback((result: any) => {
    setShowScreener(false);
    if (currentChild) {
      localStorage.setItem(`screener_${currentChild.id}`, JSON.stringify({
        ...result,
        childId: currentChild.id,
        completedAt: new Date().toISOString()
      }));
    }
  }, [currentChild]);

  // Xử lý bắt đầu session: mở màn hình kiểm tra thiết bị
  const handleStartSession = useCallback(() => {
    setShowAssessmentPrep(true);
  }, []);

  // Xử lý kiểm tra thiết bị thành công
  const handleDeviceCheckComplete = useCallback(() => {
    setDeviceCheckPassed(true);
    setShowAssessmentPrep(false);
    setIsSessionActive(true);
  }, []);

  // Xử lý kết thúc phiên đánh giá
  const handleSessionEnd = useCallback(async (allFeatures: BehavioralFeature[]) => {
    console.log("🏁 Session Complete. Total Data Points:", allFeatures.length);
    setIsSessionActive(false);
    setIsAnalyzing(true);

    try {
      // 1. Phân tích hành vi AI
      const behavioralAnalysis = await analyzeBehavioralPatterns(allFeatures);
      
      // 2. Lấy tuổi thực của trẻ
      const childAgeMonths = getChildAgeMonths();
      
      // 3. Map dữ liệu thành AssessmentInput
      const inputs = DataMapper.mapSessionToInputs(allFeatures);
      
      // 4. Tính điểm chuẩn hoá
      const scoringResult = ScoringService.calculateAssessment(
        inputs,
        DEFAULT_NORMS,
        childAgeMonths
      );
      
      // 5. Tạo InferenceResult tổng hợp (cho dashboard cũ)
      const combinedAnalysis: InferenceResult = {
        patternId: `analysis-${Date.now()}`,
        explanation: behavioralAnalysis.explanation,
        behavioralTags: behavioralAnalysis.behavioralTags,
        behavioralClassification: behavioralAnalysis.behavioralClassification,
        confidence: 0.85,
        score: Math.round((behavioralAnalysis.score + 5) / 2), // scale 0-10
        features: { 
          ...behavioralAnalysis.features, 
          ...scoringResult,
          avgAttention: behavioralAnalysis.features.avgAttention || 0
        }
      };
      
      setCurrentAnalysis(combinedAnalysis);
      setAssessmentResult(scoringResult); // 👈 LƯU KẾT QUẢ CHUẨN

      // 6. Tạo longitudinal record (cho ClinicianDashboard)
      const engagementLevelValue = 
        behavioralAnalysis.behavioralClassification?.engagementLevel === 'high' ? 0.9 :
        behavioralAnalysis.behavioralClassification?.engagementLevel === 'medium' ? 0.6 : 0.3;

      const newRecord: LongitudinalRecord = {
        id: `sess-${Date.now()}`,
        date: new Date().toISOString(),
        riskScore: scoringResult.totalRiskScore, // Lưu Z-score
        observations: [
          `Chương trình: ${PROGRAM_INFO[selectedGroupId!]?.label}`,
          ...combinedAnalysis.behavioralTags
        ],
        features: allFeatures,
        metrics: {
          attention: Number(behavioralAnalysis.features.avgAttention) || 0,
          smile: Number(behavioralAnalysis.features.avgSmile) || 0,
          gazeStability: Number(behavioralAnalysis.features.gazeStability) || 0,
          engagement: engagementLevelValue // ✅ Đã sửa
        },
        classification: behavioralAnalysis.behavioralClassification
      };
      
      setRecords(prev => [...prev, newRecord]);
      
      // 7. Chuyển hướng dựa trên vai trò
      if (currentUser?.role === UserRole.CLINICIAN) {
        setMode(AppMode.CLINICIAN);
      } else if (currentUser?.role === UserRole.PARENT) {
        setShowParentReport(true);
      }
      
    } catch (error) {
      console.error("Analysis Failed:", error);
    } finally {
      setIsAnalyzing(false);
      // Không reset selectedGroupId ở đây để giữ lại cho lần sau
    }
  }, [currentUser, selectedGroupId, getChildAgeMonths]);

  const handleFeatureStream = useCallback((feature: BehavioralFeature) => {
    // Stream logic (có thể bỏ qua)
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('neuropath_user');
    localStorage.removeItem('current_child');
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
    setMode(AppMode.PATIENT);
  }, []);

  const currentProgramInfo = useMemo(() => 
    selectedGroupId ? PROGRAM_INFO[selectedGroupId] : null, 
  [selectedGroupId]);

  // Nếu chưa đăng nhập
  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  // Nếu là phụ huynh và chưa có hồ sơ trẻ
  if (showChildProfile && currentUser.role === UserRole.PARENT) {
    return (
      <div className="app-container">
        <header className="main-header">{/* ... */}</header>
        <main className="main-body">
          <ChildProfileScreen onComplete={handleChildProfileComplete} />
        </main>
      </div>
    );
  }

  // Nếu là phụ huynh và cần làm screener
  if (showScreener && currentUser.role === UserRole.PARENT && currentChild) {
    return (
      <div className="app-container">
        <header className="main-header">{/* ... */}</header>
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

  // --- RENDER CHÍNH ---
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
          ) : (
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
            </>
          )}
          
          <div className="user-info">
            <span className="user-name">{currentUser.name}</span>
            <span className="user-role">
              {currentUser.role === UserRole.PARENT ? '👨‍👩‍👧‍👦' : '👨‍⚕️'}
            </span>
            <button onClick={handleLogout} className="logout-btn" title="Đăng xuất">⎋</button>
          </div>
        </div>
      </header>

      <main className="main-body">
        {/* 🔹 MÀN HÌNH KIỂM TRA THIẾT BỊ */}
        {showAssessmentPrep ? (
          <AssessmentPrep
          onStartAssessment={handleDeviceCheckComplete}
          childName={currentChild?.name || childName}
        />
        ) : showParentReport && assessmentResult && currentChild ? (
          // 🔹 BÁO CÁO PHỤ HUYNH (dùng dữ liệu chuẩn hoá)
          <ParentReport 
            assessmentResult={assessmentResult}
            childName={currentChild.name}
            onBack={() => { setShowParentReport(false); setMode(AppMode.PATIENT); }}
          />
        ) : mode === AppMode.PATIENT ? (
          isSessionActive && currentProgramInfo ? (
            // 🔹 GAME ENGINE (sẽ bổ sung logic gateway games sau)
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
            // 🔹 MÀN HÌNH BẮT ĐẦU
            <StartScreen 
              childName={childName}
              setChildName={setChildName}
              selectedGroupId={selectedGroupId}
              setSelectedGroupId={setSelectedGroupId}
              onStartSession={handleStartSession}
              programInfo={PROGRAM_INFO}
              currentUser={currentUser}
              currentChild={currentChild}
            />
          )
        ) : (
          // 🔹 DASHBOARD CHUYÊN GIA (có thể cải thiện thêm)
          <div className="dashboard-wrapper">
             <div className="dashboard-header">
                <h2>Hồ sơ bệnh án điện tử</h2>
                <div className="stats-row">
                  <div className="stat-pill">Tổng Sessions: <b>{records.length}</b></div>
                  <div className="user-info-pill">
                    <span className="user-icon">
                      {currentUser.role === UserRole.PARENT ? '👨‍👩‍👧‍👦' : '👨‍⚕️'}
                    </span>
                    <span>{currentUser.name}</span>
                  </div>
                </div>
             </div>
             <ClinicianDashboard 
               records={records} 
               latestAnalysis={currentAnalysis}
               // Có thể truyền thêm assessmentResult để hiển thị Z-score, percentile
             />
          </div>
        )}
      </main>

      {/* CSS (giữ nguyên) */}
      <style>{` ... `}</style>
    </div>
  );
};

export default App;