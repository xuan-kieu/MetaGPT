import React, { useState, useCallback } from 'react';
import { AppMode, BehavioralFeature, LongitudinalRecord, InferenceResult } from './types';
import { GameEngine } from './components/GameEngine';
import { ClinicianDashboard } from './components/ClinicianDashboard';
import { analyzeBehavioralPatterns } from './services/behaviorAnalysisService';
import inferenceService from './services/InferenceService'; 
import './styles.css';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.PATIENT);
  const [sessionFeatures, setSessionFeatures] = useState<BehavioralFeature[]>([]);
  
  // Trong App.tsx

  const [records, setRecords] = useState<LongitudinalRecord[]>([
    { 
      id: '1', 
      date: '2023-11-01', 
      riskScore: 12, 
      observations: ['Initial baseline session'], 
      features: [],
      // Sửa số liệu mẫu 1
      metrics: { attention: 0.5, smile: 0.2, gazeStability: 0.6, engagement: 0.5 }
    },
    { 
      id: '2', 
      date: '2023-11-15', 
      riskScore: 28, 
      observations: ['Increased variability in attention patterns'], 
      features: [],
      // Sửa số liệu mẫu 2 (Khác hẳn mẫu 1)
      metrics: { attention: 0.8, smile: 0.7, gazeStability: 0.9, engagement: 0.85 }
    }
  ]);
  
  const [currentAnalysis, setCurrentAnalysis] = useState<InferenceResult | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFeatureCapture = useCallback((feature: BehavioralFeature) => {
    setSessionFeatures(prev => [...prev, feature]);
  }, []);

  const handleSessionEnd = async (features: BehavioralFeature[]) => {
    setIsAnalyzing(true);
    setMode(AppMode.CLINICIAN);
    
    try {
      const inferenceResult = await inferenceService.processStreamingData(features);
      const behavioralAnalysis = await analyzeBehavioralPatterns(features);
      const combinedScore = Math.round((inferenceResult.score + behavioralAnalysis.score) / 2);
      
      const combinedAnalysis: InferenceResult = {
        patternId: `analysis-${Date.now()}`,
        explanation: behavioralAnalysis.explanation,
        behavioralTags: behavioralAnalysis.behavioralTags,
        behavioralClassification: behavioralAnalysis.behavioralClassification,
        confidence: Math.round((inferenceResult.confidence + behavioralAnalysis.confidence) / 2 * 100) / 100,
        score: combinedScore,
        features: { ...behavioralAnalysis.features, inferenceScore: inferenceResult.score }
      };
      
      setCurrentAnalysis(combinedAnalysis);
      
      const feats = behavioralAnalysis.features;
      const newRecord: LongitudinalRecord = {
        id: `session-${Date.now()}`,
        date: new Date().toISOString(),
        riskScore: combinedAnalysis.score,
        observations: [combinedAnalysis.explanation],
        features: features.slice(-50),
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
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
      setSessionFeatures([]);
    }
  };

  return (
    <div className="app-container">
      {/* Loading Overlay */}
      {isAnalyzing && (
        <div className="analysis-status-overlay">
          <div className="analysis-status-content">
            <div className="spinner-large"></div>
            <h3>Analyzing Behavioral Patterns</h3>
            <p style={{ color: '#6b7280', margin: '0.5rem 0' }}>Processing biometric data...</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      )}
      
      <header className="main-header">
        <div className="logo-section">
          <div className="logo-box">NP</div>
          <div className="logo-text">
            <h1>NeuroPath</h1>
            <div className="logo-subtext">Local AI Screening</div>
          </div>
        </div>

        <div className="nav-controls">
          <div className="privacy-wall">
            <div className="privacy-dot"></div>
            <span>Offline Processing</span>
          </div>
          
          <div className="nav-pill-group">
            <button 
              onClick={() => setMode(AppMode.PATIENT)}
              className={`nav-pill ${mode === AppMode.PATIENT ? 'active' : ''}`}
              disabled={isAnalyzing}
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

      <main className="main-content">
        {mode === AppMode.PATIENT ? (
          <GameEngine onFeatureCapture={handleFeatureCapture} onSessionEnd={handleSessionEnd} />
        ) : (
          <div className="animate-in">
            <div className="dashboard-header">
              <div className="dashboard-title">
                <h2>Clinical Overview</h2>
                <div className="subject-info">
                  <span className="subject-label">Subject ID:</span>
                  <span className="subject-id">ANON_{records.length + 1000}</span>
                </div>
              </div>
              <div className="dashboard-stats">
                 <div className="stat-card">
                   <div className="stat-value">{records.length}</div>
                   <div className="stat-label">Sessions</div>
                 </div>
                 <div className="stat-card">
                   <div className="stat-value">{currentAnalysis?.score || '--'}</div>
                   <div className="stat-label">Last Score</div>
                 </div>
                 <div className="stat-card">
                   <div className="stat-value">{Math.round(records.reduce((a,b)=>a+b.riskScore,0)/records.length)}</div>
                   <div className="stat-label">Avg Score</div>
                 </div>
              </div>
            </div>
            
            <ClinicianDashboard records={records} latestAnalysis={currentAnalysis} />
          </div>
        )}
      </main>

      <footer className="main-footer">
        <div className="footer-content">
           <div className="footer-section">
              <h4>System Status</h4>
              <ul className="footer-list">
                 <li><span className="bullet">•</span> Engine: TensorFlow.js (Local)</li>
                 <li><span className="bullet">•</span> Privacy: Air-gapped capable</li>
              </ul>
           </div>
           <div className="disclaimer-box">
              <h4>Disclaimer</h4>
              <p>This tool is for observational screening only and does not provide medical diagnoses.</p>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;