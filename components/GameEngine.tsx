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

  // 1. Khởi tạo Camera & Inference Service
  useEffect(() => {
    const initializeCamera = async () => {
      if (videoRef.current) {
        try {
          const initialized = await inferenceService.initialize(videoRef.current);
          setIsCameraInitialized(initialized);
          if (initialized) {
            inferenceService.startContinuousInference((result) => {
              // Log nhẹ để debug, có thể comment lại khi chạy thật
              // console.log('Inference result:', result);
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

  // 2. Vòng lặp thu thập dữ liệu (Feature Extraction)
  useEffect(() => {
    if (!isCameraInitialized) return;
    
    const timer = setInterval(async () => {
      if (isProcessing) return;
      setIsProcessing(true);
      
      try {
        // Giả lập dữ liệu hành vi (Thay bằng dữ liệu thật từ inferenceService nếu có)
        const behavioralFeature: BehavioralFeature = {
          timestamp: Date.now(),
          gazeX: Math.random(),
          gazeY: Math.random(),
          attentionLevel: Math.random(), // Logic thật sẽ lấy từ model
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
    }, 100); // 10fps

    return () => clearInterval(timer);
  }, [isCameraInitialized, score, onFeatureCapture, isProcessing]);

  // 3. Logic Game (Click bóng)
  const handleBallClick = () => {
    const newScore = score + 1;
    setScore(newScore);
    
    if (newScore >= 10) {
      onSessionEnd();
    } else {
      setBallPosition({
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10
      });
    }
  };

  return (
    <div className="game-container">
      <div className="text-center game-header">
        <h2>Let's Play a Game!</h2>
        <p>Find 10 clouds to complete the session.</p>
      </div>

      <div className="stimulus-canvas">
        {/* Video ẩn dùng cho AI Vision */}
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          className="hidden" 
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
        />

        <div className="stimulus-bg-text">Follow the Happy Cloud!</div>
        <div className="score-badge">Found: {score} / 10</div>

        <button
          onClick={handleBallClick}
          className="game-ball"
          style={{ left: `${ballPosition.x}%`, top: `${ballPosition.y}%` }}
        >
          ☁️
        </button>

        <div className="status-label">
          {isCameraInitialized 
            ? '[REAL-TIME POSE DETECTION ACTIVE]' 
            : '[INITIALIZING CAMERA...]'}
        </div>
      </div>
    </div>
  );
};