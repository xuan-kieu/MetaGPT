import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BehavioralFeature, InferenceResult, GameConfig, GameEngineProps, SubGameProps } from '../types';
import inferenceService from '../services/InferenceService';

// --- IMPORT CÁC GAME CON (ĐÃ CẬP NHẬT TÊN ĐÚNG THEO GATEWAY) ---

// Nhóm 12-18 tháng
import G1_1_BongBongVuiNhon from '../ageGroup/Group12_18/G1_1_Balloon';
import G1_2_VoTayCungBan from '../ageGroup/Group12_18/G1_2_Clapping';
import G1_3_BeOiQuayLaiNao from '../ageGroup/Group12_18/G1_3_Attention';
import G1_4_Peekaboo from '../ageGroup/Group12_18/G1_4_Peekaboo';
import G1_5_ToyTracking from '../ageGroup/Group12_18/G1_5_ToyTracking';

// Nhóm 18-24 tháng
import G2_1_ChiTayTinhMat from '../ageGroup/Group18_24/G2_1_ChiTayTinhMat';
import G2_2_XayThapCao from '../ageGroup/Group18_24/G2_2_XayThapCao';
import G2_3_TiengKeuCuaAi from '../ageGroup/Group18_24/G2_3_TiengKeuCuaAi';
import G2_4_ChoBupBeAn from '../ageGroup/Group18_24/G2_4_ChoBupBeAn';
import G2_5_TimBongHinh from '../ageGroup/Group18_24/G2_5_TimBongHinh';

// Nhóm 2-3 tuổi
import G3_1_VeDungNhaNao from '../ageGroup/Group2_3_year/G3_1_VeDungNhaNao';
import G3_2_CamXucGiDay from '../ageGroup/Group2_3_year/G3_2_CamXucGiDay';
import G3_3_DenLuotConRoii from '../ageGroup/Group2_3_year/G3_3_DenLuotConRoii';
import G3_4_TimHinhGhepCap from '../ageGroup/Group2_3_year/G3_4_TimHinhGhepCap';
import G3_5_MeCungDonGian from '../ageGroup/Group2_3_year/G3_5_MeCungDonGian';

// Nhóm 3-5 tuổi
import G4_1_ViSaoTheNhi from '../ageGroup/Group3_5year/G4_1_ViSaoTheNhi';
import G4_2_SapXepCauChuyen from '../ageGroup/Group3_5year/G4_2_SapXepCauChuyen';
import G4_3_CuaHangTiHon from '../ageGroup/Group3_5year/G4_3_CuaHangTiHon';
import G4_4_LamTheoChiDan from '../ageGroup/Group3_5year/G4_4_LamTheoChiDan';
import G4_5_GiaiMaQuyTac from '../ageGroup/Group3_5year/G4_5_GiaiMaQuyTac';

// --- CSS (giữ nguyên) ---
const globalStyles = ` ... `; // (giữ nguyên như code cũ)

// --- ĐỊNH NGHĨA CẤU TRÚC NHÓM TUỔI (MỞ RỘNG: thêm isGateway, isOptional) ---
interface AgeGroupConfig {
  totalDuration: number;
  games: Array<{
    id: string;
    name: string;
    duration: number;
    component: React.ComponentType<SubGameProps>;
    isGateway?: boolean;
    isOptional?: boolean;
  }>;
}

