import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G2_1_ChiTayTinhMat: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- CSS NỘI BỘ ---
  const styles = `
    .chitay-game-container {
      width: 100%; height: 100%; position: relative;
      background: linear-gradient(135deg, #FFF9E6 0%, #FFE6F0 100%);
      border-radius: 20px; overflow: hidden;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .chitay-timer {
      position: absolute; top: 20px; right: 20px;
      background: rgba(0, 0, 0, 0.6); color: white;
      padding: 10px 20px; border-radius: 20px; font-size: 18px;
    }
    .chitay-main-stage {
      display: flex; gap: 40px; justify-content: center; align-items: center; width: 100%;
    }
    .chitay-object-box {
      background: white; border-radius: 40px; padding: 40px;
      display: flex; flex-direction: column; align-items: center;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1); border: 8px solid transparent;
      transition: all 0.4s; cursor: pointer; min-width: 280px;
    }
    .chitay-object-box.is-target { border-color: #FF6B9D; animation: pulse 2s infinite; }
    .chitay-emoji { font-size: 130px; margin-bottom: 10px; }
    .chitay-name { font-size: 38px; font-weight: bold; color: #333; }
    .chitay-instruction {
      position: absolute; bottom: 40px; background: white;
      padding: 20px 60px; border-radius: 30px; font-size: 42px;
      font-weight: bold; color: #FF6B9D; box-shadow: 0 10px 25px rgba(255, 107, 157, 0.2);
    }
    .chitay-pointer { position: absolute; top: -90px; font-size: 80px; animation: bounce 1.5s infinite; }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
  `;

  // --- LOGIC ---
  const GAME_DURATION = 180;
  const AUTO_NEXT_DELAY = 8000;

  const objectEmojis = useMemo(() => [
    { name: "Quả táo", emoji: "🍎" },
    { name: "Con mèo", emoji: "🐱" },
    { name: "Quả bóng", emoji: "⚽" },
    { name: "Ô tô", emoji: "🚗" },
    { name: "Bông hoa", emoji: "🌼" },
    { name: "Con cá", emoji: "🐟" },
    { name: "Gấu bông", emoji: "🧸" },
    { name: "Quả chuối", emoji: "🍌" }
  ], []);

  const [displayItems, setDisplayItems] = useState<any[]>([]);
  const [targetIdx, setTargetIdx] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const nextRoundRef = useRef<NodeJS.Timeout | null>(null);

  // Phát âm thanh tên vật thể
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'vi-VN';
      msg.rate = 0.8; // Đọc chậm rõ từng chữ
      msg.pitch = 1.1;
      window.speechSynthesis.speak(msg);
    }
  };

  const initRound = () => {
    setShowSuccess(false);
    const shuffled = [...objectEmojis].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 2);
    const targetInLocal = Math.floor(Math.random() * 2);
    
    setDisplayItems(selected);
    setTargetIdx(targetInLocal);

    // Chỉ gọi tên vật thể
    speak(selected[targetInLocal].name);

    if (nextRoundRef.current) clearTimeout(nextRoundRef.current);
    nextRoundRef.current = setTimeout(initRound, AUTO_NEXT_DELAY);
  };

  useEffect(() => {
    initRound();
    return () => {
      if (nextRoundRef.current) clearTimeout(nextRoundRef.current);
      window.speechSynthesis.cancel();
    };
  }, [objectEmojis]);

  const handleObjectTap = (index: number) => {
    if (showSuccess || index !== targetIdx) return;
    
    setShowSuccess(true);
    speak(displayItems[targetIdx].name); // Nhắc lại tên khi bé chạm đúng

    if (nextRoundRef.current) clearTimeout(nextRoundRef.current);
    setTimeout(initRound, 2500);
  };

  // --- RECORD AI DATA ---
  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      onFeatureCapture({
        timestamp: Date.now(),
        gazeX: aiData?.gazeX ?? 0.5, gazeY: aiData?.gazeY ?? 0.5,
        targetX: targetIdx === 0 ? 35 : 65, targetY: 50, targetSize: 250,
        audioStimulus: displayItems[targetIdx]?.name || null,
        isLookingAtTarget: false,
        attentionLevel: aiData?.avgAttention ?? 0.5,
        smileIntensity: aiData?.avgSmile ?? 0,
        frownIntensity: 0,
        affect: showSuccess ? 'positive' : 'neutral',
        poseConfidence: aiData?.faceDetectionConfidence ?? 0,
        faceConfidence: aiData?.faceDetectionConfidence ?? 0
      });
    }, 100);
    return () => clearInterval(recordLoop);
  }, [onFeatureCapture, latestAIResult, displayItems, targetIdx, showSuccess]);

  return (
    <div className="chitay-game-container">
      <style>{styles}</style>
      
      <div className="chitay-timer">⏱️ {timeElapsed}s / {GAME_DURATION}s</div>

      <div className="chitay-main-stage">
        {displayItems.map((item, idx) => (
          <div 
            key={idx}
            className={`chitay-object-box ${idx === targetIdx ? 'is-target' : ''}`}
            onClick={() => handleObjectTap(idx)}
          >
            {idx === targetIdx && !showSuccess && (
              <div className="chitay-pointer" onClick={(e) => { e.stopPropagation(); speak(item.name); }}>👇</div>
            )}
            <div className="chitay-emoji">{item.emoji}</div>
            <div className="chitay-name">{item.name}</div>
          </div>
        ))}
      </div>

      <div className="chitay-instruction">
        {showSuccess ? "🌟" : displayItems[targetIdx]?.name}
      </div>
    </div>
  );
};

export default G2_1_ChiTayTinhMat;