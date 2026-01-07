
import React, { useState, useEffect, useRef } from 'react';
import { BehavioralFeature } from '../types';

interface GameEngineProps {
  onFeatureCapture: (feature: BehavioralFeature) => void;
  onSessionEnd: () => void;
}

export const GameEngine: React.FC<GameEngineProps> = ({ onFeatureCapture, onSessionEnd }) => {
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const [score, setScore] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

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
      const mockFeature: BehavioralFeature = {
        timestamp: Date.now(),
        gazeX: Math.random(),
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
    <div className="relative w-full h-[600px] bg-sky-100 rounded-[32px] overflow-hidden border-8 border-white shadow-2xl">
      <video ref={videoRef} autoPlay muted className="hidden" />
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-4xl font-bold text-sky-600 opacity-20">
        Follow the Happy Cloud!
      </div>

      <button
        onClick={handleBallClick}
        style={{ left: `${ballPosition.x}%`, top: `${ballPosition.y}%` }}
        className="absolute w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center text-4xl transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 hover:scale-110 active:scale-95 border-none cursor-pointer"
      >
        ☁️
      </button>

      <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl text-sky-800 font-bold">
        Found: {score} / 10
      </div>

      <div className="absolute bottom-6 right-6 bg-slate-900/40 p-2 rounded-lg text-[10px] text-white font-mono">
        [LOCAL FEATURE EXTRACTION RUNNING]
      </div>
    </div>
  );
};
