import React, { useState, useCallback, useMemo } from 'react';
import { AppMode, BehavioralFeature, LongitudinalRecord, InferenceResult } from './types';
import GameEngine from './components/GameEngine';
import { ClinicianDashboard } from './components/ClinicianDashboard';
import { analyzeBehavioralPatterns } from './services/behaviorAnalysisService';
import inferenceService from './services/InferenceService'; 
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

// --- TÁCH COMPONENT START SCREEN RA NGOÀI ---
// Việc này giúp React không hủy/tạo lại input khi gõ phím
interface StartScreenProps {
  childName: string;
  setChildName: (name: string) => void;
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string) => void;
  onStartSession: () => void;
  programInfo: Record<string, AgeGroupInfo>;
}

const StartScreen: React.FC<StartScreenProps> = ({ 
  childName, 
  setChildName, 
  selectedGroupId, 
  setSelectedGroupId, 
  onStartSession,
  programInfo
}) => {
  const currentProgramInfo = selectedGroupId ? programInfo[selectedGroupId] : null;

  return (
    <div className="setup-container">
      <h2 className="setup-title">Thiết lập buổi đánh giá</h2>
      
      <div className="input-group">
        <label>Tên bé:</label>
        <input
          type="text"
          value={childName}
          // React xử lý tốt tiếng Việt ở đây nếu component không bị unmount
          onChange={(e) => setChildName(e.target.value)} 
          placeholder="Nhập tên bé (Ví dụ: Bé An)..."
          className="name-input"
          autoFocus // Tự động focus khi vào màn hình
        />
      </div>

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

      <button
        onClick={onStartSession}
        disabled={!selectedGroupId || !childName.trim()}
        className="start-btn"
      >
        🚀 Bắt đầu Session
      </button>
    </div>
  );
};

// --- APP CHÍNH ---
const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.PATIENT);
  
  // State
  const [childName, setChildName] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  
  // Dashboard State
  const [records, setRecords] = useState<LongitudinalRecord[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<InferenceResult | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const currentProgramInfo = useMemo(() => 
    selectedGroupId ? PROGRAM_INFO[selectedGroupId] : null, 
  [selectedGroupId]);

  const handleSessionEnd = useCallback(async (allFeatures: BehavioralFeature[]) => {
    console.log("🏁 Session Complete. Total Data Points:", allFeatures.length);
    setIsSessionActive(false);
    setIsAnalyzing(true);
    setMode(AppMode.CLINICIAN);

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
      
    } catch (error) {
      console.error("Analysis Failed:", error);
    } finally {
      setIsAnalyzing(false);
      setChildName('');
      setSelectedGroupId(null);
    }
  }, [currentProgramInfo]);

  const handleFeatureStream = useCallback((feature: BehavioralFeature) => {
    // Stream logic
  }, []);

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
          <button 
            onClick={() => { setMode(AppMode.PATIENT); setIsSessionActive(false); }} 
            className={mode === AppMode.PATIENT ? 'active' : ''}
          >
            Patient App
          </button>
          <button 
            onClick={() => setMode(AppMode.CLINICIAN)} 
            className={mode === AppMode.CLINICIAN ? 'active' : ''}
          >
            Dashboard
          </button>
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
            // Gọi Component đã tách ra ở đây
            <StartScreen 
              childName={childName}
              setChildName={setChildName}
              selectedGroupId={selectedGroupId}
              setSelectedGroupId={setSelectedGroupId}
              onStartSession={() => setIsSessionActive(true)}
              programInfo={PROGRAM_INFO}
            />
          )
        ) : (
          <div className="dashboard-wrapper">
             <div className="dashboard-header">
                <h2>Hồ sơ bệnh án điện tử</h2>
                <div className="stats-row">
                  <div className="stat-pill">Tổng Sessions: <b>{records.length}</b></div>
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
        .nav-tabs button { background: none; border: none; padding: 0.5rem 1rem; margin-left: 10px; cursor: pointer; color: #64748b; font-weight: 600; }
        .nav-tabs button.active { color: #6366f1; background: #e0e7ff; border-radius: 20px; }
        .setup-container { max-width: 900px; margin: 2rem auto; padding: 2rem; background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .setup-title { text-align: center; margin-bottom: 2rem; color: #1e293b; }
        .input-group { margin-bottom: 2rem; text-align: left; max-width: 400px; margin-left: auto; margin-right: auto; }
        .input-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #475569; }
        .name-input { width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 1rem; }
        .program-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .program-card { padding: 1.5rem; border: 1px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: white; text-align: left; }
        .program-card:hover { transform: translateY(-2px); border-color: #cbd5e1; }
        .program-card.selected { border: 2px solid #6366f1; background: #eff6ff; box-shadow: 0 4px 10px rgba(99, 102, 241, 0.15); }
        .card-header { display: flex; justify-content: space-between; font-weight: 700; color: #334155; font-size: 1.1rem; margin-bottom: 0.5rem; }
        .card-meta { font-size: 0.9rem; color: #64748b; margin-bottom: 0.5rem; }
        .card-desc { color: #0f172a; }
        .preview-box { background: #f1f5f9; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; text-align: left; }
        .tags-container { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .game-tag { background: white; padding: 6px 12px; border-radius: 20px; border: 1px solid #cbd5e1; font-size: 0.9rem; color: #475569; }
        .start-btn { width: 100%; max-width: 350px; padding: 1.2rem; background: #6366f1; color: white; border: none; border-radius: 8px; font-size: 1.2rem; font-weight: bold; cursor: pointer; display: block; margin: 0 auto; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.3); }
        .start-btn:disabled { background: #cbd5e1; cursor: not-allowed; box-shadow: none; }
        .game-wrapper { width: 100%; height: calc(100vh - 80px); }
        .analysis-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.9); z-index: 999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .loading-box { text-align: center; background: white; padding: 3rem; border-radius: 16px; box-shadow: 0 20px 25px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .spinner { width: 50px; height: 50px; border: 4px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default App;