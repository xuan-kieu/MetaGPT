import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  BehavioralFeature, 
  InferenceResult, 
  GameConfig, 
  GameEngineProps,
  GameModule,
  AgeGroupConfig,
  SessionPhase,
  GatewayResult,
  SessionResult,
  SessionSummary,
  AdaptiveFlow,
  GatewayDecision
} from '../types';
import inferenceService from '../services/InferenceService';

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

// --- CSS STYLES ---
const globalStyles = `
  :root {
    --primary: #6366f1;
    --primary-hover: #4f46e5;
    --slate-50: #f8fafc;
    --slate-200: #e2e8f0;
    --slate-800: #1e293b;
    --emerald-500: #10b981;
    --white: #ffffff;
    --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    --amber-500: #f59e0b;
    --red-500: #ef4444;
    --blue-500: #3b82f6;
    --purple-500: #8b5cf6;
    --indigo-500: #6366f1;
  }

  .game-engine-container {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--slate-50);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    position: relative;
    overflow: hidden;
  }

  .game-content {
    flex: 1;
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    overflow: hidden;
  }

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

  .phase-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .phase-gateway {
    background-color: var(--amber-500);
    color: var(--white);
  }

  .phase-full {
    background-color: var(--emerald-500);
    color: var(--white);
  }

  .phase-reduced {
    background-color: var(--blue-500);
    color: var(--white);
  }

  .gateway-result {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
    margin: 0 2px;
  }

  .gateway-success {
    background-color: var(--emerald-500);
  }

  .gateway-failure {
    background-color: var(--red-500);
  }

  .gateway-pending {
    background-color: var(--slate-200);
  }

  .game-progress-container {
    height: 6px;
    background-color: var(--slate-200);
    width: 100%;
  }

  .game-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--emerald-500), var(--indigo-500));
    transition: width 0.3s ease;
  }

  .game-nav-bar {
    padding: 15px 20px;
    background-color: var(--white);
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
    border-top: 1px solid var(--slate-200);
    overflow-x: auto;
  }

  .nav-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.2s;
    white-space: nowrap;
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

  .nav-btn.played {
    background-color: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }

  .nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .hidden-video {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    z-index: -1;
  }

  .adaptive-flow-badge {
    background: linear-gradient(135deg, var(--purple-500), var(--blue-500));
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    margin-left: 10px;
  }

  .game-info-overlay {
    position: absolute;
    top: 20px;
    left: 20px;
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 12px 20px;
    border-radius: 30px;
    font-size: 14px;
    z-index: 100;
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255,255,255,0.2);
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  }

  .gateway-summary {
    display: flex;
    gap: 8px;
    align-items: center;
    background: rgba(255,255,255,0.2);
    padding: 4px 12px;
    border-radius: 20px;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .loading-pulse {
    animation: pulse 1.5s ease-in-out infinite;
  }
`;

