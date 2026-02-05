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
      display: flex; flex-direction: column; align-items: center; justify-content: space-around;
      padding: 20px;
    }
    .chitay-timer {
      position: absolute; top: 20px; right: 20px;
      background: rgba(0, 0, 0, 0.6); color: white;
      padding: 10px 20px; border-radius: 20px; font-size: 18px;
    }
    /* Style cho nhân vật dẫn dắt */
    .chitay-character-mascot {
      font-size: 80px; margin-bottom: 10px;
      filter: drop-shadow(0 5px 10px rgba(0,0,0,0.1));
      animation: float 3s ease-in-out infinite;
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
    .chitay-object-box.is-target { border-color: #FF6B9D; }
    .chitay-emoji { font-size: 130px; margin-bottom: 10px; }
    .chitay-name { font-size: 38px; font-weight: bold; color: #333; }
    .chitay-instruction {
      background: white;
      padding: 15px 50px; border-radius: 30px; font-size: 36px;
      font-weight: bold; color: #FF6B9D; box-shadow: 0 10px 25px rgba(255, 107, 157, 0.2);
      margin-top: 20px; text-align: center;
    }
    .chitay-pointer { position: absolute; top: -90px; font-size: 80px; animation: bounce 1.5s infinite; }
    
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  `;

  // --- LOGIC ---
  const GAME_DURATION = 180;
  const AUTO_NEXT_DELAY = 10000; // Tăng một chút để kịp nghe câu hỏi dài

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

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'vi-VN';
      msg.rate = 0.9;
      msg.pitch = 1.2; // Giọng cao một chút cho thân thiện với trẻ em
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

    // Phát câu hỏi đầy đủ
    const question = `${selected[targetInLocal].name} đâu nhỉ? Con chỉ giúp bạn ấy đi!`;
    speak(question);

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
    speak(`Giỏi quá! Đây là ${displayItems[targetIdx].name}!`);

    if (nextRoundRef.current) clearTimeout(nextRoundRef.current);
    setTimeout(initRound, 3000);
  };

  // --- RECORD AI DATA ---
  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      
      // Tính toán xem trẻ có đang nhìn vào nhân vật mascot không
      // Giả định nhân vật ở phía trên chính giữa (y khoảng 0.2)
      const isLookingAtMascot = (aiData?.gazeX > 0.4 && aiData?.gazeX < 0.6 && aiData?.gazeY < 0.3);

      onFeatureCapture({
        timestamp: Date.now(),
        gazeX: aiData?.gazeX ?? 0.5, 
        gazeY: aiData?.gazeY ?? 0.5,
        targetX: targetIdx === 0 ? 35 : 65, 
        targetY: 50, 
        targetSize: 250,
        audioStimulus: displayItems[targetIdx]?.name || null,
        isLookingAtTarget: false,
        attentionLevel: aiData?.avgAttention ?? 0.5,
        smileIntensity: aiData?.avgSmile ?? 0,
        frownIntensity: 0,
        affect: showSuccess ? 'positive' : 'neutral',
        poseConfidence: aiData?.faceDetectionConfidence ?? 0,
        faceConfidence: aiData?.faceDetectionConfidence ?? 0,
        
        // --- CÁC TRƯỜNG BỔ SUNG ---
        isLookingAtMascot: isLookingAtMascot,
        handDetected: aiData?.handDetected ?? false, // Giả định AI cung cấp
        handPositionX: aiData?.handX ?? null,
        handPositionY: aiData?.handY ?? null,
        interactionType: 'joint_attention' 
      } as any);
    }, 100);
    return () => clearInterval(recordLoop);
  }, [onFeatureCapture, latestAIResult, displayItems, targetIdx, showSuccess]);

  return (
    <div className="chitay-game-container">
      <style>{styles}</style>
      
      <div className="chitay-timer">⏱️ {timeElapsed}s / {GAME_DURATION}s</div>

      {/* Nhân vật Mascot */}
      <div className="chitay-character-mascot">
        {showSuccess ? "🐻🎉" : "🐻"}
      </div>

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
        {showSuccess ? "Đúng rồi! Tuyệt vời!" : `${displayItems[targetIdx]?.name} đâu nhỉ?`}
      </div>
    </div>
  );
};

export default G2_1_ChiTayTinhMat;