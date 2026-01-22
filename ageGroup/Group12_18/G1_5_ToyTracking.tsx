import React, { useState, useEffect, useRef } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G1_5_ToyTracking: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed, 
  childName,
  gameDuration 
}) => {
  const [toys, setToys] = useState<{id: number, x: number, y: number, emoji: string, speedX: number, speedY: number, rotation: number}[]>([]);
  const toyEmojis = ['🚗', '🚂', '✈️', '🛸', '🚁', '🚀', '🛶', '🚤', '🚲', '🛴'];
  const [toyCount, setToyCount] = useState(0);
  const [trackingScore, setTrackingScore] = useState(0);

  useEffect(() => {
    const initialToys = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      emoji: toyEmojis[i % toyEmojis.length],
      speedX: (Math.random() - 0.5) * 2,
      speedY: (Math.random() - 0.5) * 2,
      rotation: Math.random() * 360
    }));
    setToys(initialToys);
    setToyCount(5);

    const interval = setInterval(() => {
      setToys(prev => prev.map(toy => {
        let newX = toy.x + toy.speedX;
        let newY = toy.y + toy.speedY;
        let newSpeedX = toy.speedX;
        let newSpeedY = toy.speedY;
        let newRotation = (toy.rotation + 1) % 360;

        if (newX < 5 || newX > 95) {
          newSpeedX = -newSpeedX;
          newX = Math.max(5, Math.min(95, newX));
          setTrackingScore(prev => prev + 1);
        }
        if (newY < 5 || newY > 95) {
          newSpeedY = -newSpeedY;
          newY = Math.max(5, Math.min(95, newY));
          setTrackingScore(prev => prev + 1);
        }

        return {
          ...toy,
          x: newX,
          y: newY,
          speedX: newSpeedX,
          speedY: newSpeedY,
          rotation: newRotation
        };
      }));
    }, 50);

    const addToyInterval = setInterval(() => {
      if (toyCount < 10) {
        const newToy = {
          id: Date.now(),
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
          emoji: toyEmojis[Math.floor(Math.random() * toyEmojis.length)],
          speedX: (Math.random() - 0.5) * 2,
          speedY: (Math.random() - 0.5) * 2,
          rotation: Math.random() * 360
        };
        setToys(prev => [...prev, newToy]);
        setToyCount(prev => prev + 1);
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(addToyInterval);
    };
  }, [toyCount]);

  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      const mainToy = toys[0] || { x: 50, y: 50 };
      
      const feature: BehavioralFeature = {
        timestamp: Date.now(),
        gazeX: aiData?.gazeX ?? 0.5,
        gazeY: aiData?.gazeY ?? 0.5,
        targetX: mainToy.x,
        targetY: mainToy.y,
        targetSize: 100,
        audioStimulus: null,
        isLookingAtTarget: false,
        attentionLevel: aiData?.avgAttention ?? 0.5,
        smileIntensity: aiData?.avgSmile ?? 0,
        frownIntensity: 0,
        affect: 'neutral',
        poseConfidence: aiData?.faceDetectionConfidence ?? 0,
        faceConfidence: aiData?.faceDetectionConfidence ?? 0
      };
      onFeatureCapture(feature);
    }, 100);

    return () => clearInterval(recordLoop);
  }, [toys, onFeatureCapture]);

  const handleToyClick = (id: number) => {
    setToys(prev => prev.filter(toy => toy.id !== id));
    setToyCount(prev => prev - 1);
    setTrackingScore(prev => prev + 5);
  };

  return (
    <div className="toy-tracking-container">
      {/* CSS nội tuyến */}
      <style>{`
        .toy-tracking-container {
          width: 100%;
          height: 100%;
          position: relative;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          border-radius: 20px;
          overflow: hidden;
        }

        .toy-tracking-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          padding: 20px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          z-index: 10;
        }

        .toy-tracking-timer {
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 10px 20px;
          border-radius: 20px;
          font-size: 16px;
          font-weight: bold;
        }

        .toy-tracking-stats {
          display: flex;
          gap: 15px;
        }

        .toy-count, .tracking-score {
          background: rgba(255, 255, 255, 0.9);
          color: #2c3e50;
          padding: 10px 20px;
          border-radius: 20px;
          font-size: 16px;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .toy-tracking-title {
          position: absolute;
          top: 80px;
          left: 0;
          right: 0;
          text-align: center;
          color: white;
          font-size: 36px;
          font-weight: bold;
          text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
          z-index: 10;
        }

        .toy-tracking-area {
          position: absolute;
          top: 150px;
          left: 0;
          right: 0;
          bottom: 100px;
        }

        .toy-item {
          position: absolute;
          font-size: 90px; /* Đã tăng kích thước lên 90px */
          cursor: pointer;
          transition: all 0.3s ease;
          transform-origin: center;
          animation: toyEnter 0.5s ease-out;
          z-index: 5;
          filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
          user-select: none; /* Ngăn bôi đen khi click nhanh */
        }

        .toy-item:hover {
          transform: scale(1.2) rotate(10deg);
          filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.8));
        }

        @keyframes toyEnter {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        @keyframes toyMove {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }

        .toy-item:nth-child(odd) {
          animation: toyMove 3s ease-in-out infinite;
        }

        .toy-item:nth-child(even) {
          animation: toyMove 4s ease-in-out infinite 0.5s;
        }

        .toy-path {
          position: absolute;
          background: rgba(255, 255, 255, 0.1);
          border: 2px dashed rgba(255, 255, 255, 0.3);
          border-radius: 10px;
          z-index: 2;
        }

        .tracking-instruction {
          position: absolute;
          bottom: 30px;
          left: 0;
          right: 0;
          text-align: center;
          color: white;
          font-size: 22px;
          font-weight: bold;
          padding: 15px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 15px;
          margin: 0 40px;
          backdrop-filter: blur(10px);
          animation: pulse 2s infinite;
          z-index: 10;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        .sparkle {
          position: absolute;
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          pointer-events: none;
          z-index: 20;
          animation: sparkleEffect 0.5s ease-out forwards;
        }

        @keyframes sparkleEffect {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.5); opacity: 1; }
          100% { transform: scale(0); opacity: 0; }
        }

        .road-background {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: linear-gradient(to top, #7f8c8d, #95a5a6);
          z-index: 1;
          opacity: 0.7;
        }

        .road-line {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 4px;
          background: repeating-linear-gradient(
            to right,
            white,
            white 20px,
            transparent 20px,
            transparent 40px
          );
          animation: roadMove 2s linear infinite;
        }

        @keyframes roadMove {
          0% { transform: translateX(0); }
          100% { transform: translateX(-40px); }
        }

        .click-effect {
          position: absolute;
          font-size: 24px;
          animation: clickFloat 1s ease-out forwards;
          pointer-events: none;
          z-index: 100;
        }

        @keyframes clickFloat {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(-50%, -100px) scale(1.5); opacity: 0; }
        }

        @media (max-width: 768px) {
          .toy-tracking-title {
            font-size: 28px;
            top: 60px;
          }
          
          .tracking-instruction {
            font-size: 18px;
            margin: 0 20px;
            padding: 12px;
          }
          
          .toy-item {
            font-size: 60px; /* Mobile: Tăng lên 60px */
          }
          
          .toy-tracking-stats {
            flex-direction: column;
            gap: 5px;
          }
        }
      `}</style>

      <div className="toy-tracking-header">
        <div className="toy-tracking-timer">
          ⏱️ {timeElapsed}s / {gameDuration}s
        </div>
        <div className="toy-tracking-stats">
          <div className="toy-count">
            🧸 Đồ chơi: {toyCount}
          </div>
          <div className="tracking-score">
            🏆 Điểm: {trackingScore}
          </div>
        </div>
      </div>
      
      <div className="toy-tracking-title">
        🚗 Đồ Chơi Di Chuyển
      </div>
      
      <div className="road-background">
        <div className="road-line"></div>
      </div>
      
      <div className="toy-tracking-area">
        {toys.map(toy => (
          <div
            key={toy.id}
            className="toy-item"
            style={{
              left: `${toy.x}%`,
              top: `${toy.y}%`,
              transform: `rotate(${toy.rotation}deg)`
            }}
            onClick={() => handleToyClick(toy.id)}
          >
            {toy.emoji}
          </div>
        ))}
      </div>
      
      <div className="tracking-instruction">
        Bé {childName || 'ơi'}, theo dõi các đồ chơi đang chạy! 👀
        <br />
        Nhấn vào đồ chơi để ghi điểm! 🎯
      </div>
    </div>
  );
};

export default G1_5_ToyTracking;