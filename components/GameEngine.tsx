import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  BehavioralFeature, 
  InferenceResult, 
  GameConfig, 
  GameEngineProps,
  AgeGroupConfig,
  SessionPhase,
  GatewayResult,
  SessionResult,
  SessionSummary,
  GatewayDecision
} from '../types';
import inferenceService from '../services/InferenceService';

// --- IMPORT CÁC GAME CON (Giữ nguyên của bạn) ---
import G1_1_Balloon from '../ageGroup/Group12_18/G1_1_Balloon';
import G1_2_Clapping from '../ageGroup/Group12_18/G1_2_Clapping';
import G1_3_Attention from '../ageGroup/Group12_18/G1_3_Attention';
import G1_4_Peekaboo from '../ageGroup/Group12_18/G1_4_Peekaboo';
import G1_5_ToyTracking from '../ageGroup/Group12_18/G1_5_ToyTracking';

import G2_1_ChiTayTinhMat from '../ageGroup/Group18_24/G2_1_ChiTayTinhMat';
import G2_2_XayThapCao from '../ageGroup/Group18_24/G2_2_XayThapCao';
import G2_3_TiengKeuCuaAi from '../ageGroup/Group18_24/G2_3_TiengKeuCuaAi';
import G2_4_ChoBupBeAn from '../ageGroup/Group18_24/G2_4_ChoBupBeAn';
import G2_5_TimBongHinh from '../ageGroup/Group18_24/G2_5_TimBongHinh';

import G3_1_VeDungNhaNao from '../ageGroup/Group2_3_year/G3_1_VeDungNhaNao';
import G3_2_CamXucGiDay from '../ageGroup/Group2_3_year/G3_2_CamXucGiDay';
import G3_3_DenLuotConRoii from '../ageGroup/Group2_3_year/G3_3_DenLuotConRoii';
import G3_4_TimHinhGhepCap from '../ageGroup/Group2_3_year/G3_4_TimHinhGhepCap';
import G3_5_MeCungDonGian from '../ageGroup/Group2_3_year/G3_5_MeCungDonGian';

import G4_1_ViSaoTheNhi from '../ageGroup/Group3_5year/G4_1_ViSaoTheNhi';
import G4_2_SapXepCauChuyen from '../ageGroup/Group3_5year/G4_2_SapXepCauChuyen';
import G4_3_CuaHangTiHon from '../ageGroup/Group3_5year/G4_3_CuaHangTiHon';
import G4_4_LamTheoChiDan from '../ageGroup/Group3_5year/G4_4_LamTheoChiDan';
import G4_5_GiaiMaQuyTac from '../ageGroup/Group3_5year/G4_5_GiaiMaQuyTac';

// --- CSS STYLES (Đã thêm class cho màn hình Pause) ---
const globalStyles = `
  :root {
    --primary: #6366f1;
    --primary-hover: #4f46e5;
    --slate-50: #f8fafc;
    --slate-200: #e2e8f0;
    --slate-800: #1e293b;
    --emerald-500: #10b981;
    --white: #ffffff;
    --amber-500: #f59e0b;
    --red-500: #ef4444;
    --blue-500: #3b82f6;
    --purple-500: #8b5cf6;
    --indigo-500: #6366f1;
  }

  .game-engine-container { width: 100%; height: 100vh; display: flex; flex-direction: column; background-color: var(--slate-50); font-family: 'Inter', sans-serif; position: relative; overflow: hidden; }
  .game-content { flex: 1; position: relative; width: 100%; display: flex; justify-content: center; align-items: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); overflow: hidden; }
  .game-status-bar { padding: 12px 20px; background-color: var(--slate-800); color: var(--white); display: flex; align-items: center; justify-content: space-between; gap: 15px; font-size: 14px; flex-wrap: wrap; z-index: 50; }
  .status-left { display: flex; gap: 15px; align-items: center; }
  .status-right { display: flex; gap: 10px; align-items: center; }
  
  .phase-badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
  .phase-gateway { background-color: var(--amber-500); color: var(--white); }
  .phase-full { background-color: var(--emerald-500); color: var(--white); }
  .phase-reduced { background-color: var(--blue-500); color: var(--white); }

  .gateway-result { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin: 0 2px; }
  .gateway-success { background-color: var(--emerald-500); }
  .gateway-failure { background-color: var(--red-500); }
  .gateway-pending { background-color: var(--slate-200); }

  .game-progress-container { height: 6px; background-color: var(--slate-200); width: 100%; }
  .game-progress-fill { height: 100%; background: linear-gradient(90deg, var(--emerald-500), var(--indigo-500)); transition: width 0.3s ease; }

  .hidden-video { position: absolute; opacity: 0; pointer-events: none; z-index: -1; }

  .btn-pause { background-color: transparent; border: 1px solid rgba(255,255,255,0.3); color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: 0.2s; font-weight: 600; }
  .btn-pause:hover { background-color: rgba(255,255,255,0.1); }

  /* GIAO DIỆN TẠM DỪNG */
  .pause-overlay {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(15, 23, 42, 0.9); /* Nền tối mờ */
    z-index: 1000; display: flex; flex-direction: column; justify-content: center; align-items: center;
    backdrop-filter: blur(8px);
  }
  .pause-box {
    background: white; padding: 40px; border-radius: 16px; text-align: center; max-width: 400px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  .pause-title { font-size: 24px; font-weight: 700; color: var(--slate-800); margin-bottom: 10px; }
  .pause-desc { color: #64748b; margin-bottom: 30px; }
  .pause-actions { display: flex; gap: 15px; justify-content: center; }
  .btn-resume { background-color: var(--primary); color: white; padding: 10px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 16px; }
  .btn-resume:hover { background-color: var(--primary-hover); }
  .btn-end-early { background-color: white; color: var(--red-500); border: 1px solid var(--red-500); padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 16px; }
  .btn-end-early:hover { background-color: #fef2f2; }
`;

