import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BehavioralFeature, InferenceResult } from '../types';
import inferenceService from '../services/InferenceService';

interface GameEngineProps {
  onFeatureCapture: (feature: BehavioralFeature) => void;
  onSessionEnd: (features: BehavioralFeature[]) => void;
}

export const GameEngine: React.FC<GameEngineProps> = ({ 
  onFeatureCapture, 
  onSessionEnd 
}) => {
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const [score, setScore] = useState(0);
  const [collectedFeatures, setCollectedFeatures] = useState<BehavioralFeature[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [inferenceStatus, setInferenceStatus] = useState('Initializing...');
  
  const latestAIResult = useRef<InferenceResult | null>(null);

  // 1. Initialize Camera
  const initializeCamera = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      setInferenceStatus('Requesting camera...');
      const initialized = await inferenceService.initialize(
        videoRef.current, 
        canvasRef.current || undefined
      );
      
      setIsCameraInitialized(initialized);
      
      if (initialized) {
        setInferenceStatus('AI Analysis Active');
        inferenceService.startContinuousInference((result) => {
           latestAIResult.current = result;
           if (result.confidence > 0) {
             setInferenceStatus(result.explanation || 'Analyzing...');
           }
        }, 200);
      } else {
        setInferenceStatus('Camera failed - Simulating');
        setIsCameraInitialized(true); 
      }
    } catch (error) {
      console.error('Camera init failed:', error);
      setInferenceStatus('Error initializing');
      setIsCameraInitialized(true);
    }
  }, []);

  // 2. Extract Features Loop
  useEffect(() => {
    if (!isCameraInitialized) return;

    const gameLoop = setInterval(() => {
      const timestamp = Date.now();
      const aiData = latestAIResult.current?.features;
      const aiClassification = latestAIResult.current?.behavioralClassification;
      
      let currentAffect: 'positive' | 'neutral' | 'negative' = 'neutral';
      if (aiClassification?.affectType) {
        currentAffect = aiClassification.affectType === 'mixed' ? 'neutral' : aiClassification.affectType;
      } else {
        currentAffect = score > 7 ? 'positive' : 'neutral';
      }

      const feature: BehavioralFeature = {
        timestamp,
        gazeX: (ballPosition.x / 100),
        gazeY: (ballPosition.y / 100),
        attentionLevel: aiData?.avgAttention ?? (0.5 + (score * 0.05)),
        smileIntensity: aiData?.avgSmile ?? (score > 5 ? 0.6 : 0.2),
        frownIntensity: 0.1,
        affect: currentAffect,
        poseConfidence: aiData?.faceDetectionConfidence ?? 0,
        faceConfidence: aiData?.faceDetectionConfidence ?? 0
      };

      onFeatureCapture(feature);
      setCollectedFeatures(prev => [...prev.slice(-99), feature]);
    }, 100);

    return () => clearInterval(gameLoop);
  }, [isCameraInitialized, ballPosition, score, onFeatureCapture]);

  useEffect(() => {
    initializeCamera();
    return () => inferenceService.dispose();
  }, [initializeCamera]);

  const handleBallClick = () => {
    const newScore = score + 1;
    setScore(newScore);
    setBallPosition({
      x: Math.max(10, Math.min(90, Math.random() * 100)),
      y: Math.max(10, Math.min(90, Math.random() * 100))
    });
    if (newScore >= 10) onSessionEnd(collectedFeatures);
  };

  return (
    <div className="game-container">
      {/* Hidden Elements */}
      <video ref={videoRef} autoPlay muted playsInline className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      <div className="text-center game-header">
        <h2>Cloud Catching</h2>
        <p>Catch 10 clouds to complete the session</p>
      </div>

      <div className="stimulus-canvas">
        <div className="stimulus-bg-text">Catch the Clouds!</div>
        
        <div className="score-badge">
           ☁️ {score} / 10
        </div>
        
        <div className="status-label">
          {inferenceStatus}
        </div>

        {/* Game Ball Button */}
        <button
          onClick={handleBallClick}
          className="game-ball"
          style={{ 
            left: `${ballPosition.x}%`, 
            top: `${ballPosition.y}%`
          }}
        >
          ☁️
        </button>

        {/* AI Indicator */}
        <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <div className={`w-2 h-2 rounded-full ${isCameraInitialized ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} 
                style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isCameraInitialized ? '#22c55e' : '#eab308' }}></div>
           <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
             {isCameraInitialized ? 'AI ACTIVE' : 'PREPARING...'}
           </span>
        </div>
      </div>
    </div>
  );
};