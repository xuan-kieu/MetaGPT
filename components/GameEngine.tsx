import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BehavioralFeature } from '../types';
import { FeatureExtractorService } from '../services/FeatureExtractorService';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

interface GameEngineProps {
  onFeatureCapture: (feature: BehavioralFeature) => void;
  onSessionEnd: () => void;
}

export const GameEngine: React.FC<GameEngineProps> = ({ onFeatureCapture, onSessionEnd }) => {
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const [score, setScore] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const featureExtractor = FeatureExtractorService.getInstance();
  const animationRef = useRef<number | null>(null);

  // Initialize camera and feature extractor
  useEffect(() => {
    const initialize = async () => {
      if (!videoRef.current) return;

      try {
        // Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
            frameRate: { ideal: 30 }
          },
          audio: false,
        });

        videoRef.current.srcObject = stream;
        
        // Initialize feature extractor
        const success = await featureExtractor.initialize(videoRef.current);
        setIsInitialized(success);
        setCameraActive(success);

        if (success) {
          startFeatureExtraction();
        }

        // Auto-stop after 10 minutes (safety)
        setTimeout(() => {
          if (score < 10) {
            onSessionEnd();
          }
        }, 10 * 60 * 1000);

      } catch (error) {
        console.error('Failed to initialize camera:', error);
        // Fallback to mock features for testing
        startMockFeatureExtraction();
      }
    };

    initialize();

    return () => {
      // Cleanup
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      featureExtractor.cleanup();
      
      // Stop camera stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startFeatureExtraction = () => {
    const processFrame = async () => {
      if (!isInitialized) return;

      try {
        const feature = await featureExtractor.extractFeatures();
        if (feature) {
          onFeatureCapture(feature);
          
          // Update debug visualization
          if (showDebug && canvasRef.current) {
            drawDebugVisualization(feature);
          }
        }
      } catch (error) {
        console.error('Frame processing error:', error);
      }

      animationRef.current = requestAnimationFrame(processFrame);
    };

    animationRef.current = requestAnimationFrame(processFrame);
  };

  const startMockFeatureExtraction = () => {
    // Fallback if camera fails
    const interval = setInterval(() => {
      const mockFeature: BehavioralFeature = {
        timestamp: Date.now(),
        gazeX: 0.5 + Math.random() * 0.1 - 0.05,
        gazeY: 0.5 + Math.random() * 0.1 - 0.05,
        frownIntensity: Math.random() * 0.3,
        smileIntensity: 0.2 + Math.random() * 0.3,
      };
      onFeatureCapture(mockFeature);
    }, 100);

    return () => clearInterval(interval);
  };

  const drawDebugVisualization = (feature: BehavioralFeature) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw gaze point
    const x = feature.gazeX * canvas.width;
    const y = feature.gazeY * canvas.height;
    
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(99, 102, 241, ${feature.confidence || 0.5})`;
    ctx.fill();
    
    // Draw smile/frown indicator
    ctx.fillStyle = feature.smileIntensity > feature.frownIntensity 
      ? `rgba(34, 197, 94, ${feature.smileIntensity})`
      : `rgba(239, 68, 68, ${feature.frownIntensity})`;
    ctx.fillRect(10, 10, 20, 20);
  };

  const handleBallClick = () => {
    setScore(prev => {
      const newScore = prev + 1;
      if (newScore >= 10) {
        setTimeout(() => onSessionEnd(), 500);
      }
      return newScore;
    });
  };

  // Game logic: Ball movement
  useEffect(() => {
    if (score >= 10) return;

    const interval = setInterval(() => {
      setBallPosition({
        x: Math.random() * 70 + 15, // Keep within 15-85%
        y: Math.random() * 70 + 15
      });
    }, score < 3 ? 3000 : score < 7 ? 2000 : 1500); // Increase difficulty

    return () => clearInterval(interval);
  }, [score]);

  return (
    <div className="relative w-full h-[600px] bg-sky-100 rounded-[32px] overflow-hidden border-8 border-white shadow-2xl">
      {/* Hidden video and canvas for processing */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ display: showDebug ? 'block' : 'none' }}
      />

      {/* Game elements */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-4xl font-bold text-sky-600 opacity-20">
        {!isInitialized ? 'Initializing Camera...' : 'Follow the Cloud!'}
      </div>

      {/* Clickable cloud */}
      <button
        onClick={handleBallClick}
        style={{ 
          left: `${ballPosition.x}%`, 
          top: `${ballPosition.y}%`,
          transition: 'left 0.5s ease-out, top 0.5s ease-out'
        }}
        className="absolute w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center text-5xl transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 active:scale-95 border-none cursor-pointer transition-transform duration-200"
        disabled={score >= 10}
      >
        ☁️
      </button>

      {/* Score display */}
      <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-6 py-3 rounded-xl text-sky-800 font-bold text-lg shadow-md">
        Found: <span className="text-2xl ml-2">{score} / 10</span>
      </div>

      {/* Status indicators */}
      <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${cameraActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          {cameraActive ? '🎥 Camera Active' : '⚠️ Camera Offline'}
        </div>
        <div className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
          {isInitialized ? '🧠 AI Processing' : '⚙️ Initializing...'}
        </div>
      </div>

      {/* Debug toggle */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="absolute bottom-6 left-6 bg-slate-800/60 hover:bg-slate-800/80 text-white text-xs font-mono px-3 py-2 rounded-lg transition-colors"
      >
        {showDebug ? 'HIDE DEBUG' : 'SHOW DEBUG'}
      </button>

      {/* Feature extraction status */}
      <div className="absolute bottom-6 right-6 bg-slate-900/60 p-3 rounded-lg text-xs text-white font-mono backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isInitialized ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
          <span>REAL-TIME FEATURE EXTRACTION</span>
        </div>
        <div className="text-[10px] text-slate-300 mt-1">
          {isInitialized ? 'MediaPipe FaceMesh Active' : 'Using Mock Data'}
        </div>
      </div>

      {/* Instructions */}
      {score < 3 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded-lg shadow-md animate-pulse">
          <p className="text-sm text-slate-700">Click on the cloud to catch it!</p>
        </div>
      )}
    </div>
  );
};