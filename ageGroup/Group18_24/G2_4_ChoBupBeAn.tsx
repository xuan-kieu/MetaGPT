import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G2_4_ChoBupBeAn: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- CSS NÂNG CẤP DỄ THƯƠNG ---
  const styles = `
    .bupbe-container {
      width: 100%; height: 100%; position: relative;
      background: linear-gradient(180deg, #FFF0F5 0%, #FFD1DC 100%);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    
    .bupbe-doll-box {
      width: 320px; height: 320px; background: white; border-radius: 50%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      box-shadow: 0 15px 30px rgba(255, 105, 180, 0.2); 
      border: 12px solid #FF80AB; position: relative;
      transition: all 0.5s ease;
    }

    .bupbe-face { font-size: 160px; filter: drop-shadow(0 5px 10px rgba(0,0,0,0.1)); }
    
    .bupbe-blush {
      position: absolute; width: 40px; height: 20px;
      background: #FF80AB; border-radius: 50%; opacity: 0.4;
      filter: blur(5px); bottom: 120px;
    }
    .blush-left { left: 60px; }
    .blush-right { right: 60px; }

    .bupbe-bib { 
      position: absolute; bottom: 20px; font-size: 90px; 
      animation: swing 2s infinite ease-in-out;
    }
    
    .bupbe-tools-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px;
      margin-left: 40px;
    }

    .bupbe-tool-card {
      width: 140px; height: 140px; background: white; border-radius: 35px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      cursor: pointer; box-shadow: 0 8px 15px rgba(0,0,0,0.05); 
      border: 6px solid #FCE4EC; transition: all 0.2s;
    }

    .bupbe-tool-card:active { transform: scale(0.9) rotate(-5deg); border-color: #FF4081; }
    .tool-emoji { font-size: 65px; margin-bottom: 5px; }
    .tool-name { font-size: 22px; font-weight: bold; color: #AD1457; }

    .bupbe-instruction {
      margin-top: 50px; font-size: 38px; font-weight: bold; color: #C2185B;
      text-shadow: 1px 1px 2px white; animation: float 3s infinite;
    }

    @keyframes swing {
      0%, 100% { transform: rotate(-5deg); }
      50% { transform: rotate(5deg); }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  `;

  // --- LOGIC ---
  const [hasBib, setHasBib] = useState(false);
  const [dollState, setDollState] = useState("👧"); // Búp bê bé gái dễ thương
  const GAME_DURATION = 180;

  const tools = [
    { id: 'bib', name: "Yếm xinh", emoji: "🎀", call: "Đeo nơ hồng xinh cho búp bê nè" },
    { id: 'milk', name: "Sữa thơm", emoji: "🍼", call: "Búp bê uống sữa ngon ơi là ngon" },
    { id: 'cake', name: "Bánh ngọt", emoji: "🍰", call: "Măm măm bánh ngọt ngọt lịm" },
    { id: 'wipe', name: "Khăn sạch", emoji: "🧼", call: "Lau má hồng sạch xinh cho bé nhé" }
  ];

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'vi-VN';
      msg.rate = 0.85;
      msg.pitch = 1.3; // Giọng cao và trong hơn cho dễ thương
      window.speechSynthesis.speak(msg);
    }
  };

  const handleAction = (tool: any) => {
    speak(tool.call);

    if (tool.id === 'bib') setHasBib(true);
    
    if (tool.id === 'milk' || tool.id === 'cake') {
      setDollState("🥰"); // Biểu cảm cực thích thú
      setTimeout(() => setDollState("👧"), 2500);
    }
    
    if (tool.id === 'wipe') {
      setDollState("😄"); // Cười tươi
      setTimeout(() => setDollState("👧"), 2000);
    }
  };

  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      onFeatureCapture({
        timestamp: Date.now(),
        gazeX: aiData?.gazeX ?? 0.5,
        gazeY: aiData?.gazeY ?? 0.5,
        targetX: 30,
        targetY: 50,
        targetSize: 320,
        audioStimulus: dollState === "🥰" ? "Hạnh phúc" : null,
        isLookingAtTarget: false,
        attentionLevel: aiData?.avgAttention ?? 0.5,
        smileIntensity: aiData?.avgSmile ?? 0,
        frownIntensity: 0,
        affect: dollState === "🥰" ? 'positive' : 'neutral',
        poseConfidence: aiData?.faceDetectionConfidence ?? 0,
        faceConfidence: aiData?.faceDetectionConfidence ?? 0
      });
    }, 100);
    return () => clearInterval(recordLoop);
  }, [onFeatureCapture, latestAIResult, dollState]);

  return (
    <div className="bupbe-container">
      <style>{styles}</style>
      
      <div style={{ position: 'absolute', top: 20, right: 30, color: '#C2185B', fontWeight: 'bold' }}>
        ⏱️ {timeElapsed}s / {GAME_DURATION}s
      </div>

      <div className="bupbe-main-stage">
        {/* Búp bê dễ thương */}
        <div className="bupbe-doll-box">
          <div className="bupbe-face">{dollState}</div>
          <div className="bupbe-blush blush-left"></div>
          <div className="bupbe-blush blush-right"></div>
          {hasBib && <div className="bupbe-bib">🎀</div>}
        </div>

        {/* Dụng cụ sắc màu */}
        <div className="bupbe-tools-grid">
          {tools.map(tool => (
            <div key={tool.id} className="bupbe-tool-card" onClick={() => handleAction(tool)}>
              <div className="tool-emoji">{tool.emoji}</div>
              <div className="tool-name">{tool.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bupbe-instruction">
        Yêu búp bê nhất nè! 💕
      </div>
    </div>
  );
};

export default G2_4_ChoBupBeAn;