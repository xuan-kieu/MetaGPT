import React, { useState, useCallback } from 'react';
import { AppMode, BehavioralFeature, LongitudinalRecord, InferenceResult } from './types';
import { GameEngine } from './components/GameEngine';
import { ClinicianDashboard } from './components/ClinicianDashboard';
import { analyzeBehavioralPatterns } from './services/geminiService';
import inferenceService from './services/InferenceService'; 

// Đừng quên import file CSS của bạn
import './style.css'; 

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.PATIENT);
  const [sessionFeatures, setSessionFeatures] = useState<BehavioralFeature[]>([]);
  
  // Dữ liệu mẫu (giữ nguyên logic của bạn)
  const [records, setRecords] = useState<LongitudinalRecord[]>([
    { id: '1', date: '2023-11-01', riskScore: 12, observations: [], features: [] },
    { id: '2', date: '2023-11-15', riskScore: 28, observations: [], features: [] },
    { id: '3', date: '2023-12-05', riskScore: 18, observations: [], features: [] },
  ]);
  
  const [currentAnalysis, setCurrentAnalysis] = useState<InferenceResult | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFeatureCapture = useCallback((feature: BehavioralFeature) => {
    setSessionFeatures(prev => [...prev, feature]);
  }, []);

  const handleSessionEnd = async () => {
    setIsAnalyzing(true);
    // Chuyển ngay sang màn hình dashboard để hiện loading
    setMode(AppMode.CLINICIAN); 
    
    try {
      // Logic xử lý AI (Giữ nguyên code của bạn)
      const inferenceResult = await inferenceService.processStreamingData(sessionFeatures);
      const finalScore = inferenceResult.score;
      
      const analysis = await analyzeBehavioralPatterns(sessionFeatures);
      setCurrentAnalysis(analysis);
      
      const newRecord: LongitudinalRecord = {
        id: Math.random().toString(),
        date: new Date().toISOString(),
        riskScore: finalScore,
        observations: [analysis.explanation],
        features: sessionFeatures
      };
      setRecords(prev => [...prev, newRecord]);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
      setSessionFeatures([]);
    }
  };

  return (
    <div className="app-container">
      {/* --- HEADER --- */}
      <header className="main-header">
        <div className="logo-section">
          <div className="logo-box">NP</div>
          <div className="logo-text">
            <h1>NeuroPath</h1>
            <div className="logo-subtext">AI Developmental System</div>
          </div>
        </div>

        <div className="nav-controls">
          <div className="privacy-wall">
            <div className="privacy-dot"></div>
            Privacy Wall Active: No Raw Data Egress
          </div>
          
          <div className="nav-pill-group">
            <button 
              onClick={() => setMode(AppMode.PATIENT)}
              className={`nav-pill ${mode === AppMode.PATIENT ? 'active' : ''}`}
            >
              Patient App
            </button>
            <button 
              onClick={() => setMode(AppMode.CLINICIAN)}
              className={`nav-pill ${mode === AppMode.CLINICIAN ? 'active' : ''}`}
            >
              Clinician Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="main-content">
        {mode === AppMode.PATIENT ? (
          <GameEngine 
            onFeatureCapture={handleFeatureCapture} 
            onSessionEnd={handleSessionEnd}
          />
        ) : (
          <div className="animate-in fade-in duration-700">
             {/* Header Dashboard */}
            <div className="game-header" style={{ marginBottom: '2rem' }}>
              <h2>Clinical Overview</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p>Subject: ANON_ID_{records.length + 1000}</p>
                {isAnalyzing && (
                  <span className="loading-indicator">
                    <div className="spinner"></div>
                    Running AI Analysis...
                  </span>
                )}
              </div>
            </div>
            
            <ClinicianDashboard 
              records={records} 
              latestAnalysis={currentAnalysis}
            />
          </div>
        )}
      </main>

      {/* --- FOOTER --- */}
      <footer className="main-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>System Architecture</h4>
            <ul className="footer-list">
              <li><span className="bullet">•</span> <strong>Stimulus Engine:</strong> Randomized visual tasks triggers behavioral responses.</li>
              <li><span className="bullet">•</span> <strong>Local Feature Extractor:</strong> ML-based landmarking occurs entirely in-browser.</li>
              <li><span className="bullet">•</span> <strong>L-TCN Inference:</strong> Temporal Convolutional Network analyzes variance across timestamps.</li>
            </ul>
          </div>
          <div className="disclaimer-box">
            <h4>Legal Disclaimer</h4>
            <p>This system is for research and screening assistance only. It does not provide diagnostic labels or medical advice. Results should be interpreted by qualified professionals within the context of comprehensive clinical assessment.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;