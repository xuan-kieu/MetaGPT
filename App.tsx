import React, { useState, useCallback, useEffect } from 'react';
import { AppMode, BehavioralFeature, LongitudinalRecord, InferenceResult } from './types';
import { GameEngine } from './components/GameEngine';
import { ClinicianDashboard } from './components/ClinicianDashboard';
import { PrivacyWall } from './components/PrivacyWall';
import { InferenceService } from './services/InferenceService';
import { analyzeBehavioralPatterns } from './services/geminiService';
import inferenceService from './services/InferenceService'; 

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.PATIENT);
  const [sessionFeatures, setSessionFeatures] = useState<BehavioralFeature[]>([]);
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
    setMode(AppMode.CLINICIAN);
    
    // Simulate Inference Service Call
    try {
      // Sử dụng instance method thay vì static method
      const inferenceResult = await inferenceService.processStreamingData(sessionFeatures);
      const finalScore = inferenceResult.score;
      
      // Get AI Analysis
      const analysis = await analyzeBehavioralPatterns(sessionFeatures);
      setCurrentAnalysis(analysis);
      
      // Save Record
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
    <div className="min-h-screen flex flex-col">
      {/* Global Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl italic shadow-indigo-200 shadow-lg">
            NP
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-none">NeuroPath</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">AI Developmental System</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <PrivacyWall />
          <nav className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setMode(AppMode.PATIENT)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === AppMode.PATIENT ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Patient App
            </button>
            <button 
              onClick={() => setMode(AppMode.CLINICIAN)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === AppMode.CLINICIAN ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Clinician Dashboard
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {mode === AppMode.PATIENT ? (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-900">Let's Play a Game!</h2>
              <p className="text-slate-500">Find 10 clouds to complete the session.</p>
            </div>
            <GameEngine 
              onFeatureCapture={handleFeatureCapture} 
              onSessionEnd={handleSessionEnd}
            />
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Clinical Overview</h2>
                <p className="text-slate-500">Subject: ANON_ID_{records.length + 1000}</p>
              </div>
              {isAnalyzing && (
                <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-sm animate-pulse">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Running AI Pattern Analysis...</span>
                </div>
              )}
            </div>
            
            <ClinicianDashboard 
              records={records} 
              latestAnalysis={currentAnalysis}
            />
          </div>
        )}
      </main>

      {/* Footer / Dev Docs */}
      <footer className="bg-slate-50 border-t border-slate-200 p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h4 className="font-bold text-slate-800 mb-4">System Architecture</h4>
            <ul className="text-sm text-slate-600 space-y-2">
              <li className="flex items-start space-x-2">
                <span className="text-indigo-500 font-bold">•</span>
                <span><strong>Stimulus Engine:</strong> Randomized visual tasks triggers behavioral responses.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-indigo-500 font-bold">•</span>
                <span><strong>Local Feature Extractor:</strong> ML-based landmarking occurs entirely in-browser.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-indigo-500 font-bold">•</span>
                <span><strong>L-TCN Inference:</strong> Temporal Convolutional Network analyzes variance across timestamps.</span>
              </li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2 italic">Legal Disclaimer</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              This system is for research and screening assistance only. It does not provide diagnostic labels or medical advice. Results should be interpreted by qualified professionals within the context of comprehensive clinical assessment.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;