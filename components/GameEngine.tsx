import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BehavioralFeature, InferenceResult, GameConfig, GameEngineProps } from '../types';
import inferenceService from '../services/InferenceService';
import { getGameConfig } from '../gameConfig';

// Import các game con
import G1_1_Balloon from '../ageGroup/Group12_18/G1_1_Balloon';
import G1_2_Clapping from '../ageGroup/Group12_18/G1_2_Clapping';
import G1_3_Attention from '../ageGroup/Group12_18/G1_3_Attention';
import G1_4_Peekaboo from '../ageGroup/Group12_18/G1_4_Peekaboo';
import G1_5_ToyTracking from '../ageGroup/Group12_18/G1_5_ToyTracking';

// --- CSS GỐC TOÀN CẢNH (GLOBAL THEME) ---
const globalStyles = `
  /* 1. VARIABLES & THEME */
  :root {
    --primary: #6366f1;
    --primary-hover: #4f46e5;
    --slate-50: #f8fafc;
    --slate-200: #e2e8f0;
    --slate-800: #1e293b;
    --emerald-500: #10b981;
    --white: #ffffff;
    --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  }

  /* 2. LAYOUT CHÍNH */
  .game-engine-container {
    width: 100%;
    height: 100vh; /* Full màn hình */
    display: flex;
    flex-direction: column;
    background-color: var(--slate-50);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    position: relative;
    overflow: hidden;
  }

  /* 3. KHUNG CHỨA GAME (MAIN CONTENT) */
  .game-content {
    flex: 1; /* Chiếm toàn bộ khoảng trống còn lại */
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f0fdf4; /* Màu nền nhẹ đệm dưới game */
    overflow: hidden;
  }

  /* 4. STATUS BAR (THANH TRẠNG THÁI BÊN DƯỚI) */
  .game-status-bar {
    padding: 12px 20px;
    background-color: var(--slate-800);
    color: var(--white);
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: 14px;
    flex-wrap: wrap;
    box-shadow: 0 -4px 6px -1px rgba(0,0,0,0.1);
    z-index: 50;
  }

  .game-status-bar span {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  /* 5. PROGRESS BAR (THANH TIẾN TRÌNH) */
  .game-progress-container {
    height: 6px;
    background-color: var(--slate-200);
    width: 100%;
  }

  .game-progress-fill {
    height: 100%;
    background-color: var(--emerald-500); /* Màu xanh lá chuẩn */
    transition: width 0.3s ease;
  }

  /* 6. NAVIGATION BUTTONS (THANH ĐIỀU HƯỚNG DƯỚI CÙNG) */
  .game-nav-bar {
    padding: 15px 20px;
    background-color: var(--white);
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
    border-top: 1px solid var(--slate-200);
  }

  .nav-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .nav-btn.active {
    background-color: var(--primary);
    color: white;
    box-shadow: 0 2px 4px rgba(99, 102, 241, 0.3);
  }

  .nav-btn.inactive {
    background-color: var(--slate-200);
    color: #64748b;
  }

  .nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* 7. HIDDEN ELEMENTS */
  .hidden-video {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    z-index: -1;
  }
  .hidden-canvas { display: none; }
`;

// --- HELPER CONFIG ---
interface AgeGroupConfig {
  totalDuration: number;
  games: Array<{
    id: string;
    name: string;
    duration: number;
    component: React.ComponentType<any>;
  }>;
}

const getAgeGroupConfig = (age: number): AgeGroupConfig | null => {
  if (age >= 12 && age <= 18) {
    return {
      totalDuration: 10 * 60,
      games: [
        { id: 'G1.1', name: 'Bong Bóng Biết Bay', duration: 120, component: G1_1_Balloon },
        { id: 'G1.2', name: 'Vỗ Tay Vui Nhộn', duration: 120, component: G1_2_Clapping },
        { id: 'G1.3', name: 'Bé Ơi Quay Lại Nào', duration: 120, component: G1_3_Attention },
        { id: 'G1.4', name: 'Ú Òa Kỳ Diệu', duration: 120, component: G1_4_Peekaboo },
        { id: 'G1.5', name: 'Theo Dõi Đồ Chơi', duration: 120, component: G1_5_ToyTracking }
      ]
    };
  }
  // Mặc định cho các nhóm khác để test
  return {
      totalDuration: 10 * 60,
      games: [
        { id: 'G1.1', name: 'Bong Bóng (Demo)', duration: 120, component: G1_1_Balloon },
        { id: 'G1.2', name: 'Vỗ Tay (Demo)', duration: 120, component: G1_2_Clapping }
      ]
  };
};

