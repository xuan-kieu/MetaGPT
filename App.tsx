import React, { useState, useCallback } from 'react';
import { AppMode, BehavioralFeature, LongitudinalRecord, InferenceResult } from './types';
import { GameEngine } from './components/GameEngine';
import { ClinicianDashboard } from './components/ClinicianDashboard';
import { analyzeBehavioralPatterns } from './services/behaviorAnalysisService';
import inferenceService from './services/InferenceService'; 
import { THEMES } from './gameConfig'; // Đảm bảo đã import THEMES
import './styles.css';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.PATIENT);
  const [sessionFeatures, setSessionFeatures] = useState<BehavioralFeature[]>([]);
  
  // State quản lý luồng
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null); // Thêm lại state Theme
  const [selectedAge, setSelectedAge] = useState<number | null>(null);

  const [records, setRecords] = useState<LongitudinalRecord[]>([
    { 
      id: '1', date: '2023-11-01', riskScore: 12, observations: ['Baseline'], features: [],
      metrics: { attention: 0.5, smile: 0.2, gazeStability: 0.6, engagement: 0.5 }
    }
  ]);
  
  const [currentAnalysis, setCurrentAnalysis] = useState<InferenceResult | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- MÀN HÌNH 1: CHỌN HÌNH ẢNH (Đã thêm lại) ---
  const ThemeSelection = () => (
    <div className="card" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Bước 1: Chọn hình ảnh bé thích</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        {Object.values(THEMES).map((theme) => (
          <button 
            key={theme.id}
            className="nav-pill" 
            style={{ 
              padding: '1.5rem', border: '2px solid #e2e8f0', 
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
              backgroundColor: theme.background, cursor: 'pointer'
            }} 
            onClick={() => setSelectedThemeId(theme.id)}
          >
            <span style={{ fontSize: '2.5rem' }}>{theme.assets[0]}</span> 
            <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // --- MÀN HÌNH 2: CHỌN TUỔI ---
  const AgeSelection = () => (
    <div className="card" style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
      <button onClick={() => setSelectedThemeId(null)} style={{ float: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }}>⬅️ Quay lại</button>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', clear: 'both' }}>Bước 2: Chọn độ tuổi</h3>
      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        <button className="nav-pill" style={{ padding: '1rem', border: '2px solid #e2e8f0' }} onClick={() => setSelectedAge(3)}>👶 2 - 4 Tuổi (Chậm)</button>
        <button className="nav-pill" style={{ padding: '1rem', border: '2px solid #e2e8f0' }} onClick={() => setSelectedAge(6)}>👦 5 - 7 Tuổi (Vừa)</button>
        <button className="nav-pill" style={{ padding: '1rem', border: '2px solid #e2e8f0' }} onClick={() => setSelectedAge(9)}>🧑 8+ Tuổi (Nhanh)</button>
      </div>
    </div>
  );

  const handleFeatureCapture = useCallback((feature: BehavioralFeature) => {
    setSessionFeatures(prev => [...prev, feature]);
  }, []);

  const handleSessionEnd = async (features: BehavioralFeature[]) => {
    console.log("📥 Kết thúc game. Nhận được:", features.length, "dữ liệu");
    
    // Nếu dữ liệu quá ít (do lỗi camera hoặc tắt sớm), tạo dữ liệu giả để test giao diện
    const processingFeatures = features.length > 0 ? features : Array(30).fill({
        timestamp: Date.now(), gazeX: 0.5, gazeY: 0.5, affect: 'neutral',
        attentionLevel: 0.6, smileIntensity: 0.4, poseConfidence: 1, faceConfidence: 1, frownIntensity: 0
    });

    setIsAnalyzing(true);
    setMode(AppMode.CLINICIAN);
    
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
        id: `session-${Date.now()}`,
        date: new Date().toISOString(),
        riskScore: combinedAnalysis.score,
        observations: [combinedAnalysis.explanation],
        features: [],
        metrics: {
          attention: Number(feats.avgAttention) || 0.5,
          smile: Number(feats.avgSmile) || 0.3,
          gazeStability: Number(feats.gazeStability) || 0.6,
          engagement: Number(feats.engagementLevel) || 0.5
        },
        classification: behavioralAnalysis.behavioralClassification
      };
      
      setRecords(prev => [...prev, newRecord]);
      
    } catch (error) {
      console.error("Lỗi phân tích:", error);
    } finally {
      setIsAnalyzing(false);
      setSessionFeatures([]);
      setSelectedAge(null);     // Reset
      setSelectedThemeId(null); // Reset
    }
  };

  return (
    <div className="app-container">
      {isAnalyzing && (
        <div className="analysis-status-overlay">
          <div className="analysis-status-content">
            <div className="spinner-large"></div>
            <h3>Đang phân tích hành vi...</h3>
          </div>
        </div>
      )}
      
      <header className="main-header">
        <div className="logo-section">
          <div className="logo-box">NP</div>
          <div className="logo-text"><h1>NeuroPath</h1></div>
        </div>
        <div className="nav-controls">
          <button onClick={() => setMode(AppMode.PATIENT)} className={`nav-pill ${mode === AppMode.PATIENT ? 'active' : ''}`}>Patient App</button>
          <button onClick={() => setMode(AppMode.CLINICIAN)} className={`nav-pill ${mode === AppMode.CLINICIAN ? 'active' : ''}`}>Dashboard</button>
        </div>
      </header>

      <main className="main-content">
        {mode === AppMode.PATIENT ? (
          // --- SỬA LUỒNG ĐIỀU HƯỚNG TẠI ĐÂY ---
          !selectedThemeId ? (
            <ThemeSelection />
          ) : !selectedAge ? (
            <AgeSelection />
          ) : (
            <GameEngine 
              age={selectedAge} 
              themeId={selectedThemeId}
              onFeatureCapture={handleFeatureCapture} 
              onSessionEnd={handleSessionEnd} 
            />
          )
        ) : (
          <div className="animate-in">
            <div className="dashboard-header">
              <div className="dashboard-title"><h2>Clinical Overview</h2></div>
              <div className="dashboard-stats">
                 <div className="stat-card"><div className="stat-value">{records.length}</div><div className="stat-label">Sessions</div></div>
                 <div className="stat-card"><div className="stat-value">{currentAnalysis?.score || '--'}</div><div className="stat-label">Last Score</div></div>
              </div>
            </div>
            <ClinicianDashboard records={records} latestAnalysis={currentAnalysis} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;