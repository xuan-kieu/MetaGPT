import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AppMode, BehavioralFeature, LongitudinalRecord, InferenceResult, UserRole, User, ChildProfile } from './types';
import GameEngine from './components/GameEngine';
import { ClinicianDashboard } from './components/ClinicianDashboard';
import { analyzeBehavioralPatterns } from './services/behaviorAnalysisService';
import inferenceService from './services/InferenceService';
import LoginScreen from './components/Auth/LoginScreen';
import ChildProfileScreen from './components/Onboarding/ChildProfile';
import Screener from './components/Assessment/Screener';
import './styles.css';

// --- CẤU HÌNH UI ---
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

// --- COMPONENT START SCREEN ---
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
  childName, 
  setChildName, 
  selectedGroupId, 
  setSelectedGroupId, 
  onStartSession,
  programInfo,
  currentUser,
  currentChild
}) => {
  const currentProgramInfo = selectedGroupId ? programInfo[selectedGroupId] : null;

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
      
      {currentUser.role === UserRole.PARENT && (
        <div className="input-group">
          <label>Tên bé (có thể thay đổi):</label>
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)} 
            placeholder={currentChild ? currentChild.name : "Nhập tên bé..."}
            className="name-input"
            autoFocus
          />
          {currentChild && (
            <p className="child-note">
              💡 Bé hiện tại: {currentChild.name}, {currentChild.gender === 'male' ? 'Nam' : currentChild.gender === 'female' ? 'Nữ' : 'Khác'}, {currentChild.age?.years || 0} tuổi {currentChild.age?.months || 0} tháng
            </p>
          )}
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
            <div className="age-match">
              {currentChild?.age && (
                <span className={`match-indicator ${
                  Math.abs(currentChild.age.years * 12 + currentChild.age.months - group.numericAge) <= 6 ? 'match-good' : 'match-fair'
                }`}>
                  {Math.abs(currentChild.age.years * 12 + currentChild.age.months - group.numericAge) <= 6 ? '✓ Phù hợp' : '∼ Có thể thử'}
                </span>
              )}
            </div>
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
          disabled={!selectedGroupId || (currentUser.role === UserRole.PARENT && !childName.trim() && !currentChild)}
          className="start-btn"
        >
          🚀 Bắt đầu Session
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
  const [isSessionActive, setIsSessionActive] = useState(false);
  
  // Dashboard State
  const [records, setRecords] = useState<LongitudinalRecord[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<InferenceResult | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Kiểm tra đăng nhập và load thông tin trẻ khi component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('neuropath_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        
        // Nếu là phụ huynh, load thông tin trẻ
        if (user.role === UserRole.PARENT) {
          const savedChild = localStorage.getItem('current_child');
          if (savedChild) {
            const child = JSON.parse(savedChild);
            setCurrentChild(child);
            setChildName(child.name);
            
            // Kiểm tra xem trẻ đã làm screener chưa
            const screenerResult = localStorage.getItem(`screener_${child.id}`);
            if (!screenerResult) {
              setShowScreener(true);
            }
          } else {
            // Nếu chưa có hồ sơ trẻ, hiển thị form thêm hồ sơ
            setShowChildProfile(true);
          }
        } else {
          // Nếu là clinician, mặc định vào dashboard
          setMode(AppMode.CLINICIAN);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleLogin = useCallback((role: UserRole, email?: string, name?: string) => {
    const user: User = {
      id: `user_${Date.now()}`,
      email: email || (role === UserRole.PARENT ? 'parent@example.com' : 'clinician@example.com'),
      name: name || (role === UserRole.PARENT ? 'Phụ huynh' : 'Chuyên gia'),
      role
    };
    
    setCurrentUser(user);
    localStorage.setItem('neuropath_user', JSON.stringify(user));
    
    // Nếu là phụ huynh, kiểm tra xem đã có hồ sơ trẻ chưa
    if (role === UserRole.PARENT) {
      const savedChild = localStorage.getItem('current_child');
      if (!savedChild) {
        setShowChildProfile(true);
      } else {
        const child = JSON.parse(savedChild);
        setCurrentChild(child);
        setChildName(child.name);
        
        // Kiểm tra screener
        const screenerResult = localStorage.getItem(`screener_${child.id}`);
        if (!screenerResult) {
          setShowScreener(true);
        }
      }
    } else {
      setMode(AppMode.CLINICIAN);
    }
  }, []);

  const handleChildProfileComplete = useCallback((childData: ChildProfile) => {
    setCurrentChild(childData);
    setChildName(childData.name);
    setShowChildProfile(false);
    
    // Lưu vào localStorage
    localStorage.setItem('current_child', JSON.stringify(childData));
    
    // Hiển thị screener ngay sau khi thêm hồ sơ
    setShowScreener(true);
  }, []);

  const handleScreenerComplete = useCallback((result: any) => {
    setShowScreener(false);
    
    if (currentChild) {
      // Lưu kết quả screener
      localStorage.setItem(`screener_${currentChild.id}`, JSON.stringify({
        ...result,
        childId: currentChild.id,
        completedAt: new Date().toISOString()
      }));
    }
  }, [currentChild]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('neuropath_user');
    localStorage.removeItem('current_child');
    setCurrentUser(null);
    setCurrentChild(null);
    setChildName('');
    setSelectedGroupId(null);
    setIsSessionActive(false);
    setShowScreener(false);
    setShowChildProfile(false);
    setMode(AppMode.PATIENT);
  }, []);

  const currentProgramInfo = useMemo(() => 
    selectedGroupId ? PROGRAM_INFO[selectedGroupId] : null, 
  [selectedGroupId]);

  const handleSessionEnd = useCallback(async (allFeatures: BehavioralFeature[]) => {
    console.log("🏁 Session Complete. Total Data Points:", allFeatures.length);
    setIsSessionActive(false);
    setIsAnalyzing(true);

    const processingFeatures = allFeatures.length > 0 ? allFeatures : [];

    try {
      const inferenceResult = await inferenceService.processStreamingData(processingFeatures);
      const behavioralAnalysis = await analyzeBehavioralPatterns(processingFeatures);
      
      const combinedAnalysis: InferenceResult = {
        patternId: `analysis-${Date.now()}`,
        explanation: behavioralAnalysis.explanation,
        behavioralTags: behavioralAnalysis.behavioralTags,
        behavioralClassification: behavioralAnalysis.behavioralClassification,
        confidence: 0.85,
        score: Math.round((inferenceResult.score + behavioralAnalysis.score) / 2),
        features: { ...behavioralAnalysis.features, inferenceScore: inferenceResult.score }
      };
      
      setCurrentAnalysis(combinedAnalysis);
      
      const feats = behavioralAnalysis.features;
      const newRecord: LongitudinalRecord = {
        id: `sess-${Date.now()}`,
        date: new Date().toISOString(),
        riskScore: combinedAnalysis.score,
        observations: [
            `Chương trình: ${currentProgramInfo?.label}`,
            ...combinedAnalysis.behavioralTags
        ],
        features: [],
        metrics: {
          attention: Number(feats.avgAttention) || 0,
          smile: Number(feats.avgSmile) || 0,
          gazeStability: Number(feats.gazeStability) || 0,
          engagement: Number(feats.engagementLevel) || 0
        },
        classification: behavioralAnalysis.behavioralClassification
      };
      
      setRecords(prev => [...prev, newRecord]);
      
      // Nếu là clinician, chuyển sang dashboard để xem kết quả
      if (currentUser?.role === UserRole.CLINICIAN) {
        setMode(AppMode.CLINICIAN);
      }
      
    } catch (error) {
      console.error("Analysis Failed:", error);
    } finally {
      setIsAnalyzing(false);
      setSelectedGroupId(null);
    }
  }, [currentProgramInfo, currentUser]);

  const handleFeatureStream = useCallback((feature: BehavioralFeature) => {
    // Stream logic
  }, []);

  // Nếu chưa đăng nhập, hiển thị màn hình đăng nhập
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Nếu là phụ huynh và chưa có hồ sơ trẻ, hiển thị màn hình thêm hồ sơ
  if (showChildProfile && currentUser.role === UserRole.PARENT) {
    return (
      <div className="app-container">
        <header className="main-header">
          <div className="brand">
            <div className="logo">NP</div>
            <h1>NeuroPath</h1>
          </div>
          <div className="nav-tabs">
            <div className="user-info">
              <span className="user-name">{currentUser.name}</span>
              <button 
                onClick={handleLogout}
                className="logout-btn"
                title="Đăng xuất"
              >
                ⎋
              </button>
            </div>
          </div>
        </header>
        
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
        <header className="main-header">
          <div className="brand">
            <div className="logo">NP</div>
            <h1>NeuroPath</h1>
          </div>
          <div className="nav-tabs">
            <div className="user-info">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role">
                👨‍👩‍👧‍👦
              </span>
              <button 
                onClick={handleLogout}
                className="logout-btn"
                title="Đăng xuất"
              >
                ⎋
              </button>
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
                onClick={() => { setMode(AppMode.PATIENT); setIsSessionActive(false); }} 
                className={mode === AppMode.PATIENT ? 'active' : ''}
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
                onClick={() => { setMode(AppMode.PATIENT); setIsSessionActive(false); }} 
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
            <button 
              onClick={handleLogout}
              className="logout-btn"
              title="Đăng xuất"
            >
              ⎋
            </button>
          </div>
        </div>
      </header>

      <main className="main-body">
        {mode === AppMode.PATIENT ? (
          isSessionActive && currentProgramInfo ? (
            <div className="game-wrapper">
              <GameEngine 
                age={currentProgramInfo.numericAge} 
                childName={childName}
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
              onStartSession={() => setIsSessionActive(true)}
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
                      {currentUser.role === UserRole.PARENT ? '👨‍👩‍👧‍👦' : '👨‍⚕️'}
                    </span>
                    <span>{currentUser.name}</span>
                  </div>
                </div>
             </div>
             <ClinicianDashboard records={records} latestAnalysis={currentAnalysis} />
          </div>
        )}
      </main>

      <style>{`
        .app-container { font-family: 'Segoe UI', sans-serif; background: #f8fafc; min-height: 100vh; display: flex; flexDirection: column; }
        .main-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .brand { display: flex; align-items: center; gap: 10px; }
        .logo { background: #6366f1; color: white; padding: 5px 10px; border-radius: 6px; font-weight: bold; }
        .nav-tabs { display: flex; align-items: center; gap: 1rem; }
        .nav-tabs button { background: none; border: none; padding: 0.5rem 1rem; cursor: pointer; color: #64748b; font-weight: 600; transition: all 0.2s; }
        .nav-tabs button.active { color: #6366f1; background: #e0e7ff; border-radius: 20px; }
        .nav-tabs button:hover:not(.active) { background: #f1f5f9; border-radius: 20px; }
        
        .child-profile-btn { background: #dbeafe; color: #1d4ed8; }
        .child-profile-btn:hover { background: #bfdbfe; }
        
        .user-info { display: flex; align-items: center; gap: 0.5rem; background: #f1f5f9; padding: 0.5rem 1rem; border-radius: 20px; }
        .user-name { font-weight: 600; color: #334155; }
        .user-role { background: #e0e7ff; color: #6366f1; padding: 2px 8px; border-radius: 12px; font-size: 0.9rem; }
        .logout-btn { background: none; border: none; cursor: pointer; font-size: 1.2rem; color: #64748b; padding: 0 0.5rem; }
        .logout-btn:hover { color: #ef4444; }
        
        .user-welcome { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding: 1rem; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; color: white; }
        .welcome-left { display: flex; flex-direction: column; gap: 0.5rem; }
        .welcome-text { font-size: 1.2rem; font-weight: 600; }
        .user-role-badge { background: rgba(255,255,255,0.2); padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.9rem; align-self: flex-start; }
        .current-child-info { display: flex; flex-direction: column; align-items: flex-end; gap: 0.3rem; }
        .child-label { font-size: 0.9rem; opacity: 0.9; }
        .child-name { font-weight: 600; font-size: 1.1rem; }
        
        .clinician-note { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 2rem; padding: 1.5rem; background: #fef3c7; border: 1px solid #fbbf24; border-radius: 12px; }
        .note-icon { font-size: 2rem; }
        .note-content { flex: 1; color: #92400e; }
        
        .setup-container { max-width: 900px; margin: 2rem auto; padding: 2rem; background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .setup-title { text-align: center; margin-bottom: 2rem; color: #1e293b; }
        .input-group { margin-bottom: 2rem; text-align: left; max-width: 400px; margin-left: auto; margin-right: auto; }
        .input-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #475569; }
        .name-input { width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 1rem; }
        .child-note { margin-top: 0.5rem; font-size: 0.9rem; color: #64748b; background: #f8fafc; padding: 0.5rem; border-radius: 6px; }
        
        .program-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .program-card { padding: 1.5rem; border: 1px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: white; text-align: left; position: relative; }
        .program-card:hover { transform: translateY(-2px); border-color: #cbd5e1; }
        .program-card.selected { border: 2px solid #6366f1; background: #eff6ff; box-shadow: 0 4px 10px rgba(99, 102, 241, 0.15); }
        .card-header { display: flex; justify-content: space-between; font-weight: 700; color: #334155; font-size: 1.1rem; margin-bottom: 0.5rem; }
        .card-meta { font-size: 0.9rem; color: #64748b; margin-bottom: 0.5rem; }
        .card-desc { color: #0f172a; margin-bottom: 0.5rem; }
        .age-match { margin-top: 0.5rem; }
        .match-indicator { font-size: 0.8rem; padding: 0.2rem 0.6rem; border-radius: 12px; }
        .match-good { background: #d1fae5; color: #065f46; }
        .match-fair { background: #fef3c7; color: #92400e; }
        
        .preview-box { background: #f1f5f9; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; text-align: left; }
        .tags-container { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .game-tag { background: white; padding: 6px 12px; border-radius: 20px; border: 1px solid #cbd5e1; font-size: 0.9rem; color: #475569; }
        
        .session-actions { display: flex; flex-direction: column; gap: 1rem; align-items: center; }
        .start-btn { width: 100%; max-width: 350px; padding: 1.2rem; background: #6366f1; color: white; border: none; border-radius: 8px; font-size: 1.2rem; font-weight: bold; cursor: pointer; display: block; margin: 0 auto; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.3); }
        .start-btn:disabled { background: #cbd5e1; cursor: not-allowed; box-shadow: none; }
        .manage-profiles-btn { background: none; border: 2px solid #cbd5e1; color: #64748b; padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .manage-profiles-btn:hover { background: #f1f5f9; }
        
        .game-wrapper { width: 100%; height: calc(100vh - 80px); }
        .analysis-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.9); z-index: 999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .loading-box { text-align: center; background: white; padding: 3rem; border-radius: 16px; box-shadow: 0 20px 25px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .spinner { width: 50px; height: 50px; border: 4px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .dashboard-wrapper { padding: 2rem; }
        .dashboard-header { margin-bottom: 2rem; }
        .stats-row { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; }
        .stat-pill { background: #e0e7ff; color: #6366f1; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem; }
        .user-info-pill { display: flex; align-items: center; gap: 0.5rem; background: #f1f5f9; padding: 0.5rem 1rem; border-radius: 20px; }
        .user-icon { font-size: 1.2rem; }
        
        .screener-header-info { margin-bottom: 2rem; text-align: center; }
        .screener-header-info h2 { margin-bottom: 1rem; color: #1e293b; }
        .child-info-badge { display: inline-flex; gap: 1rem; background: #e0e7ff; padding: 0.8rem 1.5rem; border-radius: 20px; color: #6366f1; font-weight: 600; }
      `}</style>
    </div>
  );
};

export default App;