// --- HÀM CHỌN GAME THEO ĐỘ TUỔI (ĐÃ CẬP NHẬT ĐÚNG SỐ LƯỢNG) ---
const getAgeGroupConfig = (age: number): AgeGroupConfig | null => {
  if (age >= 12 && age < 18) {
    return {
      totalDuration: 20 * 60, // 20 phút cho 8 game
      games: [
        // 3 GATEWAY GAMES - BẮT BUỘC CHO MỌI LỨA TUỔI
        { id: 'GW1', name: 'Bong Bóng Biết Bay', duration: 150, component: G1_1_Balloon, isGateway: true, isOptional: false },
        { id: 'GW2', name: 'Vỗ Tay Vui Nhộn', duration: 150, component: G1_2_Clapping, isGateway: true, isOptional: false },
        { id: 'GW3', name: 'Bé Ơi Quay Lại Nào', duration: 150, component: G1_3_Attention, isGateway: true, isOptional: false },
        // 5 GAME RIÊNG CỦA NHÓM 12-18 THÁNG
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
      totalDuration: 25 * 60, // 25 phút cho 8 game
      games: [
        // 3 GATEWAY GAMES - BẮT BUỘC CHO MỌI LỨA TUỔI
        { id: 'GW1', name: 'Bong Bóng Biết Bay', duration: 150, component: G1_1_Balloon, isGateway: true, isOptional: false },
        { id: 'GW2', name: 'Vỗ Tay Vui Nhộn', duration: 150, component: G1_2_Clapping, isGateway: true, isOptional: false },
        { id: 'GW3', name: 'Bé Ơi Quay Lại Nào', duration: 150, component: G1_3_Attention, isGateway: true, isOptional: false },
        // 5 GAME RIÊNG CỦA NHÓM 18-24 THÁNG
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
      totalDuration: 30 * 60, // 30 phút cho 8 game
      games: [
        // 3 GATEWAY GAMES - BẮT BUỘC CHO MỌI LỨA TUỔI
        { id: 'GW1', name: 'Bong Bóng Biết Bay', duration: 150, component: G1_1_Balloon, isGateway: true, isOptional: false },
        { id: 'GW2', name: 'Vỗ Tay Vui Nhộn', duration: 150, component: G1_2_Clapping, isGateway: true, isOptional: false },
        { id: 'GW3', name: 'Bé Ơi Quay Lại Nào', duration: 150, component: G1_3_Attention, isGateway: true, isOptional: false },
        // 5 GAME RIÊNG CỦA NHÓM 2-3 TUỔI
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
      totalDuration: 35 * 60, // 35 phút cho 8 game
      games: [
        // 3 GATEWAY GAMES - BẮT BUỘC CHO MỌI LỨA TUỔI
        { id: 'GW1', name: 'Bong Bóng Biết Bay', duration: 150, component: G1_1_Balloon, isGateway: true, isOptional: false },
        { id: 'GW2', name: 'Vỗ Tay Vui Nhộn', duration: 150, component: G1_2_Clapping, isGateway: true, isOptional: false },
        { id: 'GW3', name: 'Bé Ơi Quay Lại Nào', duration: 150, component: G1_3_Attention, isGateway: true, isOptional: false },
        // 5 GAME RIÊNG CỦA NHÓM 3-5 TUỔI
        { id: 'G4.1', name: 'Vì Sao Thế Nhỉ', duration: 240, component: G4_1_ViSaoTheNhi, isGateway: false, isOptional: true },
        { id: 'G4.2', name: 'Sắp Xếp Câu Chuyện', duration: 240, component: G4_2_SapXepCauChuyen, isGateway: false, isOptional: true },
        { id: 'G4.3', name: 'Cửa Hàng Tí Hon', duration: 240, component: G4_3_CuaHangTiHon, isGateway: false, isOptional: true },
        { id: 'G4.4', name: 'Làm Theo Chỉ Dẫn', duration: 180, component: G4_4_LamTheoChiDan, isGateway: false, isOptional: true },
        { id: 'G4.5', name: 'Giải Mã Quy Tắc', duration: 180, component: G4_5_GiaiMaQuyTac, isGateway: false, isOptional: true }
      ]
    };
  }

  // Fallback cho độ tuổi không được hỗ trợ
  return {
    totalDuration: 15 * 60,
    games: [
      { id: 'GW1', name: 'Bong Bóng', duration: 120, component: G1_1_Balloon, isGateway: true, isOptional: false },
      { id: 'GW2', name: 'Vỗ Tay', duration: 120, component: G1_2_Clapping, isGateway: true, isOptional: false },
      { id: 'GW3', name: 'Bé Ơi', duration: 120, component: G1_3_Attention, isGateway: true, isOptional: false },
      { id: 'F1', name: 'Game mẫu 1', duration: 120, component: G1_4_Peekaboo, isGateway: false, isOptional: true },
      { id: 'F2', name: 'Game mẫu 2', duration: 120, component: G1_5_ToyTracking, isGateway: false, isOptional: true },
      { id: 'F3', name: 'Game mẫu 3', duration: 120, component: G1_4_Peekaboo, isGateway: false, isOptional: true },
      { id: 'F4', name: 'Game mẫu 4', duration: 120, component: G1_2_Clapping, isGateway: false, isOptional: true },
      { id: 'F5', name: 'Game mẫu 5', duration: 120, component: G1_3_Attention, isGateway: false, isOptional: true }
    ]
  };
};

// --- COMPONENT CHÍNH ---
export const GameEngine: React.FC<GameEngineProps> = ({
  age,
  themeId = 'default',
  specificAsset = null,
  childName,
  childId,
  assessmentId,
  userId,
  onFeatureCapture,
  onSessionEnd
}) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const latestAIResult = useRef<InferenceResult | null>(null);
  const allFeaturesBuffer = useRef<BehavioralFeature[]>([]);
  const gatewayResultsRef = useRef<GatewayResult[]>([]);

  // Timers
  const sessionStartTimeRef = useRef<number>(Date.now());
  const currentGameStartTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [inferenceStatus, setInferenceStatus] = useState('Đang khởi tạo...');
  const [currentGameTime, setCurrentGameTime] = useState(0);
  const [ageGroup, setAgeGroup] = useState<AgeGroupConfig | null>(null);
  
  // State cho gateway games và adaptive flow
  const [phase, setPhase] = useState<SessionPhase>('gateway');
  const [adaptiveFlow, setAdaptiveFlow] = useState<'full' | 'reduced'>('full');
  const [gatewayResults, setGatewayResults] = useState<boolean[]>([]);
  const [isSessionEnding, setIsSessionEnding] = useState(false);

  // Ref để lưu hàm handleGameComplete mới nhất
  const handleGameCompleteRef = useRef<(success: boolean) => void>(() => {});

  // Lấy danh sách gateway games (3 game đầu)
  const gatewayGames = ageGroup?.games.filter(g => g.isGateway) || [];
  
  // Lấy danh sách game riêng của nhóm tuổi (5 game sau)
  const ageSpecificGames = ageGroup?.games.filter(g => !g.isGateway) || [];

  // Xác định danh sách game hiện tại dựa trên phase và adaptive flow
  const getCurrentGames = useCallback(() => {
    if (!ageGroup) return [];
    
    if (phase === 'gateway') {
      return gatewayGames; // 3 game gateway
    } else {
      // Sau gateway, chọn số lượng game riêng phù hợp
      if (adaptiveFlow === 'reduced') {
        // Phiên rút gọn: chỉ chơi 4/5 game riêng
        return ageSpecificGames.slice(0, 4);
      } else {
        // Phiên đầy đủ: chơi cả 5 game riêng
        return ageSpecificGames;
      }
    }
  }, [phase, adaptiveFlow, ageGroup, gatewayGames, ageSpecificGames]);

  const currentGames = getCurrentGames();

  // Tính tổng số game dựa trên adaptive flow
  const getTotalGamesCount = useCallback(() => {
    if (!ageGroup) return 0;
    
    if (phase === 'gateway') {
      return gatewayGames.length; // 3 game
    } else {
      // 3 gateway + số game riêng hiện tại
      return gatewayGames.length + currentGames.length;
    }
  }, [phase, ageGroup, gatewayGames, currentGames]);

  // Tính số game đã hoàn thành
  const getCompletedGamesCount = useCallback(() => {
    if (phase === 'gateway') {
      return gatewayResults.length;
    } else {
      return gatewayGames.length + currentGameIndex;
    }
  }, [phase, gatewayResults.length, gatewayGames.length, currentGameIndex]);

  // 1. Khởi tạo danh sách game và config
  useEffect(() => {
    const group = getAgeGroupConfig(age);
    setAgeGroup(group);
    setCurrentGameIndex(0);
    setPhase('gateway');
    setAdaptiveFlow('full');
    setGatewayResults([]);
    gatewayResultsRef.current = [];
    setIsSessionEnding(false);
    sessionStartTimeRef.current = Date.now();

    if (group) {
      const defaultConfig: GameConfig = {
        ageRange: `${age}-${age + 6}`,
        jumpInterval: 2,
        duration: group.totalDuration,
        targetSizeRange: [40, 80],
        audioPrompts: [],
        theme: {
          id: themeId || 'default',
          name: themeId === 'default' ? 'Mặc định' : 'Chủ đề đã chọn',
          assets: specificAsset ? [specificAsset] : [],
          background: '#f0fdf4',
        }
      };
      setConfig(defaultConfig);
    }
  }, [age, themeId, specificAsset]);

  // Hàm tính toán metrics cho từng game
  const calculateGameMetrics = useCallback((duration: number, gameId: string) => {
    const gameFeatures = allFeaturesBuffer.current.filter(f => f.gameId === gameId);
    
    if (gameFeatures.length === 0) {
      return {
        attentionLevel: 0.5,
        engagementScore: 0.5,
        smileIntensity: 0,
        gazeStability: 50,
        completionRate: duration / 120
      };
    }
    
    const avgAttention = gameFeatures.reduce((sum, f) => sum + f.attentionLevel, 0) / gameFeatures.length;
    const avgSmile = gameFeatures.reduce((sum, f) => sum + f.smileIntensity, 0) / gameFeatures.length;
    const gazeStability = calculateGazeStability(gameFeatures);
    
    return {
      attentionLevel: avgAttention,
      engagementScore: (avgAttention + avgSmile) / 2,
      smileIntensity: avgSmile,
      gazeStability: gazeStability,
      completionRate: duration / (ageGroup?.games.find(g => g.id === gameId)?.duration || 120)
    };
  }, [ageGroup]);

  // Hàm tính độ ổn định của gaze
  const calculateGazeStability = (features: BehavioralFeature[]): number => {
    if (features.length < 5) return 50;
    
    const gazePoints = features
      .filter(f => f.gazeX !== undefined && f.gazeY !== undefined)
      .map(f => ({ x: f.gazeX!, y: f.gazeY! }));
    
    if (gazePoints.length < 5) return 50;
    
    let totalDistance = 0;
    for (let i = 1; i < gazePoints.length; i++) {
      const dx = gazePoints[i].x - gazePoints[i-1].x;
      const dy = gazePoints[i].y - gazePoints[i-1].y;
      totalDistance += Math.sqrt(dx*dx + dy*dy);
    }
    
    const avgDistance = totalDistance / (gazePoints.length - 1);
    return Math.max(0, 100 - Math.min(avgDistance * 10, 100));
  };

  // Hàm tính summary tổng thể
  const calculateSessionSummary = useCallback((): SessionSummary => {
    const features = allFeaturesBuffer.current;
    if (features.length === 0) return {};
    
    const avgAttention = features.reduce((sum, f) => sum + f.attentionLevel, 0) / features.length;
    const smileFeatures = features.filter(f => f.smileIntensity > 0.5);
    const smileFrequency = smileFeatures.length / features.length;
    const gazeStability = calculateGazeStability(features);
    const vocalFeatures = features.filter(f => (f.vocalVolume || 0) > 0.1);
    const vocalizationRate = vocalFeatures.length / features.length;
    const gatewaySuccessRate = gatewayResultsRef.current.length > 0 
      ? gatewayResultsRef.current.filter(r => r.success).length / gatewayResultsRef.current.length 
      : 0;
    
    const totalGamesPlayed = phase === 'gateway' 
      ? gatewayResults.length 
      : gatewayGames.length + currentGames.length;
    
    return {
      attentionScore: avgAttention * 100,
      socialEngagement: (avgAttention * 0.3 + smileFrequency * 0.7) * 100,
      cognitiveScore: (gatewaySuccessRate * 0.5 + avgAttention * 0.5) * 100,
      gazeStability: gazeStability,
      smileFrequency: smileFrequency * 100,
      vocalizationRate: vocalizationRate * 100,
      gatewaySuccessRate: gatewaySuccessRate * 100,
      averageAttention: avgAttention,
      totalDuration: (Date.now() - sessionStartTimeRef.current) / 1000,
      adaptiveFlow: adaptiveFlow,
      totalGamesPlayed: totalGamesPlayed,
      gatewayResults: gatewayResultsRef.current
    };
  }, [adaptiveFlow, gatewayGames.length, currentGames.length, phase, gatewayResults.length]);

  // 2. Hàm quyết định luồng thích ứng dựa trên kết quả gateway
  const decideAdaptiveFlow = useCallback((gatewayResults: boolean[]): GatewayDecision => {
    const successCount = gatewayResults.filter(r => r === true).length;
    const totalGames = gatewayResults.length;
    
    // Nếu trẻ thất bại ≥2/3 gateway games (chỉ thắng 0-1) → Phiên rút gọn: 3 gateway + 4 game riêng = 7 game
    if (successCount <= 1) {
      return {
        successCount,
        totalGames,
        decision: 'reduced',
        reason: 'Trẻ chưa hợp tác tốt, chuyển sang phiên rút gọn (3 gateway + 4 game riêng = 7 game) để ưu tiên các dấu hiệu lõi'
      };
    } else {
      // Nếu trẻ thành công ≥2/3 (thắng 2-3) → Phiên đầy đủ: 3 gateway + 5 game riêng = 8 game
      return {
        successCount,
        totalGames,
        decision: 'full',
        reason: 'Trẻ hợp tác tốt, tiếp tục phiên đánh giá đầy đủ (3 gateway + 5 game riêng = 8 game)'
      };
    }
  }, []);

  // 3. Định nghĩa hàm xử lý kết thúc game
  const handleGameComplete = useCallback((success: boolean) => {
    if (!ageGroup || isSessionEnding) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const currentGame = phase === 'gateway' 
      ? gatewayGames[currentGameIndex]
      : currentGames[currentGameIndex];

    if (!currentGame) return;

    console.log(`🎮 Game ${currentGame.id} - ${currentGame.name} completed with success: ${success}`);

    const gameMetrics = calculateGameMetrics(currentGameTime, currentGame.id);

    if (phase === 'gateway') {
      // Lưu kết quả gateway
      const gatewayResult: GatewayResult = {
        gameId: currentGame.id,
        gameCode: currentGame.id,
        gameName: currentGame.name,
        success: success,
        duration: currentGameTime,
        completedAt: Date.now(),
        metrics: gameMetrics
      };
      
      gatewayResultsRef.current = [...gatewayResultsRef.current, gatewayResult];
      const newGatewayResults = [...gatewayResults, success];
      setGatewayResults(newGatewayResults);

      console.log(`📊 Gateway progress: ${newGatewayResults.length}/3`);

      // Kiểm tra nếu đã chơi hết 3 gateway games
      if (newGatewayResults.length === 3) {
        // Quyết định luồng thích ứng
        const decision = decideAdaptiveFlow(newGatewayResults);
        setAdaptiveFlow(decision.decision);
        
        const totalGames = decision.decision === 'full' ? 8 : 7;
        console.log(`📊 Gateway Results: ${decision.successCount}/3 thành công`);
        console.log(`🔄 Quyết định: ${decision.decision === 'full' ? 'Phiên đầy đủ (8 game)' : 'Phiên rút gọn (7 game)'}`);
        console.log(`📝 Lý do: ${decision.reason}`);

        // Chuyển sang phase full với số lượng game phù hợp
        setPhase('full');
        setCurrentGameIndex(0); // Bắt đầu từ game riêng đầu tiên
      } else {
        // Chưa hết gateway: chuyển sang gateway tiếp theo
        setCurrentGameIndex(prev => prev + 1);
      }
    } else {
      // Full phase: kiểm tra nếu là reduced flow thì chỉ chơi 4 game riêng
      const isLastGame = currentGameIndex >= currentGames.length - 1;
      
      if (!isLastGame) {
        setCurrentGameIndex(prev => prev + 1);
      } else {
        // Kết thúc phiên
        const totalGamesPlayed = gatewayGames.length + currentGames.length;
        console.log(`✅ Hoàn thành phiên ${adaptiveFlow === 'full' ? 'đầy đủ' : 'rút gọn'} (${totalGamesPlayed} game)`);
        setIsSessionEnding(true);
        
        const sessionResult: SessionResult = {
          status: 'completed',
          phase: 'full',
          adaptiveFlow: adaptiveFlow,
          gatewayResults: gatewayResultsRef.current,
          totalGames: ageGroup.games.length,
          completedGames: totalGamesPlayed,
          features: [...allFeaturesBuffer.current],
          summary: calculateSessionSummary(),
          childId,
          assessmentId,
          startedBy: userId,
          startedAt: sessionStartTimeRef.current,
          endedAt: Date.now(),
          deviceInfo: navigator.userAgent,
          parentAssisted: false,
          gatewayDecision: decideAdaptiveFlow(gatewayResults)
        };
        
        onSessionEnd(sessionResult);
      }
    }
  }, [
    currentGameIndex, phase, gatewayResults, gatewayGames, currentGames,
    ageGroup, onSessionEnd, isSessionEnding, childId, 
    assessmentId, userId, currentGameTime, calculateGameMetrics, 
    calculateSessionSummary, decideAdaptiveFlow, adaptiveFlow
  ]);

  // Cập nhật ref
  useEffect(() => {
    handleGameCompleteRef.current = handleGameComplete;
  }, [handleGameComplete]);

  // 4. Vòng lặp thời gian
  useEffect(() => {
    if (!ageGroup || isSessionEnding) return;
    
    const games = phase === 'gateway' ? gatewayGames : currentGames;
    const currentGame = games[currentGameIndex];
    
    if (!currentGame) return;

    currentGameStartTimeRef.current = Date.now();
    setCurrentGameTime(0);

    if (timerRef.current) clearTimeout(timerRef.current);

    const updateTimer = () => {
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
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentGameIndex, phase, ageGroup, gatewayGames, currentGames, isSessionEnding]);

  // 5. Khởi tạo camera
  useEffect(() => {
    let isMounted = true;
    const initCam = async () => {
      if (!videoRef.current) return;
      setInferenceStatus('Đang bật camera...');
      try {
        const success = await inferenceService.initialize(videoRef.current);
        if (!isMounted) return;
        if (success) {
          setIsCameraInitialized(true);
          setInferenceStatus('AI đang chạy');
          inferenceService.startContinuousInference((result) => {
            latestAIResult.current = result;
          });
        } else {
          setInferenceStatus('Giả lập');
          setIsCameraInitialized(true);
        }
      } catch (err) {
        console.error('Lỗi khởi tạo camera:', err);
        setInferenceStatus('Lỗi camera');
        setIsCameraInitialized(true);
      }
    };
    
    const timeoutId = setTimeout(initCam, 500);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      inferenceService.dispose();
    };
  }, []);

  // 6. Xử lý feature capture
  const handleFeatureCapture = useCallback((feature: BehavioralFeature) => {
    if (!ageGroup || isSessionEnding) return;
    
    const games = phase === 'gateway' ? gatewayGames : currentGames;
    const currentGame = games[currentGameIndex];
    
    const enriched: BehavioralFeature = {
      ...feature,
      gameId: currentGame?.id || 'unknown',
      gameName: currentGame?.name || 'Unknown',
      phase: phase,
      adaptiveFlow: adaptiveFlow,
      sessionTime: Math.floor((Date.now() - sessionStartTimeRef.current) / 1000),
      childName,
      childId,
      assessmentId
    };
    
    allFeaturesBuffer.current.push(enriched);
    onFeatureCapture(enriched);
  }, [currentGameIndex, phase, adaptiveFlow, ageGroup, gatewayGames, currentGames, childName, childId, assessmentId, onFeatureCapture, isSessionEnding]);

  // 7. Xử lý unmount
  useEffect(() => {
    return () => {
      if (!isSessionEnding && allFeaturesBuffer.current.length > 0) {
        const abortResult: SessionResult = {
          status: 'aborted',
          reason: 'user_cancelled',
          phase: phase,
          adaptiveFlow: adaptiveFlow,
          gatewayResults: gatewayResultsRef.current,
          totalGames: ageGroup?.games.length || 0,
          completedGames: phase === 'gateway' ? gatewayResults.length : gatewayGames.length + currentGames.length,
          features: [...allFeaturesBuffer.current],
          summary: calculateSessionSummary(),
          childId,
          assessmentId,
          startedBy: userId,
          startedAt: sessionStartTimeRef.current,
          endedAt: Date.now(),
          deviceInfo: navigator.userAgent,
          parentAssisted: false
        };
        
        onSessionEnd(abortResult);
      }
    };
  }, [isSessionEnding, phase, adaptiveFlow, gatewayResults.length, currentGames.length, gatewayGames.length, ageGroup, childId, assessmentId, userId, onSessionEnd, calculateSessionSummary]);

  if (!config || !ageGroup) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#64748b',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <div className="loading-pulse">
          ⏳ Đang tải cấu hình trò chơi...
        </div>
      </div>
    );
  }

  const currentGame = currentGames[currentGameIndex];
  const totalSessionTime = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
  const totalGamesCount = getTotalGamesCount();
  const completedGames = getCompletedGamesCount();

  // Xác định phase display name
  const getPhaseDisplayName = () => {
    if (phase === 'gateway') return '🔷 GATEWAY (3 GAME)';
    
    const totalGames = gatewayGames.length + currentGames.length;
    return adaptiveFlow === 'full' 
      ? `✨ ĐẦY ĐỦ (${totalGames} GAME)` 
      : `🔹 RÚT GỌN (${totalGames} GAME)`;
  };

  return (
    <div className="game-engine-container">
      <style>{globalStyles}</style>

      {/* Video ẩn cho AI */}
      <video ref={videoRef} autoPlay muted playsInline className="hidden-video" />

      {/* Khu vực chính hiển thị game */}
      <div className="game-content">
        {currentGame?.component && (
          <currentGame.component
            config={config}
            latestAIResult={latestAIResult}
            onFeatureCapture={handleFeatureCapture}
            timeElapsed={currentGameTime}
            childName={childName}
            gameDuration={currentGame.duration}
            onGameComplete={handleGameComplete}
          />
        )}
      </div>

      {/* Overlay thông tin */}
      {phase !== 'gateway' && (
        <div className="game-info-overlay">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div className="gateway-summary">
              <span>Gateway:</span>
              {gatewayResults.map((result, idx) => (
                <span
                  key={idx}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: result ? '#10b981' : '#ef4444',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: 'white'
                  }}
                >
                  {idx + 1}
                </span>
              ))}
            </div>
            <div>
              {adaptiveFlow === 'full' 
                ? '🎯 3 Gateway + 5 game chuyên sâu = 8 game' 
                : '📋 3 Gateway + 4 game cốt lõi = 7 game'}
            </div>
          </div>
        </div>
      )}

      {/* Thanh trạng thái */}
      <div className="game-status-bar">
        <span>
          <span className={`phase-badge ${phase === 'gateway' ? 'phase-gateway' : adaptiveFlow === 'full' ? 'phase-full' : 'phase-reduced'}`}>
            {getPhaseDisplayName()}
          </span>
        </span>
        
        {phase === 'gateway' && gatewayResults.length > 0 && (
          <span>
            Kết quả: 
            {gatewayResults.map((result, idx) => (
              <span
                key={idx}
                className={`gateway-result ${
                  result === true ? 'gateway-success' : 
                  result === false ? 'gateway-failure' : 'gateway-pending'
                }`}
                title={`Game ${idx + 1}: ${result ? 'Thành công' : 'Thất bại'}`}
              />
            ))}
          </span>
        )}
        
        {phase !== 'gateway' && gatewayResults.length > 0 && (
          <span>
            <span style={{ color: '#10b981' }}>✓ {gatewayResults.filter(r => r).length}/3 gateway</span>
            <span style={{ marginLeft: '8px', color: adaptiveFlow === 'full' ? '#10b981' : '#f59e0b' }}>
              {adaptiveFlow === 'full' ? '✨ Full (8 game)' : '🔹 Reduced (7 game)'}
            </span>
          </span>
        )}
        
        <span>|</span>
        <span>{isCameraInitialized ? `👁️ AI: ${inferenceStatus}` : '⏳ Đang khởi tạo camera...'}</span>
        <span>|</span>
        <span>🧒 {childName || "Bé yêu"}</span>
        <span>|</span>
        <span>🎮 {currentGame?.name}</span>
        <span>|</span>
        <span>⏱️ {currentGameTime}s / {currentGame?.duration}s</span>
        <span>|</span>
        <span>📊 {completedGames}/{totalGamesCount}</span>
      </div>

      {/* Thanh tiến trình tổng thể */}
      <div className="game-progress-container">
        <div
          className="game-progress-fill"
          style={{ 
            width: `${(completedGames / totalGamesCount) * 100}%` 
          }}
        />
      </div>

      {/* Nút điều hướng (debug) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="game-nav-bar">
          {ageGroup.games.map((game, index) => {
            const isGateway = index < 3;
            const isPlayed = index < (phase === 'gateway' ? currentGameIndex : gatewayGames.length + currentGameIndex);
            const isCurrent = index === (phase === 'gateway' ? currentGameIndex : gatewayGames.length + currentGameIndex);
            const isInReduced = !isGateway && adaptiveFlow === 'reduced' && index >= 7; // Game thứ 5 của nhóm (index 7) không được chơi trong reduced flow
            
            if (isInReduced) {
              return null;
            }
            
            return (
              <button
                key={game.id}
                className={`nav-btn ${isCurrent ? 'active' : isPlayed ? 'played' : 'inactive'}`}
                style={{
                  opacity: isPlayed || isCurrent ? 1 : 0.7
                }}
                disabled
              >
                {game.name} {isGateway ? '🔷' : '✨'}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GameEngine;