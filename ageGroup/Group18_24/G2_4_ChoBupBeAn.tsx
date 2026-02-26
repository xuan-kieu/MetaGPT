import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SubGameProps } from '../../types';

const G2_4_ChoBupBeAn: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- CSS TẬP TRUNG VÀO HÀNH ĐỘNG CHO ĂN ---
  const styles = `
    .bupbe-container {
      width: 100%; height: 100%; position: relative;
      background: linear-gradient(180deg, #FFF0F5 0%, #FFD1DC 100%);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      overflow: hidden;
    }
    
    .bupbe-doll-box {
      width: 350px; height: 350px; background: white; border-radius: 50%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      box-shadow: 0 15px 30px rgba(255, 105, 180, 0.2); 
      border: 12px solid #FF80AB; position: relative;
      transition: all 0.3s ease;
      z-index: 1;
    }

    .bupbe-face { font-size: 180px; transition: transform 0.2s; }
    
    /* Vùng miệng búp bê để nhận diện thả thìa */
    .bupbe-mouth-target {
      position: absolute; bottom: 80px; width: 100px; height: 100px;
      background: rgba(255, 64, 129, 0.1); border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 4px dashed #FF4081; opacity: 0; transition: opacity 0.3s;
    }
    .mouth-active { opacity: 1; transform: scale(1.2); }

    .spoon-area {
      margin-top: 40px; width: 100%; display: flex; justify-content: center; height: 150px;
    }

    .spoon-item {
      font-size: 100px; cursor: grab; filter: drop-shadow(0 5px 10px rgba(0,0,0,0.2));
      transition: transform 0.1s; touch-action: none;
    }
    .spoon-item:active { cursor: grabbing; }

    .bupbe-instruction {
      margin-top: 20px; font-size: 42px; font-weight: bold; color: #C2185B;
      text-align: center; z-index: 2;
    }

    .feeding-particle {
      position: absolute; font-size: 40px; animation: flyUp 1s forwards;
    }

    @keyframes flyUp {
      0% { transform: translateY(0) scale(1); opacity: 1; }
      100% { transform: translateY(-100px) scale(2); opacity: 0; }
    }
  `;

  // --- LOGIC ---
  const [dollState, setDollState] = useState("👧"); // 👧, 😮 (há miệng), 🥰 (ngon miệng)
  const [isDragging, setIsDragging] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const GAME_DURATION = 180;

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'vi-VN';
      msg.rate = 0.9;
      msg.pitch = 1.3;
      window.speechSynthesis.speak(msg);
    }
  }, []);

  // Hướng dẫn ban đầu
  useEffect(() => {
    speak("Búp bê đói rồi, con cho bạn ấy ăn nhé!");
  }, [speak]);

  // Xử lý kéo thả thủ công (để mượt mà trên cả cảm ứng và chuột)
  const onDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    setDollState("😮"); // Búp bê há miệng chờ ăn
    e.dataTransfer.setData("item", "spoon");
  };

  const onDragEnd = () => {
    setIsDragging(false);
    if (!isSuccess) setDollState("👧");
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setIsSuccess(true);
    setDollState("🥰");
    speak("Măm măm, ngon quá! Cảm ơn bé nhé!");

    // Reset sau 3 giây để cho ăn tiếp
    setTimeout(() => {
      setDollState("👧");
      setIsSuccess(false);
    }, 3000);
  };

  // --- RECORD AI DATA ---
  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      const gx = aiData?.gazeX ?? 0.5;
      const gy = aiData?.gazeY ?? 0.5;

      // Kiểm tra trẻ có nhìn vào búp bê (giữa màn hình) hay cái thìa (phía dưới)
      const isLookingAtDoll = gx > 0.3 && gx < 0.7 && gy < 0.6;
      const isLookingAtSpoon = gy > 0.7;

      onFeatureCapture({
        timestamp: Date.now(),
        gazeX: gx, gazeY: gy,
        targetX: 50, targetY: 40, targetSize: 350,
        isLookingAtTarget: isLookingAtDoll,
        
        // --- DỮ LIỆU CHUYÊN SÂU CHO HÀNH ĐỘNG CHO ĂN ---
        isDraggingSpoon: isDragging,
        isLookingAtSpoon: isLookingAtSpoon,
        feedingSuccess: isSuccess,
        smileIntensity: aiData?.avgSmile ?? 0,
        attentionLevel: aiData?.avgAttention ?? 0.5,
        poseConfidence: aiData?.faceDetectionConfidence ?? 0,
        affect: isSuccess ? 'positive' : (isDragging ? 'focused' : 'neutral')
      } as any);
    }, 300);
    return () => clearInterval(recordLoop);
  }, [onFeatureCapture, latestAIResult, isDragging, isSuccess]);

  return (
    <div className="bupbe-container">
      <style>{styles}</style>
      
      <div style={{ position: 'absolute', top: 20, right: 30, color: '#C2185B', fontWeight: 'bold' }}>
        ⏱️ {timeElapsed}s / {GAME_DURATION}s
      </div>

      <div className="bupbe-instruction">
        {isSuccess ? "Ngon ơi là ngon! ✨" : "Cho búp bê ăn nào!"}
      </div>

      {/* Khu vực Búp bê */}
      <div 
        className="bupbe-doll-box"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <div className="bupbe-face">{dollState}</div>
        
        {/* Vùng miệng làm mục tiêu */}
        <div className={`bupbe-mouth-target ${isDragging ? 'mouth-active' : ''}`}>
          {isDragging && <span style={{fontSize: '40px'}}>🥣</span>}
        </div>

        {isSuccess && <div className="feeding-particle">🍭</div>}
      </div>

      {/* Khu vực Cái thìa */}
      <div className="spoon-area">
        {!isSuccess && (
          <div 
            className="spoon-item"
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          >
            🥄
          </div>
        )}
      </div>
    </div>
  );
};

export default G2_4_ChoBupBeAn;