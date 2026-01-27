import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G2_2_XayThapCao: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- CSS TỐI GIẢN & SINH ĐỘNG ---
  const styles = `
    .xaythap-container {
      width: 100%; height: 100%; position: relative;
      background: linear-gradient(180deg, #E3F2FD 0%, #FFF9C4 100%);
      border-radius: 20px; overflow: hidden;
      display: flex; flex-direction: column; align-items: center;
    }

    .xaythap-timer {
      position: absolute; top: 20px; right: 20px;
      background: rgba(0, 0, 0, 0.5); color: white;
      padding: 8px 15px; border-radius: 20px; font-size: 18px; z-index: 10;
    }

    .xaythap-stage {
      flex: 1; width: 100%; position: relative;
      display: flex; flex-direction: column-reverse; align-items: center;
      padding-bottom: 20px;
    }

    .xaythap-block {
      width: 220px; height: 50px;
      border-radius: 12px;
      margin-bottom: 4px;
      display: flex; align-items: center; justify-content: center;
      font-size: 30px; color: white;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      animation: blockAppear 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes blockAppear {
      0% { transform: translateY(-100px) scale(0.5); opacity: 0; }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }

    .xaythap-ground {
      width: 300px; height: 20px; background: #8B4513; border-radius: 10px;
    }

    .xaythap-panel {
      width: 100%; height: 160px; background: white;
      display: flex; justify-content: center; align-items: center; gap: 30px;
      border-top: 5px solid #FF9800; padding: 10px;
    }

    .xaythap-item {
      width: 90px; height: 90px; border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
      font-size: 50px; cursor: pointer;
      box-shadow: 0 8px 15px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }

    .xaythap-item:active { transform: scale(0.9); }

    .xaythap-instruction {
      position: absolute; top: 80px; font-size: 36px;
      font-weight: bold; color: #FF5722; text-align: center;
      width: 100%; pointer-events: none;
    }

    .xaythap-star {
      position: absolute; font-size: 40px;
      animation: starFly 1s forwards;
    }

    @keyframes starFly {
      0% { transform: scale(0); opacity: 1; }
      100% { transform: translateY(-100px) scale(2); opacity: 0; }
    }
  `;

  // --- LOGIC ---
  const GAME_DURATION = 180;
  const [tower, setTower] = useState<any[]>([]);
  const [celebrate, setCelebrate] = useState(false);

  const blockOptions = useMemo(() => [
    { name: "Khối đỏ", emoji: "🟥", color: "#F44336" },
    { name: "Khối xanh", emoji: "🟦", color: "#2196F3" },
    { name: "Khối vàng", emoji: "🟨", color: "#FFEB3B" },
    { name: "Khối lá", emoji: "🟩", color: "#4CAF50" }
  ], []);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'vi-VN';
      msg.rate = 0.9;
      window.speechSynthesis.speak(msg);
    }
  };

  const addBlock = (option: any) => {
    if (tower.length >= 7) {
      // Nếu tháp quá cao, tự động "thu nhỏ" để bé xây tiếp
      setTower([]);
      speak("Ồ! Xây lại tháp mới nào");
      return;
    }

    speak(option.name);
    setTower(prev => [...prev, { ...option, id: Date.now() }]);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 1000);
  };

  // AI Tracking
  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      onFeatureCapture({
        timestamp: Date.now(),
        gazeX: aiData?.gazeX ?? 0.5,
        gazeY: aiData?.gazeY ?? 0.5,
        targetX: 50,
        targetY: 70, // Tập trung vào khu vực xây tháp
        targetSize: 200,
        audioStimulus: tower.length > 0 ? tower[tower.length - 1].name : null,
        isLookingAtTarget: false,
        attentionLevel: aiData?.avgAttention ?? 0.5,
        smileIntensity: aiData?.avgSmile ?? 0,
        frownIntensity: 0,
        affect: celebrate ? 'positive' : 'neutral',
        poseConfidence: aiData?.faceDetectionConfidence ?? 0,
        faceConfidence: aiData?.faceDetectionConfidence ?? 0
      });
    }, 100);
    return () => clearInterval(recordLoop);
  }, [onFeatureCapture, latestAIResult, tower, celebrate]);

  return (
    <div className="xaythap-container">
      <style>{styles}</style>

      <div className="xaythap-timer">⏱️ {timeElapsed}s / {GAME_DURATION}s</div>

      <div className="xaythap-instruction">
        {tower.length === 0 ? "Bé xây tháp nhé!" : "Tháp cao quá!"}
      </div>

      <div className="xaythap-stage">
        <div className="xaythap-ground"></div>
        {tower.map((block, idx) => (
          <div 
            key={block.id} 
            className="xaythap-block"
            style={{ 
              backgroundColor: block.color,
              width: `${240 - (idx * 15)}px` // Tháp nhỏ dần lên trên
            }}
          >
            {block.emoji}
          </div>
        ))}
        {celebrate && <div className="xaythap-star" style={{ bottom: tower.length * 55 }}>⭐</div>}
      </div>

      <div className="xaythap-panel">
        {blockOptions.map((opt, idx) => (
          <div 
            key={idx} 
            className="xaythap-item"
            style={{ backgroundColor: opt.color }}
            onClick={() => addBlock(opt)}
          >
            {opt.emoji}
          </div>
        ))}
      </div>
    </div>
  );
};

export default G2_2_XayThapCao;