// --- HÀM CHỌN GAME THEO ĐỘ TUỔI (ĐÃ GẮN CỜ GATEWAY & OPTIONAL) ---
const getAgeGroupConfig = (age: number): AgeGroupConfig | null => {
  if (age >= 12 && age < 18) {
    return {
      totalDuration: 10 * 60,
      games: [
        { id: 'G1.1', name: 'Bong Bóng Vui Nhộn', duration: 120, component: G1_1_BongBongVuiNhon, isGateway: true, isOptional: false },
        { id: 'G1.2', name: 'Vỗ Tay Cùng Bạn', duration: 120, component: G1_2_VoTayCungBan, isGateway: true, isOptional: false },
        { id: 'G1.3', name: 'Bé Ơi Quay Lại Nào', duration: 120, component: G1_3_BeOiQuayLaiNao, isGateway: true, isOptional: false },
        { id: 'G1.4', name: 'Ú Òa Kỳ Diệu', duration: 120, component: G1_4_Peekaboo, isGateway: false, isOptional: false },
        { id: 'G1.5', name: 'Theo Dõi Đồ Chơi', duration: 120, component: G1_5_ToyTracking, isGateway: false, isOptional: true }, // tuỳ chọn
      ]
    };
  }

  if (age >= 18 && age < 24) {
    return {
      totalDuration: 13 * 60,
      games: [
        { id: 'G2.1', name: 'Chỉ Tay Tinh Mắt', duration: 180, component: G2_1_ChiTayTinhMat, isGateway: false, isOptional: false },
        { id: 'G2.2', name: 'Xây Tháp Cao', duration: 180, component: G2_2_XayThapCao, isGateway: false, isOptional: false },
        { id: 'G2.3', name: 'Tiếng Kêu Của Ai', duration: 120, component: G2_3_TiengKeuCuaAi, isGateway: false, isOptional: false },
        { id: 'G2.4', name: 'Cho Búp Bê Ăn', duration: 180, component: G2_4_ChoBupBeAn, isGateway: false, isOptional: false },
        { id: 'G2.5', name: 'Tìm Bóng Hình', duration: 120, component: G2_5_TimBongHinh, isGateway: false, isOptional: true },
      ]
    };
  }

  // (Các nhóm khác tương tự – đánh dấu gateway games theo đặc tả)
  if (age >= 24 && age < 36) {
    return {
      totalDuration: 15 * 60,
      games: [
        { id: 'G3.1', name: 'Về Đúng Nhà Nào', duration: 180, component: G3_1_VeDungNhaNao, isGateway: false, isOptional: false },
        { id: 'G3.2', name: 'Cảm Xúc Gì Đây', duration: 180, component: G3_2_CamXucGiDay, isGateway: false, isOptional: false },
        { id: 'G3.3', name: 'Đến Lượt Con Rồi', duration: 180, component: G3_3_DenLuotConRoii, isGateway: false, isOptional: false },
        { id: 'G3.4', name: 'Tìm Hình Ghép Cặp', duration: 180, component: G3_4_TimHinhGhepCap, isGateway: false, isOptional: false },
        { id: 'G3.5', name: 'Mê Cung Đơn Giản', duration: 180, component: G3_5_MeCungDonGian, isGateway: false, isOptional: true },
      ]
    };
  }

  if (age >= 36 && age <= 60) {
    return {
      totalDuration: 18 * 60,
      games: [
        { id: 'G4.1', name: 'Vì Sao Thế Nhỉ', duration: 240, component: G4_1_ViSaoTheNhi, isGateway: false, isOptional: false },
        { id: 'G4.2', name: 'Sắp Xếp Câu Chuyện', duration: 240, component: G4_2_SapXepCauChuyen, isGateway: false, isOptional: false },
        { id: 'G4.3', name: 'Cửa Hàng Tí Hon', duration: 240, component: G4_3_CuaHangTiHon, isGateway: false, isOptional: false },
        { id: 'G4.4', name: 'Làm Theo Chỉ Dẫn', duration: 180, component: G4_4_LamTheoChiDan, isGateway: false, isOptional: false },
        { id: 'G4.5', name: 'Giải Mã Quy Tắc', duration: 180, component: G4_5_GiaiMaQuyTac, isGateway: false, isOptional: true },
      ]
    };
  }

  // Fallback
  return {
    totalDuration: 10 * 60,
    games: [
      { id: 'TEST', name: 'Chưa hỗ trợ độ tuổi này', duration: 60, component: G1_1_BongBongVuiNhon, isGateway: false, isOptional: false }
    ]
  };
};

