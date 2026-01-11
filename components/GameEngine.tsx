import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BehavioralFeature, InferenceResult, GameConfig } from '../types';
import inferenceService from '../services/InferenceService';
import { getGameConfig } from '../gameConfig'; 

interface GameEngineProps {
  age: number;
  themeId: string;
  specificAsset: string | null; // THÊM PROP NÀY
  onFeatureCapture: (feature: BehavioralFeature) => void;
  onSessionEnd: (features: BehavioralFeature[]) => void;
}

export const GameEngine: React.FC<GameEngineProps> = ({ 
  age,
  themeId,
  specificAsset, // Nhận prop
  onFeatureCapture, 
  onSessionEnd 
}) => {
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [currentTarget, setCurrentTarget] = useState({ x: 50, y: 50, size: 100, content: '...' });
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  
  const featuresBuffer = useRef<BehavioralFeature[]>([]); 
  const hasEnded = useRef(false);
  const finishGameRef = useRef<() => void>(() => {});

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latestAIResult = useRef<InferenceResult | null>(null);
  
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [inferenceStatus, setInferenceStatus] = useState('Đang khởi tạo...');

  // --- 1. SETUP CONFIG ---
  useEffect(() => {
    // Truyền specificAsset vào hàm lấy config
    const loadedConfig = getGameConfig(age, themeId, specificAsset); 
    setConfig(loadedConfig);
    
    setTimeElapsed(0);
    hasEnded.current = false;
    featuresBuffer.current = [];
    
    setCurrentTarget({
        x: 50, y: 50, 
        size: loadedConfig.targetSizeRange[1], 
        content: loadedConfig.theme.assets[0] // Lúc này mảng assets chỉ có 1 hình
    });
  }, [age, themeId, specificAsset]);

  // --- HÀM KẾT THÚC ---
  const finishGame = useCallback(() => {
    if (hasEnded.current) return;
    hasEnded.current = true;
    console.log(`⏹️ KẾT THÚC.`);
    inferenceService.dispose();
    onSessionEnd(featuresBuffer.current);
  }, [onSessionEnd]);

  useEffect(() => {
    finishGameRef.current = finishGame;
  }, [finishGame]);

  // --- 2. LOGIC DI CHUYỂN ẢNH (JUMPER) ---
  useEffect(() => {
    if (!config) return;

    const jumper = setInterval(() => {
        // Vì trong gameConfig ta đã set assets = [specificAsset]
        // Nên dòng này sẽ luôn lấy ra đúng hình ảnh đó
        const assets = config.theme.assets;
        const content = assets[0]; // Luôn lấy phần tử đầu tiên

        const minSize = config.targetSizeRange[0];
        const maxSize = config.targetSizeRange[1];
        const size = Math.floor(Math.random() * (maxSize - minSize) + minSize);
        
        const randomX = 10 + Math.random() * 80;
        const randomY = 10 + Math.random() * 80;

        setCurrentTarget({ x: randomX, y: randomY, size, content });

    }, config.jumpInterval); 

    return () => clearInterval(jumper);
  }, [config]);

  // --- 3. LOGIC ĐẾM GIỜ ---
  useEffect(() => {
    if (!config) return;
    const timer = setInterval(() => {
      setTimeElapsed(prev => {
        const nextTime = prev + 1;
        if (nextTime >= config.duration) {
          clearInterval(timer);
          finishGameRef.current(); 
          return config.duration;
        }
        return nextTime;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [config]);

  // --- 4. LOGIC ÂM THANH (Chỉ "ba ơi", "mẹ ơi", "a") ---
  useEffect(() => {
    if (!config) return;
    const audioInterval = setInterval(() => {
        if (Math.random() > 0.5) {
            // config.audioPrompts giờ chỉ chứa ['ba ơi', 'mẹ ơi', 'a']
            const txt = config.audioPrompts[Math.floor(Math.random() * config.audioPrompts.length)];
            playAudioPrompt(txt);
        }
    }, 8000);
    return () => clearInterval(audioInterval);
  }, [config]);

  // --- 5. LOGIC CAMERA ---
  useEffect(() => {
    const initCam = async () => {
        if (!videoRef.current) return;
        setInferenceStatus('Đang bật camera...');
        try {
            const success = await inferenceService.initialize(
                videoRef.current, 
                canvasRef.current || undefined
            );
            if (success) {
                setIsCameraInitialized(true);
                setInferenceStatus('AI đang chạy');
                inferenceService.startContinuousInference((result) => {
                    latestAIResult.current = result;
                }, 100);
            } else {
                setInferenceStatus('Giả lập (Lỗi Cam)');
                setIsCameraInitialized(true);
            }
        } catch (err) { console.error(err); setIsCameraInitialized(true); }
    };
    setTimeout(initCam, 500);
    return () => { inferenceService.dispose(); };
  }, []);

  // --- 6. LOGIC GHI DATA ---
  useEffect(() => {
    if (hasEnded.current || !config) return;
    const loop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      const aiClass = latestAIResult.current?.behavioralClassification;
      const userGazeX = aiData?.gazeX ?? 0.5; 
      const userGazeY = aiData?.gazeY ?? 0.5;
      
      const feature: BehavioralFeature = {
        timestamp: Date.now(),
        gazeX: userGazeX, gazeY: userGazeY,
        targetX: currentTarget.x, targetY: currentTarget.y, targetSize: currentTarget.size,
        audioStimulus: currentAudio,
        isLookingAtTarget: false, 
        attentionLevel: aiData?.avgAttention ?? 0.5,
        smileIntensity: aiData?.avgSmile ?? 0,
        frownIntensity: 0.1,
        affect: aiClass?.affectType === 'mixed' ? 'neutral' : (aiClass?.affectType || 'neutral'),
        poseConfidence: aiData?.faceDetectionConfidence ?? 0,
        faceConfidence: aiData?.faceDetectionConfidence ?? 0
      };
      featuresBuffer.current.push(feature);
      onFeatureCapture(feature);
    }, 100);
    return () => clearInterval(loop);
  }, [config, currentTarget, currentAudio, onFeatureCapture]);

  const playAudioPrompt = (text: string) => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'vi-VN';
      window.speechSynthesis.speak(u);
      setCurrentAudio(text);
      setTimeout(() => setCurrentAudio(null), 3000);
    }
  };

  if (!config) return <div className="text-center p-10">Đang tải cấu hình...</div>;

  return (
    <div className="game-container" style={{ 
        backgroundColor: config.theme.background, 
        transition: 'background 0.5s',
        position: 'relative',
        height: '600px', 
        overflow: 'hidden'
    }}>
      <video ref={videoRef} autoPlay muted playsInline style={{ position: 'absolute', width: '1px', opacity: 0.01 }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="text-center game-header" style={{zIndex: 20, position: 'relative'}}>
        <h2>{config.theme.name}</h2>
        <div className="score-badge">⏱️ {timeElapsed}s / {config.duration}s</div>
        {currentAudio && (
            <div style={{ marginTop: '10px', color: '#ef4444', background: 'white', padding: '5px', borderRadius: '5px'}}>
               🔊 "{currentAudio}"
            </div>
        )}
      </div>

      <div className="stimulus-canvas" style={{ background: 'transparent', boxShadow: 'none', border: 'none', position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            left: `${currentTarget.x}%`, 
            top: `${currentTarget.y}%`,
            width: `${currentTarget.size}px`, 
            height: `${currentTarget.size}px`,
            fontSize: `${currentTarget.size * 0.6}px`,
            transform: 'translate(-50%, -50%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: `all ${config.jumpInterval * 0.8}ms ease-in-out`, 
            cursor: 'default',
            filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))',
            zIndex: 10
          }}
        >
          {currentTarget.content}
        </div>
        <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 5 }} className="status-label">
           {isCameraInitialized ? `👁️ AI: ${inferenceStatus}` : '⏳ Camera...'}
        </div>
      </div>
    </div>
  );
};