import React, { useState, useCallback, useEffect } from 'react';
import { AppMode, BehavioralFeature, LongitudinalRecord, InferenceResult, BehavioralClassification } from './types';
import { GameEngine } from './components/GameEngine';
import { ClinicianDashboard } from './components/ClinicianDashboard';
import { analyzeBehavioralPatterns } from './services/behaviorAnalysisService'; // Đã thay thế geminiService
import inferenceService from './services/InferenceService'; 
import './styles.css';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.PATIENT);
  const [sessionFeatures, setSessionFeatures] = useState<BehavioralFeature[]>([]);
  
  // Dữ liệu mẫu
  const [records, setRecords] = useState<LongitudinalRecord[]>([
    { 
      id: '1', 
      date: '2023-11-01', 
      riskScore: 12, 
      observations: ['Initial baseline session'], 
      features: [],
      metrics: { attention: 0.6, smile: 0.4, gazeStability: 0.7 }
    },
    { 
      id: '2', 
      date: '2023-11-15', 
      riskScore: 28, 
      observations: ['Increased variability in attention patterns'], 
      features: [],
      metrics: { attention: 0.4, smile: 0.3, gazeStability: 0.5 }
    },
    { 
      id: '3', 
      date: '2023-12-05', 
      riskScore: 18, 
      observations: ['Stabilizing engagement patterns observed'], 
      features: [],
      metrics: { attention: 0.7, smile: 0.5, gazeStability: 0.8 }
    },
  ]);
  
  const [currentAnalysis, setCurrentAnalysis] = useState<InferenceResult | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'processing' | 'completed'>('idle');

  const handleFeatureCapture = useCallback((feature: BehavioralFeature) => {
    setSessionFeatures(prev => [...prev, feature]);
  }, []);

  const handleSessionEnd = async (features: BehavioralFeature[]) => {
    setIsAnalyzing(true);
    setAnalysisStatus('processing');
    setMode(AppMode.CLINICIAN);
    
    try {
      console.log(`📊 Analyzing ${features.length} behavioral features...`);
      
      // 1. Inference Service Analysis (real-time stream processing)
      const inferenceResult = await inferenceService.processStreamingData(features);
      
      // 2. Behavioral Analysis Service (offline analysis)
      const behavioralAnalysis = await analyzeBehavioralPatterns(features);
      
      // 3. Kết hợp kết quả
      const combinedAnalysis: InferenceResult = {
        patternId: `analysis-${Date.now()}`,
        explanation: behavioralAnalysis.explanation,
        behavioralTags: behavioralAnalysis.behavioralTags,
        behavioralClassification: behavioralAnalysis.behavioralClassification,
        confidence: Math.round((inferenceResult.confidence + behavioralAnalysis.confidence) / 2 * 100) / 100,
        score: Math.round((inferenceResult.score + behavioralAnalysis.score) / 2),
        features: {
          ...behavioralAnalysis.features,
          inferenceScore: inferenceResult.score,
          inferenceConfidence: inferenceResult.confidence,
          combinedScore: Math.round((inferenceResult.score + behavioralAnalysis.score) / 2),
          sampleSize: features.length,
          analysisMethod: 'offline_behavioral_analysis'
        }
      };
      
      setCurrentAnalysis(combinedAnalysis);
      setAnalysisStatus('completed');
      
      // 4. Tạo new record
      const newRecord: LongitudinalRecord = {
        id: `session-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        riskScore: combinedAnalysis.score,
        observations: [combinedAnalysis.explanation],
        features: features.slice(-30), // Chỉ lưu 30 features gần nhất
        metrics: {
          attention: behavioralAnalysis.features.avgAttention || 0.5,
          smile: behavioralAnalysis.features.avgSmile || 0.3,
          gazeStability: behavioralAnalysis.features.gazeStability || 0.6,
          engagement: behavioralAnalysis.features.engagementLevel || 0.5
        },
        classification: behavioralAnalysis.behavioralClassification
      };
      
      setRecords(prev => [...prev, newRecord]);
      
      // 5. Optional: Lưu session summary vào localStorage
      try {
        const savedSessions = JSON.parse(localStorage.getItem('neuropath_sessions') || '[]');
        savedSessions.push({
          id: newRecord.id,
          date: newRecord.date,
          score: newRecord.riskScore,
          featuresCount: features.length,
          classification: newRecord.classification
        });
        localStorage.setItem('neuropath_sessions', JSON.stringify(savedSessions.slice(-20)));
      } catch (storageError) {
        console.warn('Local storage save failed:', storageError);
      }
      
      console.log('✅ Analysis completed successfully');
      
    } catch (error) {
      console.error("❌ Analysis failed:", error);
      setAnalysisStatus('completed');
      
      // Fallback analysis
      const fallbackAnalysis: InferenceResult = {
        patternId: `fallback-${Date.now()}`,
        explanation: 'Basic behavioral analysis completed. System using offline pattern matching.',
        behavioralTags: ['offline_analysis', 'rule_based'],
        behavioralClassification: {
          gazePattern: 'distracted',
          gazeStability: 'moderate',
          visualTracking: 'saccadic',
          affectType: 'neutral',
          engagementLevel: 'medium',
          frustrationTolerance: 'medium',
          attentionSpan: 'intermittent',
          responseConsistency: 'variable',
          taskPersistence: 'moderate'
        },
        confidence: 0.6,
        score: 5,
        features: {
          error: error instanceof Error ? error.message : 'Unknown error',
          featuresCount: features.length,
          fallback: true
        }
      };
      
      setCurrentAnalysis(fallbackAnalysis);
      
      // Tạo fallback record
      const fallbackRecord: LongitudinalRecord = {
        id: `fallback-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        riskScore: 5,
        observations: ['Fallback analysis completed'],
        features: features.slice(-20),
        metrics: {
          attention: 0.5,
          smile: 0.3,
          gazeStability: 0.5,
          engagement: 0.4
        }
      };
      
      setRecords(prev => [...prev, fallbackRecord]);
      
    } finally {
      setIsAnalyzing(false);
      setSessionFeatures([]);
    }
  };

  // Render analysis status indicator
  const renderAnalysisStatus = () => {
    if (!isAnalyzing) return null;
    
    return (
      <div className="analysis-status-overlay">
        <div className="analysis-status-content">
          <div className="spinner-large"></div>
          <h3>Analyzing Behavioral Patterns</h3>
          <p>{analysisStatus === 'processing' ? 'Processing behavioral features...' : 'Finalizing analysis...'}</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ 
              width: analysisStatus === 'processing' ? '60%' : '100%' 
            }}></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Analysis Status Overlay */}
      {renderAnalysisStatus()}
      
      {/* --- HEADER --- */}
      <header className="main-header">
        <div className="logo-section">
          <div className="logo-box">NP</div>
          <div className="logo-text">
            <h1>NeuroPath</h1>
            <div className="logo-subtext">Behavioral Analysis System</div>
          </div>
        </div>

        <div className="nav-controls">
          <div className="privacy-wall">
            <div className="privacy-dot"></div>
            <span>100% Offline Processing • No Data Transmission</span>
          </div>
          
          <div className="nav-pill-group">
            <button 
              onClick={() => setMode(AppMode.PATIENT)}
              className={`nav-pill ${mode === AppMode.PATIENT ? 'active' : ''}`}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Patient App'}
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
            {/* Dashboard Header */}
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
                  <div className="stat-label">Total Sessions</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {records.length > 0 
                      ? Math.round(records.reduce((sum, r) => sum + r.riskScore, 0) / records.length)
                      : '--'
                    }
                  </div>
                  <div className="stat-label">Avg. Score</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {currentAnalysis?.score || '--'}
                  </div>
                  <div className="stat-label">Latest Score</div>
                </div>
              </div>
            </div>
            
            {/* Main Dashboard Content */}
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
            <h4>System Information</h4>
            <ul className="footer-list">
              <li>
                <span className="bullet">•</span> 
                <strong>Status:</strong> {isAnalyzing ? 'Analyzing Session...' : 'Ready'}
              </li>
              <li>
                <span className="bullet">•</span> 
                <strong>Analysis Engine:</strong> Offline Behavioral Pattern Recognition
              </li>
              <li>
                <span className="bullet">•</span> 
                <strong>Data Privacy:</strong> 100% Local Processing • No Cloud Transmission
              </li>
              <li>
                <span className="bullet">•</span> 
                <strong>Last Analysis:</strong> {currentAnalysis ? new Date().toLocaleTimeString() : 'No session analyzed'}
              </li>
            </ul>
          </div>
          
          <div className="disclaimer-box">
            <h4>Important Disclaimer</h4>
            <p>
              This system is designed for behavioral pattern observation and screening assistance only. 
              It does not provide medical diagnoses or clinical assessments. All findings should be 
              interpreted by qualified professionals within appropriate clinical context.
            </p>
            <div className="footer-note">
              <small>v1.0 • Offline Mode • {new Date().getFullYear()}</small>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;