// --- COMPONENT CHÍNH ---
export const GameEngine: React.FC<GameEngineProps> = ({ 
  age, themeId, specificAsset, childName, onFeatureCapture, onSessionEnd 
}) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latestAIResult = useRef<InferenceResult | null>(null);
  const allFeaturesBuffer = useRef<BehavioralFeature[]>([]);
  
  // Timers
  const gameStartTimeRef = useRef<number>(Date.now());
  const currentGameStartTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [inferenceStatus, setInferenceStatus] = useState('Đang khởi tạo...');
  const [currentGameTime, setCurrentGameTime] = useState(0);
  const [ageGroup, setAgeGroup] = useState<AgeGroupConfig | null>(null);

  // 1. Init Config
  useEffect(() => {
    const group = getAgeGroupConfig(age);
    setAgeGroup(group);
    if (group) {
        const loadedConfig = getGameConfig(age, themeId, specificAsset);
        setConfig(loadedConfig);
    }
  }, [age, themeId, specificAsset]);

  // 2. Timer Loop
  useEffect(() => {
    if (!ageGroup || !ageGroup.games) return;
    const currentGame = ageGroup.games[currentGameIndex];
    
    // Reset timer
    currentGameStartTimeRef.current = Date.now();
    setCurrentGameTime(0);

    const updateTimer = () => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - currentGameStartTimeRef.current) / 1000);
      setCurrentGameTime(elapsedSeconds);

      if (elapsedSeconds >= currentGame.duration) {
        handleNextGame();
      } else {
        timerRef.current = setTimeout(updateTimer, 100); // 100ms check
      }
    };
    
    timerRef.current = setTimeout(updateTimer, 100);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [currentGameIndex, ageGroup]);

  // 3. Camera Init
  useEffect(() => {
    let isMounted = true;
    const initCam = async () => {
      if (!videoRef.current) return;
      setInferenceStatus('Đang bật camera...');
      try {
        const success = await inferenceService.initialize(videoRef.current, canvasRef.current || undefined);
        if (!isMounted) return;
        if (success) {
          setIsCameraInitialized(true);
          setInferenceStatus('AI đang chạy');
          inferenceService.startContinuousInference((result) => { latestAIResult.current = result; }, 100);
        } else {
          setInferenceStatus('Giả lập');
          setIsCameraInitialized(true);
        }
      } catch (err) { console.error(err); setIsCameraInitialized(true); }
    };
    setTimeout(initCam, 500);
    return () => { 
        isMounted = false; 
        inferenceService.dispose(); 
    };
  }, []);

  const handleNextGame = useCallback(() => {
    if (!ageGroup) return;
    if (currentGameIndex < ageGroup.games.length - 1) {
      setCurrentGameIndex(prev => prev + 1);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      onSessionEnd(allFeaturesBuffer.current);
    }
  }, [currentGameIndex, ageGroup, onSessionEnd]);

  const handleFeatureCapture = useCallback((feature: BehavioralFeature) => {
    if (!ageGroup) return;
    const currentGame = ageGroup.games[currentGameIndex];
    const enriched = { 
      ...feature, 
      gameId: currentGame.id, 
      sessionTime: Date.now() - gameStartTimeRef.current, 
      childName 
    };
    allFeaturesBuffer.current.push(enriched);
    onFeatureCapture(enriched);
  }, [currentGameIndex, ageGroup, childName, onFeatureCapture]);

  if (!config || !ageGroup) return <div style={{padding: 20}}>Loading config...</div>;

  const CurrentGameComponent = ageGroup.games[currentGameIndex]?.component;
  const currentGame = ageGroup.games[currentGameIndex];
  const totalSessionTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);

  return (
    <div className="game-engine-container">
      <style>{globalStyles}</style>

      {/* Hidden Video */}
      <video ref={videoRef} autoPlay muted playsInline className="hidden-video" />
      <canvas ref={canvasRef} className="hidden-canvas" />

      {/* GAME CONTENT (CENTERED) */}
      <div className="game-content">
        {CurrentGameComponent && (
          <CurrentGameComponent
            config={config}
            latestAIResult={latestAIResult}
            onFeatureCapture={handleFeatureCapture}
            timeElapsed={currentGameTime}
            childName={childName}
            gameDuration={currentGame?.duration || 120}
          />
        )}
      </div>

      {/* STATUS BAR (BOTTOM) */}
      <div className="game-status-bar">
        <span>{isCameraInitialized ? `👁️ AI: ${inferenceStatus}` : '⏳ Camera...'}</span>
        <span>|</span>
        <span>Nhóm: {age} tháng</span>
        <span>|</span>
        <span>Game: {currentGame?.id} - {currentGame?.name}</span>
        <span>|</span>
        <span>Bé: {childName || "Chưa đặt tên"}</span>
        <span>|</span>
        <span>Thời gian: {currentGameTime}s / {currentGame?.duration}s</span>
        <span>|</span>
        <span>Tổng: {totalSessionTime}s</span>
      </div>

      {/* PROGRESS BAR */}
      <div className="game-progress-container">
        <div 
          className="game-progress-fill"
          style={{ width: `${(currentGameTime / currentGame.duration) * 100}%` }}
        ></div>
      </div>

      {/* NAVIGATION BUTTONS (OPTIONAL/DEBUG) */}
      <div className="game-nav-bar">
        {ageGroup.games.map((game, index) => (
          <button
            key={game.id}
            className={`nav-btn ${index === currentGameIndex ? 'active' : 'inactive'}`}
            onClick={() => {
               if (index <= currentGameIndex + 1) setCurrentGameIndex(index);
            }}
            disabled={index > currentGameIndex + 1}
          >
            {game.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GameEngine;