// --- COMPONENT CHÍNH ---
export const GameEngine: React.FC<GameEngineProps> = ({
  age,
  themeId,
  specificAsset,
  childName,
  onFeatureCapture,
  onSessionEnd
}) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const latestAIResult = useRef<InferenceResult | null>(null);
  const allFeaturesBuffer = useRef<BehavioralFeature[]>([]);

  // Timers
  const gameStartTimeRef = useRef<number>(Date.now());
  const currentGameStartTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- STATE MỚI CHO GATEWAY & ADAPTIVE ---
  const [phase, setPhase] = useState<'gateway' | 'adaptive' | 'completed'>('gateway');
  const [gatewayResults, setGatewayResults] = useState<Record<string, boolean>>({});
  const [finalGameList, setFinalGameList] = useState<AgeGroupConfig['games']>([]);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [gatewayCompleted, setGatewayCompleted] = useState(false);

  // State cũ
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [inferenceStatus, setInferenceStatus] = useState('Đang khởi tạo...');
  const [currentGameTime, setCurrentGameTime] = useState(0);
  const [ageGroup, setAgeGroup] = useState<AgeGroupConfig | null>(null);

  // 1. Khởi tạo danh sách game và config mặc định
  useEffect(() => {
    const group = getAgeGroupConfig(age);
    setAgeGroup(group);
    setCurrentGameIndex(0);
    setPhase('gateway');
    setGatewayResults({});
    setGatewayCompleted(false);

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
          assets: [],
          background: '#f0fdf4',
        }
      };
      setConfig(defaultConfig);
    }
  }, [age, themeId]);

  // 2. Khi tất cả gateway games hoàn tất, quyết định luồng
  useEffect(() => {
    if (!ageGroup || phase !== 'gateway' || gatewayCompleted) return;

    const gatewayGameIds = ageGroup.games.filter(g => g.isGateway).map(g => g.id);
    const completed = gatewayGameIds.every(id => id in gatewayResults);
    
    if (completed) {
      setGatewayCompleted(true);
      
      // Đếm số gateway thành công
      const successCount = gatewayGameIds.filter(id => gatewayResults[id] === true).length;
      const threshold = Math.ceil(gatewayGameIds.length * 2 / 3); // 2/3 của 3 = 2
      const isFullSession = successCount >= threshold;

      // Xây dựng danh sách game cho adaptive phase
      let gameList = [];
      if (isFullSession) {
        // Phiên đầy đủ: tất cả game (kể cả optional)
        gameList = ageGroup.games;
      } else {
        // Phiên rút gọn: chỉ gateway games + game cốt lõi (non-optional)
        gameList = ageGroup.games.filter(g => g.isGateway || !g.isOptional);
      }
      
      setFinalGameList(gameList);
      setPhase('adaptive');
      setCurrentGameIndex(0); // Bắt đầu từ game đầu tiên trong danh sách mới
    }
  }, [gatewayResults, phase, ageGroup, gatewayCompleted]);

  // 3. Vòng lặp thời gian (chỉ chạy khi có game hợp lệ)
  useEffect(() => {
    // Xác định danh sách game hiện tại dựa vào phase
    const currentGameList = phase === 'gateway' ? ageGroup?.games || [] : finalGameList;
    if (!currentGameList.length || !currentGameList[currentGameIndex]) return;

    const currentGame = currentGameList[currentGameIndex];
    currentGameStartTimeRef.current = Date.now();
    setCurrentGameTime(0);

    const updateTimer = () => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - currentGameStartTimeRef.current) / 1000);
      setCurrentGameTime(elapsedSeconds);

      if (elapsedSeconds >= currentGame.duration) {
        handleNextGame();
      } else {
        timerRef.current = setTimeout(updateTimer, 100);
      }
    };

    timerRef.current = setTimeout(updateTimer, 100);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentGameIndex, phase, ageGroup, finalGameList]);

  // 4. Khởi tạo camera & inference service (giữ nguyên)
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
        console.error(err);
        setIsCameraInitialized(true);
      }
    };
    setTimeout(initCam, 500);
    return () => {
      isMounted = false;
      inferenceService.dispose();
    };
  }, []);

  // ---------- HANDLER: KHI MỘT GAME HOÀN THÀNH (nhận kết quả từ onGameComplete) ----------
  const handleGameComplete = useCallback((gameId: string, success: boolean) => {
    // Nếu đang ở gateway phase và game đó là gateway, lưu kết quả
    if (phase === 'gateway' && ageGroup) {
      const game = ageGroup.games.find(g => g.id === gameId);
      if (game?.isGateway) {
        setGatewayResults(prev => ({ ...prev, [gameId]: success }));
      }
    }
    // Không tự động chuyển game ở đây – timer sẽ chuyển khi hết thời gian
  }, [phase, ageGroup]);

  // ---------- HANDLER: CHUYỂN GAME TIẾP THEO ----------
  const handleNextGame = useCallback(() => {
    // Xác định danh sách game hiện tại
    const currentGameList = phase === 'gateway' ? ageGroup?.games || [] : finalGameList;
    if (!currentGameList.length) return;

    const nextIndex = currentGameIndex + 1;
    if (nextIndex < currentGameList.length) {
      setCurrentGameIndex(nextIndex);
    } else {
      // Hết game: kết thúc session
      if (timerRef.current) clearTimeout(timerRef.current);
      onSessionEnd(allFeaturesBuffer.current);
    }
  }, [phase, ageGroup, finalGameList, currentGameIndex, onSessionEnd]);

  // ---------- HANDLER: NHẬN FEATURE TỪ GAME CON ----------
  const handleFeatureCapture = useCallback((feature: BehavioralFeature) => {
    if (!ageGroup) return;
    
    // Xác định game hiện tại dựa vào phase
    const currentGameList = phase === 'gateway' ? ageGroup.games : finalGameList;
    const currentGame = currentGameList[currentGameIndex];
    
    const enriched = {
      ...feature,
      gameId: currentGame.id,
      sessionTime: Date.now() - gameStartTimeRef.current,
      childName
    };
    allFeaturesBuffer.current.push(enriched);
    onFeatureCapture(enriched);
  }, [phase, ageGroup, finalGameList, currentGameIndex, childName, onFeatureCapture]);

  // ---------- RENDER ----------
  if (!config || !ageGroup) {
    return <div style={{ padding: 20 }}>Đang tải cấu hình...</div>;
  }

  // Xác định game hiện tại và danh sách hiển thị
  const currentGameList = phase === 'gateway' ? ageGroup.games : finalGameList;
  const currentGame = currentGameList[currentGameIndex];
  const CurrentGameComponent = currentGame?.component;

  // Tính tổng thời gian session
  const totalSessionTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
  
  // Xác định tiến độ hiển thị (dựa trên danh sách hiện tại)
  const progress = ((currentGameIndex + 1) / currentGameList.length) * 100;

  return (
    <div className="game-engine-container">
      <style>{globalStyles}</style>

      {/* Video ẩn cho AI */}
      <video ref={videoRef} autoPlay muted playsInline className="hidden-video" />

      {/* Khu vực chính hiển thị game */}
      <div className="game-content">
        {CurrentGameComponent && (
          <CurrentGameComponent
            config={config}
            latestAIResult={latestAIResult}
            onFeatureCapture={handleFeatureCapture}
            onGameComplete={(success: boolean) => handleGameComplete(currentGame.id, success)} // 👈 TRUYỀN CALLBACK
            timeElapsed={currentGameTime}
            childName={childName}
            gameDuration={currentGame?.duration || 120}
          />
        )}
      </div>

      {/* Thanh trạng thái */}
      <div className="game-status-bar">
        <span>{isCameraInitialized ? `👁️ AI: ${inferenceStatus}` : '⏳ Camera...'}</span>
        <span>|</span>
        <span>Nhóm: {age} tháng</span>
        <span>|</span>
        <span>Giai đoạn: {phase === 'gateway' ? 'Gateway' : 'Đánh giá'}</span>
        <span>|</span>
        <span>Game: {currentGame?.id} - {currentGame?.name}</span>
        <span>|</span>
        <span>Bé: {childName || "Chưa đặt tên"}</span>
        <span>|</span>
        <span>Thời gian: {currentGameTime}s / {currentGame?.duration}s</span>
        <span>|</span>
        <span>Tổng: {totalSessionTime}s</span>
      </div>

      {/* Thanh tiến trình */}
      <div className="game-progress-container">
        <div
          className="game-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Nút điều hướng (debug) - chỉ hiển thị danh sách game hiện tại */}
      <div className="game-nav-bar">
        {currentGameList.map((game, index) => (
          <button
            key={game.id}
            className={`nav-btn ${index === currentGameIndex ? 'active' : 'inactive'}`}
            onClick={() => {
              if (index <= currentGameIndex + 1) setCurrentGameIndex(index);
            }}
            disabled={index > currentGameIndex + 1}
          >
            {game.name} {game.isGateway ? '⚡' : ''} {game.isOptional ? '*' : ''}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GameEngine;