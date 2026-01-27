import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G2_5_TimBongHinh: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- CSS TỐI GIẢN ---
  const styles = `
    .timbong-container {
      width: 100%; height: 100%; position: relative;
      background: linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .timbong-timer {
      position: absolute; top: 20px; right: 20px;
      background: rgba(0,0,0,0.4); color: white; padding: 8px 15px; border-radius: 20px;
    }
    .timbong-target-area {
      background: white; border-radius: 40px; padding: 30px;
      margin-bottom: 50px; box-shadow: 0 10px 20px rgba(0,0,0,0.05);
      border: 6px solid #FF9800;
    }
    .timbong-emoji-large { font-size: 150px; }
    
    .timbong-options {
      display: flex; gap: 40px; justify-content: center; width: 100%;
    }
    .timbong-shadow-card {
      background: white; border-radius: 35px; padding: 40px;
      box-shadow: 0 10px 20px rgba(0,0,0,0.1); border: 8px solid transparent;
      transition: all 0.3s; cursor: pointer;
    }
    /* Biến Emoji thành bóng đen thuần túy */
    .is-shadow {
      filter: brightness(0); 
      opacity: 0.8;
      font-size: 120px;
    }
    .timbong-shadow-card.correct-flash {
      border-color: #4CAF50; transform: scale(1.1);
    }
    .timbong-instruction {
      margin-top: 40px; font-size: 36px; font-weight: bold; color: #00796B;
    }
  `;

  // --- DỮ LIỆU VẬT THỂ QUEN THUỘC ---
  const shapeObjects = useMemo(() => [
    { name: "Con vịt", emoji: "🦆" },
    { name: "Con voi", emoji: "🐘" },
    { name: "Ô tô", emoji: "🚗" },
    { name: "Cái cây", emoji: "🌳" },
    { name: "Quả táo", emoji: "🍎" },
    { name: "Máy bay", emoji: "✈️" },
    { name: "Con cá", emoji: "🐟" },
    { name: "Cái ô", emoji: "☂️" }
  ], []);

  const [target, setTarget] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const GAME_DURATION = 180;

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'vi-VN';
      msg.rate = 0.85;
      window.speechSynthesis.speak(msg);
    }
  };

  const initRound = () => {
    setIsSuccess(false);
    const shuffled = [...shapeObjects].sort(() => 0.5 - Math.random());
    const correct = shuffled[0];
    const wrong = shuffled[1];
    
    // Tạo danh sách 2 bóng (1 đúng 1 sai)
    const currentOptions = [correct, wrong].sort(() => 0.5 - Math.random());
    
    setTarget(correct);
    setOptions(currentOptions);
    speak(correct.name);
  };

  useEffect(() => {
    initRound();
    return () => window.speechSynthesis.cancel();
  }, [shapeObjects]);

  const handleSelect = (selectedName: string) => {
    if (isSuccess) return;
    
    if (selectedName === target.name) {
      setIsSuccess(true);
      speak("Đúng rồi!");
      setTimeout(initRound, 2500);
    } else {
      speak(target.name); // Nhắc lại tên vật thể để bé tìm lại
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
        targetX: 50,
        targetY: 30, // Vị trí của vật thể màu
        targetSize: 200,
        audioStimulus: target?.name || null,
        isLookingAtTarget: false,
        attentionLevel: aiData?.avgAttention ?? 0.5,
        smileIntensity: aiData?.avgSmile ?? 0,
        frownIntensity: 0,
        affect: isSuccess ? 'positive' : 'neutral',
        poseConfidence: aiData?.faceDetectionConfidence ?? 0,
        faceConfidence: aiData?.faceDetectionConfidence ?? 0
      });
    }, 100);
    return () => clearInterval(recordLoop);
  }, [onFeatureCapture, latestAIResult, target, isSuccess]);

  return (
    <div className="timbong-container">
      <style>{styles}</style>
      
      <div className="timbong-timer">⏱️ {timeElapsed}s / {GAME_DURATION}s</div>

      {/* Vật thể mục tiêu (Có màu) */}
      {target && (
        <div className="timbong-target-area">
          <div className="timbong-emoji-large">{target.emoji}</div>
        </div>
      )}

      {/* Các lựa chọn bóng (Đen thui) */}
      <div className="timbong-options">
        {options.map((opt, idx) => (
          <div 
            key={idx}
            className={`timbong-shadow-card ${isSuccess && opt.name === target.name ? 'correct-flash' : ''}`}
            onClick={() => handleSelect(opt.name)}
          >
            <div className="is-shadow">{opt.emoji}</div>
          </div>
        ))}
      </div>

      <div className="timbong-instruction">
        {isSuccess ? "🌟 Bé giỏi quá! 🌟" : "Bóng của bạn nào đây nhỉ?"}
      </div>
    </div>
  );
};

export default G2_5_TimBongHinh;