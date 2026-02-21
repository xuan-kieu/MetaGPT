import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BehavioralFeature, InferenceResult, GameConfig, GameEngineProps } from '../types';
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

// --- CSS GỐC ---
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
    background-color: #f0fdf4;
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

  .game-progress-container {
    height: 6px;
    background-color: var(--slate-200);
    width: 100%;
  }

  .game-progress-fill {
    height: 100%;
    background-color: var(--emerald-500);
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

  .hidden-video {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    z-index: -1;
  }
`;

// --- ĐỊNH NGHĨA CẤU TRÚC NHÓM TUỔI (BỔ SUNG isGateway, isOptional) ---
interface AgeGroupConfig {
  totalDuration: number;
  games: Array<{
    id: string;
    name: string;
    duration: number;
    component: React.ComponentType<any>;
    isGateway: boolean;   // 3 game đầu là gateway
    isOptional: boolean;  // Các game còn lại là tùy chọn
  }>;
}

// --- HÀM CHỌN GAME THEO ĐỘ TUỔI (THÊM FLAG) ---
const getAgeGroupConfig = (age: number): AgeGroupConfig | null => {
  if (age >= 12 && age < 18) {
    return {
      totalDuration: 10 * 60,
      games: [
        { id: 'G1.1', name: 'Bong Bóng Biết Bay', duration: 120, component: G1_1_Balloon, isGateway: true, isOptional: false },
        { id: 'G1.2', name: 'Vỗ Tay Vui Nhộn', duration: 120, component: G1_2_Clapping, isGateway: true, isOptional: false },
        { id: 'G1.3', name: 'Bé Ơi Quay Lại Nào', duration: 120, component: G1_3_Attention, isGateway: true, isOptional: false },
        { id: 'G1.4', name: 'Ú Òa Kỳ Diệu', duration: 120, component: G1_4_Peekaboo, isGateway: false, isOptional: true },
        { id: 'G1.5', name: 'Theo Dõi Đồ Chơi', duration: 120, component: G1_5_ToyTracking, isGateway: false, isOptional: true }
      ]
    };
  }

  if (age >= 18 && age < 24) {
    return {
      totalDuration: 13 * 60,
      games: [
        { id: 'G2.1', name: 'Chỉ Tay Tinh Mắt', duration: 180, component: G2_1_ChiTayTinhMat, isGateway: true, isOptional: false },
        { id: 'G2.2', name: 'Xây Tháp Cao', duration: 180, component: G2_2_XayThapCao, isGateway: true, isOptional: false },
        { id: 'G2.3', name: 'Tiếng Kêu Của Ai', duration: 120, component: G2_3_TiengKeuCuaAi, isGateway: true, isOptional: false },
        { id: 'G2.4', name: 'Cho Búp Bê Ăn', duration: 180, component: G2_4_ChoBupBeAn, isGateway: false, isOptional: true },
        { id: 'G2.5', name: 'Tìm Bóng Hình', duration: 120, component: G2_5_TimBongHinh, isGateway: false, isOptional: true }
      ]
    };
  }

  if (age >= 24 && age < 36) {
    return {
      totalDuration: 15 * 60,
      games: [
        { id: 'G3.1', name: 'Về Đúng Nhà Nào', duration: 180, component: G3_1_VeDungNhaNao, isGateway: true, isOptional: false },
        { id: 'G3.2', name: 'Cảm Xúc Gì Đây', duration: 180, component: G3_2_CamXucGiDay, isGateway: true, isOptional: false },
        { id: 'G3.3', name: 'Đến Lượt Con Rồi', duration: 180, component: G3_3_DenLuotConRoii, isGateway: true, isOptional: false },
        { id: 'G3.4', name: 'Tìm Hình Ghép Cặp', duration: 180, component: G3_4_TimHinhGhepCap, isGateway: false, isOptional: true },
        { id: 'G3.5', name: 'Mê Cung Đơn Giản', duration: 180, component: G3_5_MeCungDonGian, isGateway: false, isOptional: true }
      ]
    };
  }

  if (age >= 36 && age <= 60) {
    return {
      totalDuration: 18 * 60,
      games: [
        { id: 'G4.1', name: 'Vì Sao Thế Nhỉ', duration: 240, component: G4_1_ViSaoTheNhi, isGateway: true, isOptional: false },
        { id: 'G4.2', name: 'Sắp Xếp Câu Chuyện', duration: 240, component: G4_2_SapXepCauChuyen, isGateway: true, isOptional: false },
        { id: 'G4.3', name: 'Cửa Hàng Tí Hon', duration: 240, component: G4_3_CuaHangTiHon, isGateway: true, isOptional: false },
        { id: 'G4.4', name: 'Làm Theo Chỉ Dẫn', duration: 180, component: G4_4_LamTheoChiDan, isGateway: false, isOptional: true },
        { id: 'G4.5', name: 'Giải Mã Quy Tắc', duration: 180, component: G4_5_GiaiMaQuyTac, isGateway: false, isOptional: true }
      ]
    };
  }

  // Fallback
  return {
    totalDuration: 10 * 60,
    games: [
      { id: 'TEST', name: 'Chưa hỗ trợ độ tuổi này', duration: 60, component: G1_1_Balloon, isGateway: true, isOptional: false }
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

  // State
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [inferenceStatus, setInferenceStatus] = useState('Đang khởi tạo...');
  const [currentGameTime, setCurrentGameTime] = useState(0);
  const [ageGroup, setAgeGroup] = useState<AgeGroupConfig | null>(null);
  // Kết quả của các gateway games (true = thành công, false = thất bại, null = chưa chơi)
  const [gatewayResults, setGatewayResults] = useState<(boolean | null)[]>([]);

  // Ref để lưu hàm handleGameComplete mới nhất (tránh closure cũ trong timer)
  const handleGameCompleteRef = useRef<(success: boolean) => void>(() => {});

  // 1. Khởi tạo danh sách game và config
  useEffect(() => {
    const group = getAgeGroupConfig(age);
    setAgeGroup(group);
    setCurrentGameIndex(0);
    // Reset kết quả gateway: tạo mảng null với độ dài bằng số gateway games
    if (group) {
      const gatewayCount = group.games.filter(g => g.isGateway).length;
      setGatewayResults(Array(gatewayCount).fill(null));

      // Tạo GameConfig mặc định
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

  // 2. Định nghĩa hàm xử lý kết thúc game (dùng useCallback để ổn định, nhưng sẽ được cập nhật qua ref)
  const handleGameComplete = useCallback((success: boolean) => {
    if (!ageGroup) return;

    // Huỷ timer hiện tại
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const currentGame = ageGroup.games[currentGameIndex];

    // Nếu là gateway game
    if (currentGame.isGateway) {
      // Cập nhật kết quả gateway
      setGatewayResults(prev => {
        const newResults = [...prev];
        // Xác định index của gateway này trong mảng gateway (dựa trên thứ tự gateway)
        const gatewayIndex = ageGroup.games
          .filter(g => g.isGateway)
          .findIndex(g => g.id === currentGame.id);
        if (gatewayIndex !== -1) {
          newResults[gatewayIndex] = success;
        }

        // Nếu đây là gateway cuối cùng (gatewayIndex === tổng số gateway - 1)
        const gatewayCount = ageGroup.games.filter(g => g.isGateway).length;
        if (gatewayIndex === gatewayCount - 1) {
          const successCount = newResults.filter(Boolean).length;
          if (successCount >= 2) {
            // Đủ điều kiện: chuyển sang game tiếp theo (nếu còn)
            if (currentGameIndex < ageGroup.games.length - 1) {
              setCurrentGameIndex(prevIndex => prevIndex + 1);
            } else {
              onSessionEnd(allFeaturesBuffer.current);
            }
          } else {
            // Không đủ điều kiện: kết thúc phiên
            onSessionEnd(allFeaturesBuffer.current);
          }
        } else {
          // Chưa phải gateway cuối: chuyển sang game tiếp theo
          setCurrentGameIndex(prevIndex => prevIndex + 1);
        }
        return newResults;
      });
    } else {
      // Game tùy chọn: chuyển tiếp bình thường
      if (currentGameIndex < ageGroup.games.length - 1) {
        setCurrentGameIndex(prevIndex => prevIndex + 1);
      } else {
        onSessionEnd(allFeaturesBuffer.current);
      }
    }
  }, [currentGameIndex, ageGroup, onSessionEnd]);

  // Cập nhật ref mỗi khi handleGameComplete thay đổi
  useEffect(() => {
    handleGameCompleteRef.current = handleGameComplete;
  }, [handleGameComplete]);

  // 3. Vòng lặp thời gian cho game hiện tại (sử dụng ref để gọi hàm mới nhất)
  useEffect(() => {
    if (!ageGroup || !ageGroup.games.length) return;
    const currentGame = ageGroup.games[currentGameIndex];

    currentGameStartTimeRef.current = Date.now();
    setCurrentGameTime(0);

    // Clear timer cũ nếu có
    if (timerRef.current) clearTimeout(timerRef.current);

    const updateTimer = () => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - currentGameStartTimeRef.current) / 1000);
      setCurrentGameTime(elapsedSeconds);

      if (elapsedSeconds >= currentGame.duration) {
        // Hết giờ -> coi như thất bại (dùng ref để gọi phiên bản mới nhất)
        handleGameCompleteRef.current(false);
      } else {
        timerRef.current = setTimeout(updateTimer, 100);
      }
    };

    timerRef.current = setTimeout(updateTimer, 100);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentGameIndex, ageGroup]); // Chỉ phụ thuộc vào index và group, không phụ thuộc handleGameComplete

  // 4. Khởi tạo camera & inference service
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

  // 5. Xử lý feature capture (thêm thông tin game)
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

  if (!config || !ageGroup) {
    return <div style={{ padding: 20 }}>Đang tải cấu hình...</div>;
  }

  const CurrentGameComponent = ageGroup.games[currentGameIndex]?.component;
  const currentGame = ageGroup.games[currentGameIndex];
  const totalSessionTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);

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
            timeElapsed={currentGameTime}
            childName={childName}
            gameDuration={currentGame?.duration || 120}
            onGameComplete={handleGameComplete}  // Cho phép game tự báo kết thúc
          />
        )}
      </div>

      {/* Thanh trạng thái */}
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

      {/* Thanh tiến trình */}
      <div className="game-progress-container">
        <div
          className="game-progress-fill"
          style={{ width: `${(currentGameTime / (currentGame?.duration || 1)) * 100}%` }}
        />
      </div>

      {/* Nút điều hướng (debug) */}
      <div className="game-nav-bar">
        {ageGroup.games.map((game, index) => (
          <button
            key={game.id}
            className={`nav-btn ${index === currentGameIndex ? 'active' : 'inactive'}`}
            onClick={() => {
              // Chỉ cho phép nhảy nếu không quá xa (giữ logic cũ)
              if (index <= currentGameIndex + 1) setCurrentGameIndex(index);
            }}
            disabled={index > currentGameIndex + 1}
          >
            {game.name} {game.isGateway ? '🔷' : '✨'}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GameEngine;