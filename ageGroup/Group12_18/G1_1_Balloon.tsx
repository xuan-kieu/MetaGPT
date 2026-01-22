import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G1_1_Balloon: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- CSS NỘI BỘ ---
  const styles = `
    .balloon-game-container {
      width: 100%;
      height: 100%;
      position: relative;
      background: linear-gradient(180deg, #87CEEB 0%, #98FB98 100%);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .balloon-game-timer {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 16px;
      font-weight: bold;
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .balloon {
      position: absolute;
      cursor: pointer;
      transform-origin: center bottom;
      transition: transform 0.3s ease;
      z-index: 5;
    }

    .balloon:hover {
      transform: scale(1.1);
    }

    /* Hiệu ứng bay lắc lư */
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-10px) rotate(2deg); }
    }

    .balloon:nth-child(odd) {
      animation: float 3s ease-in-out infinite;
    }

    .balloon:nth-child(even) {
      animation: float 4s ease-in-out infinite 0.5s;
    }

    .balloon-body {
      width: 100%;
      height: 100%;
      border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
      background: var(--balloon-color);
      position: relative;
      box-shadow: inset -5px -5px 10px rgba(0, 0, 0, 0.2),
                  inset 5px 5px 10px rgba(255, 255, 255, 0.3);
    }

    /* Dây bóng */
    .balloon-body::before {
      content: '';
      position: absolute;
      bottom: -15px;
      left: 50%;
      transform: translateX(-50%);
      width: 2px;
      height: 40px;
      background: linear-gradient(to bottom, #666, #999);
    }

    /* Nút thắt bóng */
    .balloon-body::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 50%;
      transform: translateX(-50%);
      width: 10px;
      height: 6px;
      background: var(--balloon-color);
      border-radius: 4px;
    }

    .balloon-instruction {
      position: absolute;
      bottom: 30px;
      left: 0;
      right: 0;
      text-align: center;
      color: #2c3e50;
      font-size: 22px;
      font-weight: bold;
      padding: 15px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 15px;
      margin: 0 40px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      animation: pulse 2s infinite;
      z-index: 10;
    }

    .balloon-title {
      position: absolute;
      top: 20px;
      left: 20px;
      color: white;
      font-size: 32px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
      background: rgba(0, 0, 0, 0.4);
      padding: 10px 20px;
      border-radius: 15px;
      backdrop-filter: blur(5px);
      z-index: 10;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    @media (max-width: 768px) {
      .balloon-title {
        font-size: 24px;
        padding: 8px 16px;
      }
      
      .balloon-instruction {
        font-size: 18px;
        margin: 0 20px;
        padding: 12px;
      }
      
      .balloon-game-timer {
        font-size: 14px;
        padding: 8px 16px;
      }
    }
  `;

  // --- LOGIC ---
  interface Balloon {
    id: number; 
    x: number; 
    y: number; 
    color: string; 
    size: number;
    speed: number; 
    swingPhase: number; 
    swingSpeed: number; 
    swingAmplitude: number;
  }
  
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const nextBalloonId = useRef(0);
  const balloonsRef = useRef<Balloon[]>([]);
  balloonsRef.current = balloons;

  const brightColors = useMemo(() => [
    '#FF9ED8', '#7ED4FF', '#FFF679', '#D9A5FF',
    '#8CFF8C', '#FFCC8C', '#B8B8FF', '#FFB8B8'
  ], []);

  const GAME_DURATION = 120;

  useEffect(() => {
    // SỬA LẠI LOGIC MOVE: Bóng bay LÊN thì Y phải tăng (nếu dùng bottom)
    // Code gốc bạn dùng y - speed nhưng css lại để bottom: y%. 
    // -> Logic đúng: Start y = -20 (dưới đáy), y tăng dần lên 120.

    const createBalloon = () => {
      const newBalloon: Balloon = {
        id: nextBalloonId.current++,
        x: 15 + Math.random() * 70,
        y: -20, // Bắt đầu từ dưới màn hình
        color: brightColors[Math.floor(Math.random() * brightColors.length)],
        size: 60 + Math.random() * 40,
        speed: 0.15 + Math.random() * 0.15, 
        swingPhase: Math.random() * Math.PI * 2,
        swingSpeed: 0.015 + Math.random() * 0.015,
        swingAmplitude: 8 + Math.random() * 10
      };
      setBalloons(prev => [...prev, newBalloon]);
    };

    const initialTimer = setTimeout(createBalloon, 1000);
    
    const scheduleNextBalloon = () => {
      if (nextBalloonId.current > 20) return;
      const delay = 4000 + Math.random() * 5000;
      return setTimeout(() => {
        createBalloon();
        scheduleNextBalloon();
      }, delay);
    };

    const scheduleTimer = setTimeout(scheduleNextBalloon, 2000);

    const moveInterval = setInterval(() => {
      setBalloons(prev => prev.map(b => ({
          ...b,
          y: b.y + b.speed, // Tăng Y để bay lên (vì dùng css bottom)
          x: b.x + Math.sin(b.swingPhase) * b.swingAmplitude * 0.02,
          swingPhase: b.swingPhase + b.swingSpeed
        })).filter(b => b.y < 120)); // Xóa khi bay quá đỉnh
    }, 40);

    return () => { 
      clearTimeout(initialTimer); 
      clearTimeout(scheduleTimer as any); 
      clearInterval(moveInterval); 
    };
  }, [brightColors]);

  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      // Target là quả bóng cao nhất (gần đỉnh nhất)
      const nearestBalloon = balloonsRef.current.length > 0 ? 
        balloonsRef.current.reduce((prev, current) => (prev.y > current.y) ? prev : current) : null;
      
      const feature: BehavioralFeature = {
        timestamp: Date.now(),
        gazeX: aiData?.gazeX ?? 0.5,
        gazeY: aiData?.gazeY ?? 0.5,
        targetX: nearestBalloon ? nearestBalloon.x : 50,
        targetY: nearestBalloon ? 100 - nearestBalloon.y : 50, // Đảo ngược tọa độ Y cho AI
        targetSize: nearestBalloon ? nearestBalloon.size : 100,
        audioStimulus: null,
        isLookingAtTarget: false,
        attentionLevel: aiData?.avgAttention ?? 0.5,
        smileIntensity: aiData?.avgSmile ?? 0,
        frownIntensity: 0.1,
        affect: 'neutral',
        poseConfidence: aiData?.faceDetectionConfidence ?? 0,
        faceConfidence: aiData?.faceDetectionConfidence ?? 0
      };
      onFeatureCapture(feature);
    }, 100);

    return () => { 
      clearInterval(recordLoop); 
    };
  }, [onFeatureCapture, latestAIResult]);

  const renderBalloon = (balloon: Balloon) => {
    return (
      <div
        key={balloon.id}
        className="balloon"
        style={{
          left: `${balloon.x}%`,
          bottom: `${balloon.y}%`, // Sử dụng bottom
          width: `${balloon.size}px`,
          height: `${balloon.size * 1.2}px`,
          '--balloon-color': balloon.color
        } as React.CSSProperties}
      >
        <div className="balloon-body"></div>
      </div>
    );
  };

  return (
    <div className="balloon-game-container">
      {/* Inject Style gốc */}
      <style>{styles}</style>

      <div className="balloon-game-timer">
        ⏱️ {timeElapsed}s / {GAME_DURATION}s
      </div>
      
      <div className="balloon-title">
        🎈 Bong Bóng Bay
      </div>
      
      {balloons.map(renderBalloon)}
      
      <div className="balloon-instruction">
        Ngắm bóng bay bay lên trời! 👀🎈
      </div>
    </div>
  );
};

export default G1_1_Balloon;