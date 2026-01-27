import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G2_3_TiengKeuCuaAi: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- CSS TỐI GIẢN ---
  const styles = `
    .tiengkeu-container {
      width: 100%; height: 100%; position: relative;
      background: #F0F4C3; /* Màu xanh lá nhạt dịu mắt */
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .tiengkeu-timer {
      position: absolute; top: 20px; right: 20px;
      background: rgba(0,0,0,0.4); color: white; padding: 8px 15px; border-radius: 20px;
    }
    .tiengkeu-options {
      display: flex; gap: 50px; justify-content: center; width: 100%;
    }
    .tiengkeu-card {
      background: white; border-radius: 40px; padding: 50px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 8px solid transparent;
      transition: all 0.3s ease; cursor: pointer;
    }
    .tiengkeu-card.active { 
      border-color: #CDDC39; 
      transform: scale(1.15);
      animation: shake 0.5s infinite;
    }
    .tiengkeu-emoji { font-size: 140px; }
    
    @keyframes shake {
      0%, 100% { transform: scale(1.15) rotate(0deg); }
      25% { transform: scale(1.15) rotate(-5deg); }
      75% { transform: scale(1.15) rotate(5deg); }
    }

    .sound-pulse {
      position: absolute; width: 300px; height: 300px;
      border: 15px solid #CDDC39; border-radius: 50%;
      animation: pulse-out 1.2s infinite; opacity: 0;
    }
    @keyframes pulse-out {
      0% { transform: scale(0.5); opacity: 1; }
      100% { transform: scale(1.8); opacity: 0; }
    }
  `;

  // --- DỮ LIỆU CHỈ GỒM TÊN VÀ TIẾNG KÊU ---
  const animals = useMemo(() => [
    { name: "Con mèo", emoji: "🐱", sound: "Meo meo" },
    { name: "Con chó", emoji: "🐶", sound: "Gâu gâu" },
    { name: "Con vịt", emoji: "🦆", sound: "Cạc cạc" },
    { name: "Con gà", emoji: "🐔", sound: "Ò ó o" },
    { name: "Con bò", emoji: "🐮", sound: "Ùm bò" },
    { name: "Con lợn", emoji: "🐷", sound: "Ụt ịt" }
  ], []);

  const [displayItems, setDisplayItems] = useState<any[]>([]);
  const [targetIdx, setTargetIdx] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false);

  const GAME_DURATION = 180;

  const speak = (text: string, rate = 0.8) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'vi-VN';
      msg.rate = rate;
      msg.pitch = 1.1;
      window.speechSynthesis.speak(msg);
    }
  };

  const initRound = () => {
    setIsAnswering(false);
    const shuffled = [...animals].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 2);
    const target = Math.floor(Math.random() * 2);

    setDisplayItems(selected);
    setTargetIdx(target);

    // Phát âm thanh ngay: Tên -> Tiếng kêu
    setTimeout(() => {
      speak(`${selected[target].name}. ${selected[target].sound}`);
    }, 500);
  };

  useEffect(() => {
    initRound();
    return () => window.speechSynthesis.cancel();
  }, [animals]);

  const handleTap = (idx: number) => {
    if (isAnswering) return;
    
    if (idx === targetIdx) {
      setIsAnswering(true);
      // Chỉ nhắc lại tiếng kêu khi đúng để củng cố phản xạ
      speak(displayItems[idx].sound, 0.7);
      
      setTimeout(initRound, 3000);
    } else {
      // Nếu sai, chỉ gọi lại tên con vật đúng để bé nhìn lại
      speak(displayItems[targetIdx].name);
    }
  };

  // Tracking AI
  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      onFeatureCapture({
        timestamp: Date.now(),
        gazeX: aiData?.gazeX ?? 0.5,
        gazeY: aiData?.gazeY ?? 0.5,
        targetX: targetIdx === 0 ? 30 : 70,
        targetY: 50,
        targetSize: 250,
        audioStimulus: displayItems[targetIdx]?.sound || null,
        isLookingAtTarget: false,
        attentionLevel: aiData?.avgAttention ?? 0.5,
        smileIntensity: aiData?.avgSmile ?? 0,
        frownIntensity: 0,
        affect: isAnswering ? 'positive' : 'neutral',
        poseConfidence: aiData?.faceDetectionConfidence ?? 0,
        faceConfidence: aiData?.faceDetectionConfidence ?? 0
      });
    }, 100);
    return () => clearInterval(recordLoop);
  }, [onFeatureCapture, latestAIResult, displayItems, targetIdx, isAnswering]);

  return (
    <div className="tiengkeu-container">
      <style>{styles}</style>
      
      <div className="tiengkeu-timer">⏱️ {timeElapsed}s / {GAME_DURATION}s</div>

      {isAnswering && (
        <div className="sound-pulse" style={{ left: targetIdx === 0 ? '30%' : '70%', top: '50%' }}></div>
      )}

      <div className="tiengkeu-options">
        {displayItems.map((item, idx) => (
          <div 
            key={idx}
            className={`tiengkeu-card ${isAnswering && idx === targetIdx ? 'active' : ''}`}
            onClick={() => handleTap(idx)}
          >
            <div className="tiengkeu-emoji">{item.emoji}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '60px', fontSize: '50px', fontWeight: 'bold', color: '#33691E' }}>
        {isAnswering ? displayItems[targetIdx].sound : displayItems[targetIdx]?.name}
      </div>
    </div>
  );
};

export default G2_3_TiengKeuCuaAi;