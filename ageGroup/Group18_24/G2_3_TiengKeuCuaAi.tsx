import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G2_3_TiengKeuCuaAi: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- CSS TỐI ƯU CHO 3 CARD ---
  const styles = `
    .tiengkeu-container {
      width: 100%; height: 100%; position: relative;
      background: #F0F4C3;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .tiengkeu-timer {
      position: absolute; top: 20px; right: 20px;
      background: rgba(0,0,0,0.4); color: white; padding: 8px 15px; border-radius: 20px;
    }
    .tiengkeu-options {
      display: flex; gap: 30px; justify-content: center; width: 90%;
    }
    .tiengkeu-card {
      background: white; border-radius: 40px; padding: 40px; flex: 1; max-width: 250px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 8px solid transparent;
      transition: all 0.3s ease; cursor: pointer; text-align: center;
    }
    .tiengkeu-card.active { 
      border-color: #CDDC39; 
      transform: scale(1.1);
      animation: shake 0.5s infinite;
    }
    .tiengkeu-emoji { font-size: 100px; }
    
    @keyframes shake {
      0%, 100% { transform: scale(1.1) rotate(0deg); }
      25% { transform: scale(1.1) rotate(-3deg); }
      75% { transform: scale(1.1) rotate(3deg); }
    }

    .mic-indicator {
      position: absolute; bottom: 20px; right: 20px; font-size: 24px;
      color: #FF5722; animation: blink 1s infinite;
    }
    @keyframes blink { 50% { opacity: 0; } }
  `;

  const animals = useMemo(() => [
    { name: "Con mèo", emoji: "🐱", sound: "Meo meo" },
    { name: "Con chó", emoji: "🐶", sound: "Gâu gâu" },
    { name: "Con vịt", emoji: "🦆", sound: "Cạc cạc" },
    { name: "Con gà", emoji: "🐔", sound: "Ò ó o" },
    { name: "Con bò", emoji: "🐮", sound: "Ùm bò" },
    { name: "Con lợn", emoji: "🐷", sound: "Ụt ịt" }
  ], []);

  // --- STATE ---
  const [displayItems, setDisplayItems] = useState<any[]>([]);
  const [targetIdx, setTargetIdx] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false);
  const [reactionStartTime, setReactionStartTime] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false); // Trẻ có đang nhìn quét qua các con vật?

  const GAME_DURATION = 180;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const speak = useCallback((text: string, rate = 0.8, onEnd?: () => void) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'vi-VN';
      msg.rate = rate;
      if (onEnd) msg.onend = onEnd;
      window.speechSynthesis.speak(msg);
    }
  }, []);

  const initRound = useCallback(() => {
    setIsAnswering(false);
    const shuffled = [...animals].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3); // 3 con vật
    const target = Math.floor(Math.random() * 3);

    setDisplayItems(selected);
    setTargetIdx(target);

    // FLOW: Tiếng kêu -> Câu hỏi
    setTimeout(() => {
      speak(selected[target].sound, 0.7, () => {
        // Sau khi phát tiếng kêu, hỏi
        setTimeout(() => {
          speak("Con nào kêu thế nhỉ? Chạm vào nó đi!");
          setReactionStartTime(Date.now()); // Bắt đầu tính thời gian phản ứng
        }, 500);
      });
    }, 800);
  }, [animals, speak]);

  useEffect(() => {
    initRound();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.speechSynthesis.cancel();
    };
  }, [initRound]);

  const handleTap = (idx: number) => {
    if (isAnswering) return;
    
    const reactionTime = (Date.now() - reactionStartTime) / 1000;

    if (idx === targetIdx) {
      setIsAnswering(true);
      speak(`Đúng rồi! ${displayItems[idx].sound}`, 0.8);
      
      // Ghi nhận thành tích ngay lúc này nếu cần qua console hoặc callback
      console.log(`Phản ứng sau: ${reactionTime}s`);
      
      setTimeout(initRound, 3500);
    } else {
      speak(`Ơ kìa, lắng nghe lại nhé! ${displayItems[targetIdx].sound}`);
    }
  };

  // --- AI TRACKING LOOP ---
  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      const gx = aiData?.gazeX ?? 0.5;
      const gy = aiData?.gazeY ?? 0.5;

      // Tracking ánh mắt quét qua 3 card (chia màn hình làm 3 cột 0-33, 34-66, 67-100)
      const lookingAtIdx = gx < 0.33 ? 0 : gx < 0.66 ? 1 : 2;
      const isLookingAtAnyCard = gy > 0.3 && gy < 0.7;

      // Tracking giả lập Micro (bắt chước tiếng kêu)
      const isVocalizing = aiData?.isSpeaking || false; // Giả định trường này tồn tại

      onFeatureCapture({
        timestamp: Date.now(),
        gazeX: gx, gazeY: gy,
        targetX: targetIdx === 0 ? 15 : targetIdx === 1 ? 50 : 85,
        targetY: 50,
        audioStimulus: displayItems[targetIdx]?.sound || null,
        isLookingAtTarget: lookingAtIdx === targetIdx && isLookingAtAnyCard,
        
        // --- TRƯỜNG MỚI THEO YÊU CẦU ---
        reactionTimeSeconds: isAnswering ? (Date.now() - reactionStartTime) / 1000 : null,
        isScanningOptions: isLookingAtAnyCard, // Đang nhìn vào khu vực các lựa chọn
        isImitatingSound: isVocalizing && isAnswering, // Trẻ nói khi đang ở màn hình kết quả
        voiceVolume: aiData?.audioLevel ?? 0,
        attentionLevel: aiData?.avgAttention ?? 0.5,
        affect: isAnswering ? 'positive' : 'neutral'
      } as any);
    }, 100);
    return () => clearInterval(recordLoop);
  }, [onFeatureCapture, latestAIResult, displayItems, targetIdx, isAnswering, reactionStartTime]);

  return (
    <div className="tiengkeu-container">
      <style>{styles}</style>
      
      <div className="tiengkeu-timer">⏱️ {timeElapsed}s / {GAME_DURATION}s</div>

      {latestAIResult.current?.features?.isSpeaking && (
        <div className="mic-indicator">🎤 Bé đang nói...</div>
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

      <div style={{ marginTop: '50px', fontSize: '42px', fontWeight: 'bold', color: '#33691E', textAlign: 'center' }}>
        {isAnswering 
          ? `Giỏi quá! ${displayItems[targetIdx].sound}` 
          : "Lắng nghe xem tiếng ai nhỉ?"}
      </div>
    </div>
  );
};

export default G2_3_TiengKeuCuaAi;