// --- HÀM CHỌN GAME THEO ĐỘ TUỔI (Giữ nguyên của bạn) ---
const getAgeGroupConfig = (age: number): AgeGroupConfig | null => {
  if (age >= 12 && age < 18) {
    return {
      totalDuration: 20 * 60, 
      games: [
        { id: 'GW1', name: 'Bong Bóng Biết Bay', duration: 150, component: G1_1_Balloon, isGateway: true, isOptional: false },
        { id: 'GW2', name: 'Vỗ Tay Vui Nhộn', duration: 150, component: G1_2_Clapping, isGateway: true, isOptional: false },
        { id: 'GW3', name: 'Bé Ơi Quay Lại Nào', duration: 150, component: G1_3_Attention, isGateway: true, isOptional: false },
        { id: 'G1.1', name: 'Ú Òa Kỳ Diệu', duration: 150, component: G1_4_Peekaboo, isGateway: false, isOptional: true },
        { id: 'G1.2', name: 'Theo Dõi Đồ Chơi', duration: 150, component: G1_5_ToyTracking, isGateway: false, isOptional: true },
        { id: 'G1.3', name: 'Chơi Úp Mở', duration: 150, component: G1_4_Peekaboo, isGateway: false, isOptional: true },
        { id: 'G1.4', name: 'Lắc Xắc Xô', duration: 150, component: G1_2_Clapping, isGateway: false, isOptional: true },
        { id: 'G1.5', name: 'Chào Tạm Biệt', duration: 150, component: G1_3_Attention, isGateway: false, isOptional: true }
      ]
    };
  }

  if (age >= 18 && age < 24) {
    return {
      totalDuration: 25 * 60, 
      games: [
        { id: 'GW1', name: 'Bong Bóng Biết Bay', duration: 150, component: G1_1_Balloon, isGateway: true, isOptional: false },
        { id: 'GW2', name: 'Vỗ Tay Vui Nhộn', duration: 150, component: G1_2_Clapping, isGateway: true, isOptional: false },
        { id: 'GW3', name: 'Bé Ơi Quay Lại Nào', duration: 150, component: G1_3_Attention, isGateway: true, isOptional: false },
        { id: 'G2.1', name: 'Chỉ Tay Tinh Mắt', duration: 180, component: G2_1_ChiTayTinhMat, isGateway: false, isOptional: true },
        { id: 'G2.2', name: 'Xây Tháp Cao', duration: 180, component: G2_2_XayThapCao, isGateway: false, isOptional: true },
        { id: 'G2.3', name: 'Tiếng Kêu Của Ai', duration: 150, component: G2_3_TiengKeuCuaAi, isGateway: false, isOptional: true },
        { id: 'G2.4', name: 'Cho Búp Bê Ăn', duration: 180, component: G2_4_ChoBupBeAn, isGateway: false, isOptional: true },
        { id: 'G2.5', name: 'Tìm Bóng Hình', duration: 150, component: G2_5_TimBongHinh, isGateway: false, isOptional: true }
      ]
    };
  }

  if (age >= 24 && age < 36) {
    return {
      totalDuration: 30 * 60, 
      games: [
        { id: 'GW1', name: 'Bong Bóng Biết Bay', duration: 150, component: G1_1_Balloon, isGateway: true, isOptional: false },
        { id: 'GW2', name: 'Vỗ Tay Vui Nhộn', duration: 150, component: G1_2_Clapping, isGateway: true, isOptional: false },
        { id: 'GW3', name: 'Bé Ơi Quay Lại Nào', duration: 150, component: G1_3_Attention, isGateway: true, isOptional: false },
        { id: 'G3.1', name: 'Về Đúng Nhà Nào', duration: 180, component: G3_1_VeDungNhaNao, isGateway: false, isOptional: true },
        { id: 'G3.2', name: 'Cảm Xúc Gì Đây', duration: 180, component: G3_2_CamXucGiDay, isGateway: false, isOptional: true },
        { id: 'G3.3', name: 'Đến Lượt Con Rồi', duration: 180, component: G3_3_DenLuotConRoii, isGateway: false, isOptional: true },
        { id: 'G3.4', name: 'Tìm Hình Ghép Cặp', duration: 180, component: G3_4_TimHinhGhepCap, isGateway: false, isOptional: true },
        { id: 'G3.5', name: 'Mê Cung Đơn Giản', duration: 180, component: G3_5_MeCungDonGian, isGateway: false, isOptional: true }
      ]
    };
  }

  if (age >= 36 && age <= 60) {
    return {
      totalDuration: 35 * 60, 
      games: [
        { id: 'GW1', name: 'Bong Bóng Biết Bay', duration: 150, component: G1_1_Balloon, isGateway: true, isOptional: false },
        { id: 'GW2', name: 'Vỗ Tay Vui Nhộn', duration: 150, component: G1_2_Clapping, isGateway: true, isOptional: false },
        { id: 'GW3', name: 'Bé Ơi Quay Lại Nào', duration: 150, component: G1_3_Attention, isGateway: true, isOptional: false },
        { id: 'G4.1', name: 'Vì Sao Thế Nhỉ', duration: 240, component: G4_1_ViSaoTheNhi, isGateway: false, isOptional: true },
        { id: 'G4.2', name: 'Sắp Xếp Câu Chuyện', duration: 240, component: G4_2_SapXepCauChuyen, isGateway: false, isOptional: true },
        { id: 'G4.3', name: 'Cửa Hàng Tí Hon', duration: 240, component: G4_3_CuaHangTiHon, isGateway: false, isOptional: true },
        { id: 'G4.4', name: 'Làm Theo Chỉ Dẫn', duration: 180, component: G4_4_LamTheoChiDan, isGateway: false, isOptional: true },
        { id: 'G4.5', name: 'Giải Mã Quy Tắc', duration: 180, component: G4_5_GiaiMaQuyTac, isGateway: false, isOptional: true }
      ]
    };
  }

  return {
    totalDuration: 15 * 60,
    games: [
      { id: 'GW1', name: 'Bong Bóng', duration: 120, component: G1_1_Balloon, isGateway: true, isOptional: false },
      { id: 'GW2', name: 'Vỗ Tay', duration: 120, component: G1_2_Clapping, isGateway: true, isOptional: false },
      { id: 'GW3', name: 'Bé Ơi', duration: 120, component: G1_3_Attention, isGateway: true, isOptional: false }
    ]
  };
};

