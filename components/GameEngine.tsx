
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BehavioralFeature } from '../types';

interface GameEngineProps {
  onFeatureCapture: (feature: BehavioralFeature) => void;
  onSessionEnd: () => void;
}

export const GameEngine: React.FC<GameEngineProps> = ({ onFeatureCapture, onSessionEnd }) => {
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const [score, setScore] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize camera
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
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

  // Feature Extraction Loop (Simulation)
  useEffect(() => {
    const timer = setInterval(() => {
      // In a real app, this would use MediaPipe or TensorFlow.js
      // Here we simulate feature extraction based on game state
      const mockFeature: BehavioralFeature = {
        timestamp: Date.now(),
        gazeX: Math.random(), // Simulated tracking
        gazeY: Math.random(),
        frownIntensity: Math.random() * 0.2,
        smileIntensity: score > 5 ? Math.random() : 0.1,
        vocalPitch: 220 + Math.random() * 20
      };
      onFeatureCapture(mockFeature);
    }, 100);
    return () => clearInterval(timer);
  }, [score, onFeatureCapture]);

  const handleBallClick = () => {
    setScore(prev => prev + 1);
    if (score >= 10) onSessionEnd();
  };

  return (
    <div className="relative w-full h-[600px] bg-sky-100 rounded-3xl overflow-hidden border-8 border-white shadow-2xl">
      {/* Hidden processing feed */}
      <video ref={videoRef} autoPlay muted className="hidden" />
      
      {/* Visual Stimulus */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <h2 className="text-4xl font-bold text-sky-600 opacity-20">Follow the Happy Cloud!</h2>
      </div>

      <button
        onClick={handleBallClick}
        style={{ left: `${ballPosition.x}%`, top: `${ballPosition.y}%` }}
        className="absolute w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center text-4xl transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 hover:scale-110 active:scale-95"
      >
        ☁️
      </button>

      <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl text-sky-800 font-bold">
        Found: {score} / 10
      </div>

      <div className="absolute bottom-6 right-6">
        <div className="bg-slate-900/40 p-2 rounded-lg text-[10px] text-white font-mono">
          [LOCAL FEATURE EXTRACTION RUNNING]
        </div>
      </div>
    </div>
  );
};
