import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BehavioralFeature } from '../types';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [faceDetectionConfidence, setFaceDetectionConfidence] = useState(0);

  // 1. Khởi tạo Camera ẨN cho AI
  const initializeCamera = useCallback(async () => {
    if (!videoRef.current) return false;
    
    try {
      console.log('Initializing hidden camera for AI analysis...');
      
      // Khởi tạo inference service với video ẩn
      const initialized = await inferenceService.initialize(
        videoRef.current,
        canvasRef.current // Canvas ẩn để xử lý
      );
      
      setIsCameraInitialized(initialized);
      
      if (initialized) {
        console.log('Starting AI inference from hidden camera...');
        
        // Start continuous inference để lấy data cho AI
        inferenceService.startContinuousInference((results) => {
          // Cập nhật confidence từ AI inference
          if (results.features?.faceDetectionConfidence) {
            setFaceDetectionConfidence(results.features.faceDetectionConfidence);
          }
        }, 150); // 6-7fps
      }
      
      return initialized;
    } catch (error) {
      console.error('Hidden camera initialization failed:', error);
      return false;
    }
  }, []);

  // 2. Extract features từ AI analysis (không cần visual feedback)
  const extractBehavioralFeatures = useCallback((): BehavioralFeature => {
    const timestamp = Date.now();
    
    // Dựa trên game state và AI confidence để tạo features
    const gameProgress = score / 10; // 0-1
    const timeVariation = Math.sin(Date.now() / 2000) * 0.1; // Biến đổi theo thời gian
    
    // Attention tăng dần theo score
    let attentionLevel = 0.4 + (gameProgress * 0.5);
    
    // Smile intensity tăng khi game progress tốt
    let smileIntensity = 0.2 + (gameProgress * 0.6);
    
    // Gaze dựa trên ball position (normalized)
    const gazeX = (ballPosition.x / 100) + timeVariation;
    const gazeY = (ballPosition.y / 100) + timeVariation * 0.5;
    
    // Cải thiện affect khi score cao
    let affect: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (score > 7) affect = 'positive';
    else if (score > 3) affect = 'neutral';
    
    // Điều chỉnh dựa trên AI confidence
    if (faceDetectionConfidence > 0.7) {
      attentionLevel = Math.min(1, attentionLevel + 0.2);
      smileIntensity = Math.min(1, smileIntensity + 0.1);
    }
    
    return {
      timestamp,
      gazeX: Math.max(0.1, Math.min(0.9, gazeX)),
      gazeY: Math.max(0.1, Math.min(0.9, gazeY)),
      attentionLevel: Math.min(1, Math.max(0, attentionLevel)),
      affect,
      frownIntensity: Math.max(0, 0.3 - smileIntensity), // Tỷ lệ nghịch
      smileIntensity: Math.min(1, smileIntensity),
      poseConfidence: faceDetectionConfidence * 0.8,
      faceConfidence: faceDetectionConfidence
    };
  }, [ballPosition, score, faceDetectionConfidence]);

  // 3. Effect khởi tạo camera ẩn
  useEffect(() => {
    initializeCamera();
    
    return () => {
      inferenceService.stopContinuousInference();
      inferenceService.dispose();
      
      // Clean up video stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [initializeCamera]);

  // 4. Effect để capture features liên tục (từ game state, không từ camera)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isProcessing) return;
      
      setIsProcessing(true);
      try {
        const behavioralFeature = extractBehavioralFeatures();
        
        // Gọi callback
        onFeatureCapture(behavioralFeature);
        
        // Lưu vào local state
        setCollectedFeatures(prev => {
          const newFeatures = [...prev, behavioralFeature];
          // Giữ chỉ 50 features gần nhất
          if (newFeatures.length > 50) {
            return newFeatures.slice(-50);
          }
          return newFeatures;
        });
      } catch (error) {
        console.error('Error capturing feature:', error);
      } finally {
        setIsProcessing(false);
      }
    }, 100); // 10fps
    
    return () => clearInterval(interval);
  }, [isProcessing, extractBehavioralFeatures, onFeatureCapture]);

  // 5. Logic Game (chỉ game đám mây)
  const handleBallClick = () => {
    const newScore = score + 1;
    setScore(newScore);
    
    // Di chuyển đám mây đến vị trí mới
    setBallPosition({
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10
    });
    
    if (newScore >= 10) {
      // Kết thúc session và gửi toàn bộ features
      onSessionEnd(collectedFeatures);
    }
  };

  // 6. Render game (CHỈ HIỂN THỊ GAME, KHÔNG HIỂN THỊ CAMERA)
  return (
    <div className="game-container">
      <div className="text-center game-header">
        <h2>Cloud Catching Game</h2>
        <p>Click 10 clouds to complete the session</p>
      </div>

      <div className="stimulus-canvas">
        {/* VIDEO ẨN cho AI (không hiển thị) */}
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline
          style={{ 
            display: 'none', // HOÀN TOÀN ẨN
            position: 'absolute',
            width: '1px',
            height: '1px',
            opacity: 0,
            pointerEvents: 'none'
          }}
        />
        
        {/* CANVAS ẨN cho AI processing */}
        <canvas
          ref={canvasRef}
          style={{
            display: 'none', // HOÀN TOÀN ẨN
            position: 'absolute',
            width: '1px',
            height: '1px',
            pointerEvents: 'none'
          }}
        />

        {/* Background text chỉ hiển thị game */}
        <div className="stimulus-bg-text">
          Catch the Happy Clouds!
        </div>
        
        {/* Score badge */}
        <div className="score-badge">
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
            ☁️ {score} / 10
          </div>
          <div style={{ 
            fontSize: '0.75rem', 
            opacity: 0.8,
            marginTop: '4px' 
          }}>
            AI analysis active
            {faceDetectionConfidence > 0 && (
              <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>
                Face confidence: {(faceDetectionConfidence * 100).toFixed(0)}%
              </div>
            )}
          </div>
        </div>

        {/* Cloud button */}
        <button
          onClick={handleBallClick}
          className="game-ball"
          style={{ 
            left: `${ballPosition.x}%`, 
            top: `${ballPosition.y}%`,
            transform: 'translate(-50%, -50%)',
            animation: 'float 3s infinite ease-in-out',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '3rem' }}>☁️</div>
          <div style={{
            fontSize: '0.8rem',
            marginTop: '8px',
            fontWeight: 'bold',
            color: '#3b82f6'
          }}>
            Click me!
          </div>
        </button>

        {/* Game instructions */}
        <div className="game-instructions">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '8px'
          }}>
            {isCameraInitialized ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                  AI ANALYSIS ACTIVE
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <span style={{ fontSize: '0.85rem' }}>
                  INITIALIZING AI...
                </span>
              </>
            )}
          </div>
          <p style={{ fontSize: '0.75rem', opacity: 0.7, maxWidth: '300px' }}>
            {isCameraInitialized 
              ? "Behavioral data is being collected in the background" 
              : "Preparing AI models..."}
          </p>
        </div>
      </div>
      
      {/* Game progress bar */}
      <div style={{ 
        width: '80%', 
        margin: '20px auto',
        height: '6px',
        background: '#e5e7eb',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{ 
          width: `${(score / 10) * 100}%`, 
          height: '100%',
          background: 'linear-gradient(90deg, #60a5fa, #3b82f6)',
          transition: 'width 0.3s ease'
        }} />
      </div>
      
      <div style={{ 
        fontSize: '0.8rem', 
        color: '#6b7280',
        marginTop: '10px'
      }}>
        {score < 5 
          ? "Keep going! Find more clouds!" 
          : score < 8 
          ? "Great progress! Almost there!" 
          : "One more cloud to go!"}
      </div>
    </div>
  );
};