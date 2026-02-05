import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

// Mở rộng interface để bao gồm các trường dữ liệu mới cho AI
interface ExtendedFeature extends BehavioralFeature {
  isSpecialActive: boolean;
  isLookingAtSocial: boolean;
  micLevel?: number;
}

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
  isSpecial?: boolean;
}

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
      z-index: 30;
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

    .balloon-body {
      width: 100%;
      height: 100%;
      border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
      background: var(--balloon-color);
      position: relative;
      box-shadow: inset -5px -5px 10px rgba(0, 0, 0, 0.2),
                  inset 5px 5px 10px rgba(255, 255, 255, 0.3);
    }

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

    .special-balloon {
      z-index: 15;
      filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.6));
    }

    .special-face {
      position: absolute;
      top: 20%;
      left: 0;
      width: 100%;
      text-align: center;
      font-size: 35px;
      user-select: none;
    }

    .pip-container {
      position: absolute;
      top: 80px;
      right: 20px;
      width: 160px;
      height: 120px;
      border: 4px solid white;
      border-radius: 15px;
      overflow: hidden;
      z-index: 40;
      box-shadow: 0 8px 20px rgba(0,0,0,0.4);
      background: #2c3e50;
      animation: slideIn 0.5s ease-out;
    }

    @keyframes slideIn {
      from { transform: translateX(200px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
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
      z-index: 10;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-10px) rotate(2deg); }
    }
    .balloon-anim { animation: float 3s ease-in-out infinite; }
  `;

  // --- LOGIC & STATE ---
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [specialBalloon, setSpecialBalloon] = useState<Balloon | null>(null);
  const [showPiP, setShowPiP] = useState(false);
  
  const nextBalloonId = useRef(0);
  const balloonsRef = useRef<Balloon[]>([]);
  const specialRef = useRef<Balloon | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  balloonsRef.current = balloons;
  specialRef.current = specialBalloon;

  const brightColors = useMemo(() => [
    '#FF9ED8', '#7ED4FF', '#FFF679', '#D9A5FF',
    '#8CFF8C', '#FFCC8C', '#B8B8FF', '#FFB8B8'
  ], []);

  const GAME_DURATION = 120;

  // Effect tạo bóng thường
  useEffect(() => {
    const createBalloon = () => {
      const newBalloon: Balloon = {
        id: nextBalloonId.current++,
        x: 15 + Math.random() * 70,
        y: -20,
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
      if (nextBalloonId.current > 30) return; // Limit số lượng bóng
      const delay = 3000 + Math.random() * 4000;
      return setTimeout(() => {
        createBalloon();
        scheduleNextBalloon();
      }, delay);
    };

    const scheduleTimer = setTimeout(scheduleNextBalloon, 2000);

    const moveInterval = setInterval(() => {
      // Move bóng thường
      setBalloons(prev => prev.map(b => ({
          ...b,
          y: b.y + b.speed,
          x: b.x + Math.sin(b.swingPhase) * b.swingAmplitude * 0.02,
          swingPhase: b.swingPhase + b.swingSpeed
      })).filter(b => b.y < 120));

      // Move bóng đặc biệt
      setSpecialBalloon(prev => {
        if (!prev) return null;
        const newY = prev.y + prev.speed;
        return newY > 120 ? null : { ...prev, y: newY };
      });
    }, 40);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(scheduleTimer as any);
      clearInterval(moveInterval);
    };
  }, [brightColors]);

  // Effect kích hoạt sự kiện đặc biệt (Bóng to + PiP) sau 3 giây
  useEffect(() => {
    const specialEventTimer = setTimeout(() => {
      // 1. Khởi tạo bóng đặc biệt
      const sb: Balloon = {
        id: 9999,
        x: 40,
        y: -20,
        color: '#FFD700',
        size: 140,
        speed: 0.12,
        swingPhase: 0,
        swingSpeed: 0.01,
        swingAmplitude: 5,
        isSpecial: true
      };
      setSpecialBalloon(sb);

      // 2. Phát âm thanh (Sử dụng link âm thanh mẫu)
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
      audioRef.current.play().catch(() => console.log("Yêu cầu tương tác để phát nhạc"));

      // 3. Hiện PiP sau đó 1.5 giây để kiểm tra tham chiếu xã hội
      setTimeout(() => setShowPiP(true), 1500);

    }, 3000);

    return () => clearTimeout(specialEventTimer);
  }, []);

  // Effect ghi lại dữ liệu hành vi (Recording Loop)
  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      
      // Xác định mục tiêu quan trọng nhất lúc này
      const currentSpecial = specialRef.current;
      const nearestNormal = balloonsRef.current.length > 0 
        ? balloonsRef.current.reduce((p, c) => (p.y > c.y ? p : c)) 
        : null;
      
      const target = currentSpecial || nearestNormal;

      // Logic check xem trẻ có đang nhìn vào vùng PiP không (Góc trên bên phải)
      const isLookingAtSocial = showPiP && (aiData?.gazeX ?? 0) > 0.7 && (aiData?.gazeY ?? 1) < 0.4;

      const feature: ExtendedFeature = {
        timestamp: Date.now(),
        gazeX: aiData?.gazeX ?? 0.5,
        gazeY: aiData?.gazeY ?? 0.5,
        targetX: target ? target.x : 50,
        targetY: target ? 100 - target.y : 50,
        targetSize: target ? target.size : 100,
        audioStimulus: currentSpecial ? "special_balloon_sound" : null,
        isLookingAtTarget: false, // AI sẽ tính toán lại dựa trên tọa độ gaze và target
        attentionLevel: aiData?.avgAttention ?? 0.5,
        smileIntensity: aiData?.avgSmile ?? 0,
        frownIntensity: 0.1,
        affect: 'neutral',
        poseConfidence: aiData?.faceDetectionConfidence ?? 0,
        faceConfidence: aiData?.faceDetectionConfidence ?? 0,
        // Các trường mở rộng
        isSpecialActive: !!currentSpecial,
        isLookingAtSocial: isLookingAtSocial,
      };

      onFeatureCapture(feature);
    }, 100);

    return () => clearInterval(recordLoop);
  }, [onFeatureCapture, latestAIResult, showPiP]);

  const renderBalloon = (balloon: Balloon) => (
    <div
      key={balloon.id}
      className={`balloon ${balloon.isSpecial ? 'special-balloon' : 'balloon-anim'}`}
      style={{
        left: `${balloon.x}%`,
        bottom: `${balloon.y}%`,
        width: `${balloon.size}px`,
        height: `${balloon.size * 1.2}px`,
        '--balloon-color': balloon.color
      } as React.CSSProperties}
    >
      <div className="balloon-body">
        {balloon.isSpecial && <div className="special-face">😊</div>}
      </div>
    </div>
  );

  return (
    <div className="balloon-game-container">
      <style>{styles}</style>

      {/* Giao diện Header */}
      <div className="balloon-game-timer">
        ⏱️ {timeElapsed}s / {GAME_DURATION}s
      </div>
      
      <div className="balloon-title" style={{
        position: 'absolute', top: '20px', left: '20px', color: 'white', 
        fontSize: '32px', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
        background: 'rgba(0,0,0,0.4)', padding: '10px 20px', borderRadius: '15px', zIndex: 10
      }}>
        🎈 Bong Bóng Bay
      </div>

      {/* Component PiP Giả lập */}
      {showPiP && (
        <div className="pip-container">
          <img 
            src="https://img.freepik.com/free-photo/mother-playing-with-her-baby_23-2148441334.jpg" 
            alt="Parent Simulation"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute', bottom: 0, width: '100%', 
            background: 'rgba(0,0,0,0.6)', color: 'white', 
            fontSize: '11px', textAlign: 'center', padding: '2px 0'
          }}>
            Người thân đang nhìn
          </div>
        </div>
      )}

      {/* Render các loại bóng */}
      {balloons.map(renderBalloon)}
      {specialBalloon && renderBalloon(specialBalloon)}
      
      <div className="balloon-instruction">
        {specialBalloon ? "Ô kìa! Một quả bóng thật to! 👀✨" : "Ngắm bóng bay bay lên trời! 👀🎈"}
      </div>
    </div>
  );
};

export default G1_1_Balloon;