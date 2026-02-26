import React, { useState, useEffect, useRef } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

// --- MỞ RỘNG INTERFACE CHO DỮ LIỆU AI ---
interface EnhancedFeature extends BehavioralFeature {
  userHandAction?: 'clapping' | 'waving' | 'none';
  userAudioLevel?: number;
  isAiSpeaking?: boolean;
}

// --- 1. COMPONENT CHÚ SÓC (SVG) ---
const SquirrelCharacter: React.FC<{ isClapping: boolean; scale?: number }> = ({ isClapping, scale = 1 }) => {
  return (
    <div className="squirrel-character-wrapper">
      <div className="squirrel-container-svg" style={{ transform: `scale(${scale})` }}>
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          {/* ĐUÔI SÓC */}
          <g className="tail">
            <path d="M130,160 Q180,160 180,110 Q180,60 130,50 Q100,45 90,80 Q80,50 50,60" fill="#d97706" stroke="#b45309" strokeWidth="3" />
          </g>
          
          {/* THÂN & CHÂN */}
          <g className="body-group">
            <ellipse cx="80" cy="165" rx="15" ry="10" fill="#d97706" />
            <ellipse cx="120" cy="165" rx="15" ry="10" fill="#d97706" />
            <path d="M70,170 Q60,100 100,90 Q140,100 130,170 Z" fill="#f59e0b" />
            <path d="M80,165 Q75,120 100,115 Q125,120 120,165 Z" fill="#fef3c7" />
            
            {/* ĐẦU SÓC */}
            <g transform="translate(0, -2)">
              <path d="M65,55 Q55,20 80,45" fill="#f59e0b" stroke="#b45309" strokeWidth="2"/>
              <path d="M135,55 Q145,20 120,45" fill="#f59e0b" stroke="#b45309" strokeWidth="2"/>
              <circle cx="100" cy="80" r="45" fill="#f59e0b" />
              <circle cx="85" cy="75" r="6" fill="#1f2937" />
              <circle cx="115" cy="75" r="6" fill="#1f2937" />
              <circle cx="100" cy="82" r="3" fill="#451a03" />
              <path d="M95,90 Q100,95 105,90" fill="none" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* TAY TRÁI */}
            <g className={`arm left-arm ${isClapping ? 'clapping' : ''}`}>
              <ellipse cx="75" cy="110" rx="8" ry="18" fill="#f59e0b" stroke="#b45309" strokeWidth="1" transform="rotate(-20 75 110)" />
            </g>

            {/* TAY PHẢI */}
            <g className={`arm right-arm ${isClapping ? 'clapping' : ''}`}>
              <ellipse cx="125" cy="110" rx="8" ry="18" fill="#f59e0b" stroke="#b45309" strokeWidth="1" transform="rotate(20 125 110)" />
            </g>
          </g>
        </svg>
        {isClapping && <div className="squirrel-clap-effect">👏</div>}
      </div>
    </div>
  );
};

