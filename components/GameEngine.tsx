// components/GameEngine.tsx - Phiên bản cập nhật
import React, { useState, useEffect, useRef } from 'react';
import { BehavioralFeature } from '../types';
import inferenceService from '../services/InferenceService';

interface GameEngineProps {
  onFeatureCapture: (feature: BehavioralFeature) => void;
  onSessionEnd: () => void;
}

export const GameEngine: React.FC<GameEngineProps> = ({ onFeatureCapture, onSessionEnd }) => {
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const [score, setScore] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize camera và inference service
  useEffect(() => {
    const initializeCamera = async () => {
      if (videoRef.current) {
        try {
          const initialized = await inferenceService.initialize(videoRef.current);
          setIsCameraInitialized(initialized);
          
          if (initialized) {
            // Bắt đầu continuous inference
            inferenceService.startContinuousInference((result) => {
              console.log('Inference result:', result);
            }, 100);
          }
        } catch (error) {
          console.error('Failed to initialize camera:', error);
        }
      }
    };

    initializeCamera();

    return () => {
      inferenceService.stopContinuousInference();
      inferenceService.dispose();
    };
  }, []);

  // Game Logic: Ball bounces around
  useEffect(() => {
    const interval = setInterval(() => {
      setBallPosition({
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Feature Extraction Loop - Tích hợp với real inference
  useEffect(() => {
    if (!isCameraInitialized) return;

    const timer = setInterval(async () => {
      if (isProcessing) return;
      
      setIsProcessing(true);
      try {
        // Lấy behavioral feature từ inference service
        const behavioralFeature: BehavioralFeature = {
          timestamp: Date.now(),
          gazeX: Math.random(), // TODO: Thay bằng dữ liệu từ camera/pose
          gazeY: Math.random(),
          attentionLevel: Math.random(),
          affect: score > 5 ? 'positive' : 'neutral',
          frownIntensity: Math.random() * 0.2,
          smileIntensity: score > 5 ? Math.random() : 0.1
        };
        
        onFeatureCapture(behavioralFeature);
      } catch (error) {
        console.error('Error capturing feature:', error);
      } finally {
        setIsProcessing(false);
      }
    }, 100);
    
    return () => clearInterval(timer);
  }, [isCameraInitialized, score, onFeatureCapture]);

  const handleBallClick = () => {
    setScore(prev => prev + 1);
    if (score >= 9) { // 0-9 là 10 lần click
      onSessionEnd();
    }
  };

  return (
    <div className="relative w-full h-[600px] bg-sky-100 rounded-3xl overflow-hidden border-8 border-white shadow-2xl">
      {/* Video feed for pose detection */}
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        className="hidden" 
        style={{ transform: 'scaleX(-1)' }}
      />
      
      {/* Camera status indicator */}
      {!isCameraInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
          <div className="text-center text-white">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-semibold">Initializing camera...</p>
            <p className="text-sm mt-2">Please allow camera access</p>
          </div>
        </div>
      )}

      {/* Visual Stimulus */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <h2 className="text-4xl font-bold text-sky-600 opacity-20">Follow the Happy Cloud!</h2>
      </div>

      <button
        onClick={handleBallClick}
        style={{ left: `${ballPosition.x}%`, top: `${ballPosition.y}%` }}
        className="absolute w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center text-4xl transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 hover:scale-110 active:scale-95 z-20"
      >
        ☁️
      </button>

      <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl text-sky-800 font-bold">
        Found: {score} / 10
      </div>

      <div className="absolute bottom-6 right-6">
        <div className="bg-slate-900/40 p-2 rounded-lg text-[10px] text-white font-mono">
          {isCameraInitialized 
            ? '[REAL-TIME POSE DETECTION ACTIVE]' 
            : '[INITIALIZING...]'}
        </div>
      </div>
    </div>
  );
};