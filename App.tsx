import React, { useState, useCallback } from 'react';
import { AppMode, BehavioralFeature, LongitudinalRecord, InferenceResult } from './types';
import { GameEngine } from './components/GameEngine';
import { ClinicianDashboard } from './components/ClinicianDashboard';
import { analyzeBehavioralPatterns } from './services/behaviorAnalysisService';
import inferenceService from './services/InferenceService'; 
import { THEMES } from './gameConfig'; 
import './styles.css';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.PATIENT);
  const [sessionFeatures, setSessionFeatures] = useState<BehavioralFeature[]>([]);
  
  // State quản lý luồng
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null); // THÊM STATE NÀY
  const [selectedAge, setSelectedAge] = useState<number | null>(null);

  const [records, setRecords] = useState<LongitudinalRecord[]>([
    { 
      id: '1', date: '2023-11-01', riskScore: 12, observations: ['Baseline'], features: [],
      metrics: { attention: 0.5, smile: 0.2, gazeStability: 0.6, engagement: 0.5 }
    }
  ]);
  
  const [currentAnalysis, setCurrentAnalysis] = useState<InferenceResult | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- MÀN HÌNH 1: CHỌN HÌNH ẢNH CỤ THỂ ---
  const ThemeSelection = () => (
    <div className="card" style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center' }}>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Bước 1: Chọn 1 hình ảnh bé thích nhất</h3>
      
      {/* Duyệt qua từng chủ đề */}
      {Object.values(THEMES).map((theme) => (
        <div key={theme.id} style={{ marginBottom: '2rem' }}>
            <h4 style={{ textAlign: 'left', marginLeft: '10px', color: '#64748b', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                {theme.name}
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
                {/* Duyệt qua từng hình ảnh trong chủ đề */}
                {theme.assets.map((asset) => (
                    <button 
                        key={asset}
                        className="nav-pill" 
                        style={{ 
                            fontSize: '3rem', 
                            padding: '1rem', 
                            border: '2px solid #e2e8f0',
                            backgroundColor: theme.background,
                            cursor: 'pointer',
                            minWidth: '80px',
                            transition: 'transform 0.2s'
                        }} 
                        onClick={() => {
                            setSelectedThemeId(theme.id);
                            setSelectedAsset(asset); // Lưu hình ảnh cụ thể
                        }}
                    >
                        {asset}
                    </button>
                ))}
            </div>
        </div>
      ))}
    </div>
  );

  // --- MÀN HÌNH 2: CHỌN TUỔI ---
  const AgeSelection = () => (
    <div className="card" style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
      <button onClick={() => { setSelectedThemeId(null); setSelectedAsset(null); }} style={{ float: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }}>⬅️ Quay lại</button>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', clear: 'both' }}>Bước 2: Chọn độ tuổi</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
         {/* Hiển thị hình đã chọn */}
         <div style={{ fontSize: '4rem', margin: '1rem 0' }}>{selectedAsset}</div>
         
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
      setSelectedAge(null); 
      setSelectedThemeId(null);
      setSelectedAsset(null); // Reset asset
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
          // --- LOGIC ĐIỀU HƯỚNG MỚI ---
          !selectedAsset ? ( // Kiểm tra đã chọn hình chưa
            <ThemeSelection />
          ) : !selectedAge ? (
            <AgeSelection />
          ) : (
            <GameEngine 
              age={selectedAge} 
              themeId={selectedThemeId || 'animals'}
              specificAsset={selectedAsset} // Truyền hình đã chọn vào
              onFeatureCapture={handleFeatureCapture} 
              onSessionEnd={handleSessionEnd} 
            />
          )
        ) : (
          <div className="animate-in">
             <div className="dashboard-header">
               {/* ... Giữ nguyên phần Dashboard ... */}
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