// --- 2. MAIN GAME COMPONENT ---
const G1_2_Clapping: React.FC<SubGameProps> = ({ latestAIResult, onFeatureCapture, timeElapsed }) => {
  // --- STATE & REFS ---
  const [isClapping, setIsClapping] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const clapTimeoutRef = useRef<NodeJS.Timeout[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastClapTimeRef = useRef<number>(0);
  const GAME_DURATION = 120;

  // --- LOGIC: GIỌNG NÓI (SPEECH SYNTHESIS) ---
  const speakInstruction = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.9;
      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- LOGIC: ÂM THANH VỖ TAY ---
  const playClapSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      if (now - lastClapTimeRef.current < 0.2) return;
      lastClapTimeRef.current = now;

      const whiteNoise = ctx.createBufferSource();
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      
      whiteNoise.buffer = buffer;
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, now);
      
      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      whiteNoise.start(now);
      whiteNoise.stop(now + 0.15);
    } catch (e) { console.log(e); }
  };

  // --- EFFECT: CHU KỲ TRÒ CHƠI ---
  useEffect(() => {
    // 1. Chào hỏi khi bắt đầu
    speakInstruction("Chào bé! Bé hãy vỗ tay cùng bạn Sóc nhé!");

    // 2. Lập lịch vỗ tay
    const scheduleNextClap = () => {
      const restTime = Math.random() * 3000 + 2000;
      const timer = setTimeout(() => {
        const count = Math.floor(Math.random() * 3) + 1;
        performClaps(count);
      }, restTime);
      clapTimeoutRef.current.push(timer);
    };

    const performClaps = (count: number) => {
      let current = 0;
      const interval = setInterval(() => {
        if (current >= count) {
          clearInterval(interval);
          scheduleNextClap();
          return;
        }
        setIsClapping(true);
        playClapSound();
        const timer = setTimeout(() => setIsClapping(false), 300);
        clapTimeoutRef.current.push(timer);
        current++;
      }, 800);
      clapTimeoutRef.current.push(interval as any);
    };

    scheduleNextClap();

    return () => {
      clapTimeoutRef.current.forEach(timer => clearTimeout(timer));
      window.speechSynthesis.cancel();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // --- EFFECT: RECORDING LOOP (AI Integration) ---
  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;

      // Trích xuất dữ liệu Pose và Micro từ AI model (Giả định structure)
      const userHandAction = aiData?.isUserClapping ? 'clapping' : 'none';
      const userAudioLevel = aiData?.micVolume || 0; 

      const feature: EnhancedFeature = {
        timestamp: Date.now(),
        gazeX: aiData?.gazeX ?? 0.5,
        gazeY: aiData?.gazeY ?? 0.5,
        targetX: 50,
        targetY: 50,
        targetSize: 200,
        audioStimulus: isClapping ? "clap" : (isAiSpeaking ? "speech" : null),
        isLookingAtTarget: false,
        attentionLevel: aiData?.avgAttention ?? 0.5,
        smileIntensity: aiData?.avgSmile ?? 0,
        frownIntensity: 0,
        affect: 'neutral',
        poseConfidence: aiData?.faceDetectionConfidence ?? 0,
        faceConfidence: aiData?.faceDetectionConfidence ?? 0,
        // DỮ LIỆU BỔ SUNG YÊU CẦU:
        userHandAction: userHandAction as any,
        userAudioLevel: userAudioLevel,
        isAiSpeaking: isAiSpeaking
      };
      
      onFeatureCapture(feature);
    }, 300);

    return () => clearInterval(recordLoop);
  }, [isClapping, isAiSpeaking, onFeatureCapture, latestAIResult]);

  // --- CSS STYLES ---
  const styles = `
    .squirrel-clapping-game {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%);
      position: relative;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    .game-timer {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 16px;
      font-weight: bold;
      z-index: 10;
    }

    .game-title {
      font-size: 28px;
      color: #D35400;
      margin-bottom: 20px;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
      z-index: 5;
    }

    .game-instruction {
      margin-top: 20px;
      font-size: 20px;
      color: #795548;
      font-weight: bold;
      background: rgba(255,255,255,0.8);
      padding: 10px 20px;
      border-radius: 15px;
    }

    /* --- SQUIRREL CHARACTER STYLES --- */
    .squirrel-character-wrapper {
      position: relative;
      z-index: 5;
    }

    .squirrel-container-svg {
      width: 250px;
      height: 250px;
      margin: 0 auto;
      position: relative;
      filter: drop-shadow(0 10px 10px rgba(0,0,0,0.15));
      transition: transform 0.2s ease;
    }

    /* Hiệu ứng nhún nhảy toàn thân */
    .squirrel-container-svg svg {
      animation: float 3s ease-in-out infinite;
    }

    /* Hiệu ứng vẫy đuôi */
    .tail {
      transform-origin: 130px 160px; /* Tâm xoay ở gốc đuôi */
      animation: tailWag 2s ease-in-out infinite alternate;
    }

    /* Hiệu ứng vỗ tay (Arm Animation) */
    .arm {
      transform-origin: center top;
      transition: transform 0.1s;
    }
    
    .left-arm.clapping {
      animation: clapLeft 0.2s ease-in-out infinite alternate;
    }
    
    .right-arm.clapping {
      animation: clapRight 0.2s ease-in-out infinite alternate;
    }

    /* Visual Effect Text */
    .squirrel-clap-effect {
      position: absolute;
      top: 40%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 50px;
      animation: popEffect 0.3s ease-out;
      pointer-events: none;
    }

    /* --- KEYFRAMES --- */
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    @keyframes tailWag {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(10deg); }
    }

    @keyframes clapLeft {
      from { transform: rotate(0deg); }
      to { transform: rotate(25deg) translateX(5px); }
    }

    @keyframes clapRight {
      from { transform: rotate(0deg); }
      to { transform: rotate(-25deg) translateX(-5px); }
    }

    @keyframes popEffect {
      0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
      50% { opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
    }

    @media (max-width: 768px) {
      .squirrel-container-svg {
        width: 180px;
        height: 180px;
      }
      .game-title { font-size: 22px; }
    }
  `;

  return (
    <div className="squirrel-clapping-game">
      <style>{styles}</style>

      <div className="game-timer">
        ⏱️ {timeElapsed}s / {GAME_DURATION}s
      </div>
      
      <h1 className="game-title">Sóc Vỗ Tay 👋</h1>
      
      <SquirrelCharacter isClapping={isClapping} scale={0.9} />
      
      <div className="game-instruction">
        {isAiSpeaking ? "👂 Lắng nghe bạn Sóc..." : "👏 Bé vỗ tay cùng Sóc nào!"}
      </div>

      {/* Hiển thị khích lệ nếu AI phát hiện trẻ vỗ tay */}
      {latestAIResult.current?.features?.isUserClapping && (
        <div style={{ position: 'absolute', bottom: 100, fontSize: '30px', animation: 'bounce 1s infinite' }}>
          🌟 Bé giỏi quá!
        </div>
      )}
    </div>
  );
};

export default G1_2_Clapping;