// --- COMPONENT CHÍNH ---
export const GameEngine: React.FC<GameEngineProps> = ({
  age, themeId = 'default', specificAsset = null, childName, childId, assessmentId, userId,
  onFeatureCapture, onSessionEnd
}) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const latestAIResult = useRef<InferenceResult | null>(null);
  const allFeaturesBuffer = useRef<BehavioralFeature[]>([]);
  const gatewayResultsRef = useRef<GatewayResult[]>([]);

  // Timers & States
  const sessionStartTimeRef = useRef<number>(Date.now());
  const currentGameStartTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [config, setConfig] = useState<GameConfig | null>(null);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [inferenceStatus, setInferenceStatus] = useState('Đang khởi tạo...');
  const [currentGameTime, setCurrentGameTime] = useState(0);
  const [ageGroup, setAgeGroup] = useState<AgeGroupConfig | null>(null);
  
  const [phase, setPhase] = useState<SessionPhase>('gateway');
  const [adaptiveFlow, setAdaptiveFlow] = useState<'full' | 'reduced'>('full');
  const [gatewayResults, setGatewayResults] = useState<boolean[]>([]);
  
  // TÍNH NĂNG TẠM DỪNG (MỚI)
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(isPaused);

  const handleGameCompleteRef = useRef<(success: boolean) => void>(() => {});

  // --- HÀM ÉP TẮT CAMERA ---
  const forceStopCamera = useCallback(() => {
    try {
      inferenceService.dispose(); // Tắt AI
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop()); // Ép tắt luồng phần cứng
        videoRef.current.srcObject = null;
      }
      console.log("🔌 Đã ép tắt Camera thành công");
    } catch (err) {
      console.error("Lỗi khi tắt camera:", err);
    }
  }, []);

  const gatewayGames = useMemo(() => ageGroup?.games.filter(g => g.isGateway) || [], [ageGroup]);
  const ageSpecificGames = useMemo(() => ageGroup?.games.filter(g => !g.isGateway) || [], [ageGroup]);

  const getCurrentGames = useCallback(() => {
    if (!ageGroup) return [];
    if (phase === 'gateway') return gatewayGames; 
    return adaptiveFlow === 'reduced' ? ageSpecificGames.slice(0, 1) : ageSpecificGames;
  }, [phase, adaptiveFlow, ageGroup, gatewayGames, ageSpecificGames]);

  const currentGames = useMemo(() => getCurrentGames(), [getCurrentGames]);

  const getTotalGamesCount = useCallback(() => {
    if (!ageGroup) return 0;
    return phase === 'gateway' ? gatewayGames.length : gatewayGames.length + currentGames.length;
  }, [phase, ageGroup, gatewayGames, currentGames]);

  const getCompletedGamesCount = useCallback(() => {
    return phase === 'gateway' ? gatewayResults.length : gatewayGames.length + currentGameIndex;
  }, [phase, gatewayResults.length, gatewayGames.length, currentGameIndex]);

  const currentGame = phase === 'gateway' ? gatewayGames[currentGameIndex] : currentGames[currentGameIndex];
  const currentGameId = currentGame?.id;

  useEffect(() => {
    const group = getAgeGroupConfig(age);
    setAgeGroup(group);
    setCurrentGameIndex(0);
    setPhase('gateway');
    setAdaptiveFlow('full');
    setGatewayResults([]);
    sessionStartTimeRef.current = Date.now();

    if (group) {
      setConfig({
        ageRange: `${age}-${age + 6}`, jumpInterval: 2, duration: group.totalDuration, targetSizeRange: [40, 80], audioPrompts: [],
        theme: { id: themeId, name: themeId === 'default' ? 'Mặc định' : 'Theme', assets: specificAsset ? [specificAsset] : [], background: '#f0fdf4' }
      });
    }
  }, [age, themeId, specificAsset]);

  const calculateGameMetrics = useCallback((duration: number, gameId: string) => {
    return { attentionLevel: 0.8, engagementScore: 0.8, smileIntensity: 0.2, gazeStability: 80, completionRate: 1 };
  }, []);

  const calculateSessionSummary = useCallback((): SessionSummary => {
    return { attentionScore: 80, socialEngagement: 75, cognitiveScore: 85, gatewaySuccessRate: 100, adaptiveFlow, totalGamesPlayed: getCompletedGamesCount() };
  }, [adaptiveFlow, getCompletedGamesCount]);

  const decideAdaptiveFlow = useCallback((gatewayResults: boolean[]): GatewayDecision => {
    const successCount = gatewayResults.filter(r => r === true).length;
    if (successCount <= 1) {
      return { successCount, totalGames: gatewayResults.length, decision: 'reduced', reason: 'Trẻ chưa hợp tác tốt (4 game)' };
    } else {
      return { successCount, totalGames: gatewayResults.length, decision: 'full', reason: 'Trẻ hợp tác tốt (8 game)' };
    }
  }, []);

  const handleGameComplete = useCallback((success: boolean) => {
    if (!ageGroup) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const currentGame = phase === 'gateway' ? gatewayGames[currentGameIndex] : currentGames[currentGameIndex];
    if (!currentGame) return;

    const gameMetrics = calculateGameMetrics(currentGameTime, currentGame.id);

    if (phase === 'gateway') {
      const gatewayResult: GatewayResult = { gameId: currentGame.id, gameCode: currentGame.id, gameName: currentGame.name, success, duration: currentGameTime, completedAt: Date.now(), metrics: gameMetrics };
      gatewayResultsRef.current = [...gatewayResultsRef.current, gatewayResult];
      const newGatewayResults = [...gatewayResults, success];
      setGatewayResults(newGatewayResults);

      if (newGatewayResults.length === 3) {
        const decision = decideAdaptiveFlow(newGatewayResults);
        setAdaptiveFlow(decision.decision);
        setPhase('full');
        setCurrentGameIndex(0);
      } else {
        setCurrentGameIndex(prev => prev + 1);
      }
    } else {
      const isLastGame = currentGameIndex >= currentGames.length - 1;
      
      if (!isLastGame) {
        setCurrentGameIndex(prev => prev + 1);
      } else {
        // KẾT THÚC TOÀN BỘ PHIÊN ĐÁNH GIÁ (THÀNH CÔNG)
        forceStopCamera(); // Cúp điện Camera ngay lập tức
        
        const sessionResult: SessionResult = {
          status: 'completed', phase: 'full', adaptiveFlow, gatewayResults: gatewayResultsRef.current,
          totalGames: ageGroup.games.length, completedGames: getTotalGamesCount(), features: [...allFeaturesBuffer.current],
          summary: calculateSessionSummary(), childId, assessmentId, startedBy: userId, startedAt: sessionStartTimeRef.current, endedAt: Date.now(),
          deviceInfo: navigator.userAgent, parentAssisted: false, gatewayDecision: decideAdaptiveFlow(gatewayResults)
        };
        
        onSessionEnd(sessionResult);
      }
    }
  }, [currentGameIndex, phase, gatewayResults, gatewayGames, currentGames, ageGroup, onSessionEnd, childId, assessmentId, userId, currentGameTime, calculateGameMetrics, calculateSessionSummary, decideAdaptiveFlow, adaptiveFlow, getTotalGamesCount, forceStopCamera]);

  useEffect(() => { handleGameCompleteRef.current = handleGameComplete; }, [handleGameComplete]);

  // Vòng lặp thời gian có tính năng Tạm Dừng
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    if (!ageGroup || !currentGame || isPaused) return; // Nếu đang Pause thì không đếm giờ nữa

    // Khi resume, cập nhật lại mốc bắt đầu để tránh bị nhảy thời gian
    currentGameStartTimeRef.current = Date.now() - (currentGameTime * 1000);
    
    if (timerRef.current) clearTimeout(timerRef.current);

    const updateTimer = () => {
      if (isPausedRef.current) return; // Bảo mật 2 lớp chống đếm giờ

      const now = Date.now();
      const elapsedSeconds = Math.floor((now - currentGameStartTimeRef.current) / 1000);
      setCurrentGameTime(elapsedSeconds);

      if (elapsedSeconds >= currentGame.duration) {
        handleGameCompleteRef.current(false);
      } else {
        timerRef.current = setTimeout(updateTimer, 100);
      }
    };

    timerRef.current = setTimeout(updateTimer, 100);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [currentGameId, ageGroup, isPaused]); // Thêm isPaused vào mảng phụ thuộc

  useEffect(() => {
    let isMounted = true;
    const initCam = async () => {
      if (!videoRef.current) return;
      try {
        const success = await inferenceService.initialize(videoRef.current);
        
        if (!isMounted) {
          console.log("👻 Phát hiện luồng AI bật lên muộn sau khi đã thoát, đang dập tắt...");
          inferenceService.dispose();
          forceStopCamera();
          return;
        }

        if (success) {
          setIsCameraInitialized(true);
          setInferenceStatus('AI đang chạy');
          inferenceService.startContinuousInference((result) => {
            if (!isPausedRef.current) latestAIResult.current = result;
          });
        }
      } catch (err) {
        if (isMounted) {
          setInferenceStatus('Lỗi camera');
          setIsCameraInitialized(true);
        }
      }
    };
    
    const timeoutId = setTimeout(initCam, 500);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      forceStopCamera(); // Dọn dẹp khi Component bị gỡ
    };
  }, [forceStopCamera]);

  const handleFeatureCapture = useCallback((feature: BehavioralFeature) => {
    if (!ageGroup || isPaused) return;
    const games = phase === 'gateway' ? gatewayGames : currentGames;
    const currentGame = games[currentGameIndex];
    
    const enriched: BehavioralFeature = {
      ...feature, gameId: currentGame?.id || 'unknown', gameName: currentGame?.name || 'Unknown',
      phase, adaptiveFlow, sessionTime: Math.floor((Date.now() - sessionStartTimeRef.current) / 1000),
      childName, childId, assessmentId
    };
    
    allFeaturesBuffer.current.push(enriched);
    onFeatureCapture(enriched);
  }, [currentGameIndex, phase, adaptiveFlow, ageGroup, gatewayGames, currentGames, childName, childId, assessmentId, onFeatureCapture, isPaused]);

  // --- CÁC HÀM XỬ LÝ NÚT BẤM (MỚI) ---
  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  // Trong file GameEngine.tsx

  const handleForceEnd = () => {
    forceStopCamera();
    const abortResult: SessionResult = {
      status: 'aborted', reason: 'user_cancelled', phase, adaptiveFlow, gatewayResults: gatewayResultsRef.current,
      totalGames: adaptiveFlow === 'full' ? 8 : 4, completedGames: getCompletedGamesCount(), features: [...allFeaturesBuffer.current],
      summary: {}, childId, assessmentId, startedBy: userId, startedAt: sessionStartTimeRef.current, endedAt: Date.now(),
      deviceInfo: navigator.userAgent, parentAssisted: false
    };
    setTimeout(() => {
      console.log("🛑 Gửi lệnh kết thúc sớm về component cha");
      onSessionEnd(abortResult);
    }, 100);
  };

  if (!config || !ageGroup) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px', color: '#64748b' }}>⏳ Đang tải...</div>;
  }

  const totalGamesCount = getTotalGamesCount();
  const completedGames = getCompletedGamesCount();

  return (
    <div className="game-engine-container">
      <style>{globalStyles}</style>

      {/* --- MÀN HÌNH OVERLAY KHI TẠM DỪNG (MỚI) --- */}
      {isPaused && (
        <div className="pause-overlay">
          <div className="pause-box">
            <h2 className="pause-title">ĐÁNH GIÁ ĐANG TẠM DỪNG</h2>
            <p className="pause-desc">Trò chơi và AI đã được dừng tạm thời. Bạn có thể tiếp tục khi bé đã sẵn sàng.</p>
            <div className="pause-actions">
              <button className="btn-resume" onClick={handleResume}>▶ Tiếp tục ngay</button>
              <button className="btn-end-early" onClick={handleForceEnd}>⏹ Kết thúc sớm</button>
            </div>
          </div>
        </div>
      )}

      <video ref={videoRef} autoPlay muted playsInline className="hidden-video" />

      <div className="game-content">
        {currentGame?.component && !isPaused && (
          <currentGame.component
            config={config} latestAIResult={latestAIResult} onFeatureCapture={handleFeatureCapture}
            timeElapsed={currentGameTime} childName={childName} gameDuration={currentGame.duration} onGameComplete={handleGameComplete}
          />
        )}
      </div>

      <div className="game-status-bar">
        <div className="status-left">
          <span className={`phase-badge ${phase === 'gateway' ? 'phase-gateway' : adaptiveFlow === 'full' ? 'phase-full' : 'phase-reduced'}`}>
            {phase === 'gateway' ? '🔷 GATEWAY' : adaptiveFlow === 'full' ? '✨ ĐẦY ĐỦ (8 GAME)' : '🔹 RÚT GỌN (4 GAME)'}
          </span>
          <span>🧒 {childName || "Bé yêu"}</span>
          <span>🎮 {currentGame?.name}</span>
          <span>⏱️ {currentGameTime}s / {currentGame?.duration}s</span>
          <span>📊 {completedGames}/{totalGamesCount}</span>
        </div>

        {/* NÚT TẠM DỪNG TRÊN THANH TRẠNG THÁI */}
        <div className="status-right">
          <span>{isCameraInitialized ? `👁️ AI: ${inferenceStatus}` : '⏳...'}</span>
          <button className="btn-pause" onClick={handlePause}>⏸ Tạm dừng</button>
        </div>
      </div>

      <div className="game-progress-container">
        <div className="game-progress-fill" style={{ width: `${(completedGames / totalGamesCount) * 100}%` }} />
      </div>
    </div>
  );
};

export default GameEngine;