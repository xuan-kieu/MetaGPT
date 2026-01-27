import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BehavioralFeature, InferenceResult, GameConfig, GameEngineProps } from '../types';
import inferenceService from '../services/InferenceService';
import { getGameConfig } from '../gameConfig';

// --- IMPORT CÁC GAME CON ---

// A. Nhóm 12-18 tháng
import G1_1_Balloon from '../ageGroup/Group12_18/G1_1_Balloon';
import G1_2_Clapping from '../ageGroup/Group12_18/G1_2_Clapping';
import G1_3_Attention from '../ageGroup/Group12_18/G1_3_Attention';
import G1_4_Peekaboo from '../ageGroup/Group12_18/G1_4_Peekaboo';
import G1_5_ToyTracking from '../ageGroup/Group12_18/G1_5_ToyTracking';

// B. Nhóm 18-24 tháng
import G2_1_ChiTayTinhMat from '../ageGroup/Group18_24/G2_1_ChiTayTinhMat';
import G2_2_XayThapCao from '../ageGroup/Group18_24/G2_2_XayThapCao';
import G2_3_TiengKeuCuaAi from '../ageGroup/Group18_24/G2_3_TiengKeuCuaAi';
import G2_4_ChoBupBeAn from '../ageGroup/Group18_24/G2_4_ChoBupBeAn';
import G2_5_TimBongHinh from '../ageGroup/Group18_24/G2_5_TimBongHinh';

// C. Nhóm 2-3 tuổi
import G3_1_VeDungNhaNao from '../ageGroup/Group2_3_year/G3_1_VeDungNhaNao';
import G3_2_CamXucGiDay from '../ageGroup/Group2_3_year/G3_2_CamXucGiDay';
import G3_3_DenLuotConRoii from '../ageGroup/Group2_3_year/G3_3_DenLuotConRoii';
import G3_4_TimHinhGhepCap from '../ageGroup/Group2_3_year/G3_4_TimHinhGhepCap';
import G3_5_MeCungDonGian from '../ageGroup/Group2_3_year/G3_5_MeCungDonGian';

// D. Nhóm 3-5 tuổi
import G4_1_ViSaoTheNhi from '../ageGroup/Group3_5year/G4_1_ViSaoTheNhi';
import G4_2_SapXepCauChuyen from '../ageGroup/Group3_5year/G4_2_SapXepCauChuyen';
import G4_3_CuaHangTiHon from '../ageGroup/Group3_5year/G4_3_CuaHangTiHon';
import G4_4_LamTheoChiDan from '../ageGroup/Group3_5year/G4_4_LamTheoChiDan';
import G4_5_GiaiMaQuyTac from '../ageGroup/Group3_5year/G4_5_GiaiMaQuyTac';


// --- CSS GỐC TOÀN CẢNH (GLOBAL THEME) - KHÔNG ĐỔI ---
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
    duration: number; // seconds
    component: React.ComponentType<any>;
  }>;
}

// Hàm này đã được cập nhật logic để chọn game theo độ tuổi
const getAgeGroupConfig = (age: number): AgeGroupConfig | null => {
  // A. Nhóm 12-18 tháng (12 <= age < 18)
  if (age >= 12 && age < 18) {
    return {
      totalDuration: 10 * 60, // ~10 mins
      games: [
        { id: 'G1.1', name: 'Bong Bóng Biết Bay', duration: 120, component: G1_1_Balloon },      // 2p
        { id: 'G1.2', name: 'Vỗ Tay Vui Nhộn', duration: 120, component: G1_2_Clapping },       // 2p
        { id: 'G1.3', name: 'Bé Ơi Quay Lại Nào', duration: 120, component: G1_3_Attention },     // 2p
        { id: 'G1.4', name: 'Ú Òa Kỳ Diệu', duration: 120, component: G1_4_Peekaboo },         // 2p
        { id: 'G1.5', name: 'Theo Dõi Đồ Chơi', duration: 120, component: G1_5_ToyTracking }    // 2p
      ]
    };
  }

  // B. Nhóm 18-24 tháng (18 <= age < 24)
  if (age >= 18 && age < 24) {
    return {
      totalDuration: 13 * 60, // ~13 mins
      games: [
        { id: 'G2.1', name: 'Chỉ Tay Tinh Mắt', duration: 180, component: G2_1_ChiTayTinhMat },  // 3p
        { id: 'G2.2', name: 'Xây Tháp Cao', duration: 180, component: G2_2_XayThapCao },         // 3p
        { id: 'G2.3', name: 'Tiếng Kêu Của Ai', duration: 120, component: G2_3_TiengKeuCuaAi },  // 2p
        { id: 'G2.4', name: 'Cho Búp Bê Ăn', duration: 180, component: G2_4_ChoBupBeAn },       // 3p
        { id: 'G2.5', name: 'Tìm Bóng Hình', duration: 120, component: G2_5_TimBongHinh }       // 2p
      ]
    };
  }

  // C. Nhóm 2-3 tuổi (24 <= age < 36)
  if (age >= 24 && age < 36) {
    return {
      totalDuration: 15 * 60, // ~15 mins
      games: [
        { id: 'G3.1', name: 'Về Đúng Nhà Nào', duration: 180, component: G3_1_VeDungNhaNao },   // 3p
        { id: 'G3.2', name: 'Cảm Xúc Gì Đây', duration: 180, component: G3_2_CamXucGiDay },     // 3p
        { id: 'G3.3', name: 'Đến Lượt Con Rồi', duration: 180, component: G3_3_DenLuotConRoii }, // 3p
        { id: 'G3.4', name: 'Tìm Hình Ghép Cặp', duration: 180, component: G3_4_TimHinhGhepCap }, // 3p
        { id: 'G3.5', name: 'Mê Cung Đơn Giản', duration: 180, component: G3_5_MeCungDonGian }  // 3p
      ]
    };
  }

  // D. Nhóm 3-5 tuổi (36 <= age <= 60)
  if (age >= 36 && age <= 60) {
    return {
      totalDuration: 18 * 60, // ~18 mins
      games: [
        { id: 'G4.1', name: 'Vì Sao Thế Nhỉ', duration: 240, component: G4_1_ViSaoTheNhi },     // 4p
        { id: 'G4.2', name: 'Sắp Xếp Câu Chuyện', duration: 240, component: G4_2_SapXepCauChuyen }, // 4p
        { id: 'G4.3', name: 'Cửa Hàng Tí Hon', duration: 240, component: G4_3_CuaHangTiHon },    // 4p
        { id: 'G4.4', name: 'Làm Theo Chỉ Dẫn', duration: 180, component: G4_4_LamTheoChiDan },  // 3p
        { id: 'G4.5', name: 'Giải Mã Quy Tắc', duration: 180, component: G4_5_GiaiMaQuyTac }    // 3p
      ]
    };
  }

  // Fallback nếu không thuộc nhóm nào (hoặc để test)
  return {
      totalDuration: 10 * 60,
      games: [
        { id: 'TEST', name: 'Chưa hỗ trợ độ tuổi này', duration: 60, component: G1_1_Balloon }
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
    // Gọi hàm helper mới cập nhật để lấy danh sách game
    const group = getAgeGroupConfig(age);
    setAgeGroup(group);
    
    // Reset game index về 0 mỗi khi đổi lứa tuổi
    setCurrentGameIndex(0);

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