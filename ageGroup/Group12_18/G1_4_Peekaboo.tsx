import React, { useState, useEffect, useRef } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

interface PeekabooFeature extends BehavioralFeature {
  anticipationScore?: number;
  childVocalization?: number;
  isObjectVisible?: boolean;
}

const G1_4_Peekaboo: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  childName,
  timeElapsed 
}) => {
  
  const styles = `
    .peekaboo-game-container {
      width: 100%; height: 100%; position: relative;
      background: linear-gradient(to bottom, #87CEEB 0%, #B0E0E6 50%, #7CFC00 50%, #228B22 100%);
      overflow: hidden; border-radius: 20px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .game-timer {
      position: absolute; top: 20px; right: 20px; background: rgba(0, 0, 0, 0.7);
      color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold; z-index: 100;
    }

    .game-title {
      position: absolute; top: 20px; left: 20px; color: white; font-size: 28px;
      font-weight: bold; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3); z-index: 100;
    }

    @keyframes shake {
      0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
      25% { transform: translate(-52%, -51%) rotate(-3deg); }
      75% { transform: translate(-48%, -49%) rotate(3deg); }
    }

    @keyframes bearJump {
      0%, 100% { transform: translate(-50%, 0); }
      50% { transform: translate(-50%, -20px); }
    }

    .bush-wrapper { position: absolute; transform: translate(-50%, -50%); }

    .bush-container {
      width: 160px; height: 120px; position: relative; z-index: 20;
      filter: drop-shadow(0px 10px 5px rgba(0,0,0,0.3));
    }
    
    .bush-main {
      width: 100%; height: 100%; background: linear-gradient(135deg, #4CAF50, #1B5E20);
      border-radius: 60% 40% 50% 50% / 50% 50% 40% 60%;
    }

    .bear-character {
      position: absolute; width: 90px; height: 100px; left: 50%;
      z-index: 10; 
      /* CHỈNH TỐC ĐỘ XUẤT HIỆN CHẬM LẠI THÀNH 3S TẠI ĐÂY */
      transition: transform 3s ease-out, opacity 0.5s;
    }

    .bear-head {
      width: 100%; height: 85%; background: #8D6E63; border-radius: 48%; position: relative;
    }

    .ear { position: absolute; top: -5px; width: 25px; height: 25px; background: #8D6E63; border-radius: 50%; }
    .ear.left { left: 0; } .ear.right { right: 0; }
    .eye { position: absolute; top: 30%; width: 10px; height: 10px; background: #212121; border-radius: 50%; }
    .eye.left { left: 20%; } .eye.right { right: 20%; }
    .muzzle { position: absolute; bottom: 10%; left: 50%; transform: translateX(-50%); width: 40%; height: 30%; background: #FFF9C4; border-radius: 50%; }

    .game-instruction {
      position: absolute; bottom: 30px; width: 100%; text-align: center;
      color: white; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); z-index: 100;
    }
  `;

  const [targetBushId, setTargetBushId] = useState<number>(2);
  const [gameState, setGameState] = useState<'SEARCHING' | 'SHAKING' | 'PEEKABOO'>('SEARCHING');
  const [bearVisible, setBearVisible] = useState(false);
  const lastBearPosition = useRef({ x: 50, y: 50 });
  const audioCtx = useRef<AudioContext | null>(null);

  const bushes = [
    { id: 1, x: 25, y: 70 },
    { id: 2, x: 50, y: 65 },
    { id: 3, x: 75, y: 70 }
  ];

  // HÀM CHƠI ÂM THANH CẢI TIẾN
  const playSound = (freq: number, duration: number) => {
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioCtx.current;
      if (!ctx) return;

      // Khắc phục lỗi Autoplay của trình duyệt: Resume context nếu nó đang bị treo
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime; 
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.frequency.setValueAtTime(freq, now);
      
      // Hiệu ứng âm thanh pop/ú òa
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + duration);
    } catch(e) {
      console.error("Audio error:", e);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const loop = () => {
      setGameState('SEARCHING');
      setBearVisible(false);
      
      timer = setTimeout(() => {
        const nextId = [1, 2, 3].filter(id => id !== targetBushId)[Math.floor(Math.random() * 2)];
        setTargetBushId(nextId);
        setGameState('SHAKING');
        
        // Âm thanh xào xạc khi bụi cây rung
        playSound(150, 0.2);

        timer = setTimeout(() => {
          setGameState('PEEKABOO');
          setBearVisible(true);
          
          // Âm thanh "Ú ÒA" (Tần số cao hơn để tạo sự bất ngờ)
          playSound(600, 0.4);
          
          const pos = bushes.find(b => b.id === nextId);
          if (pos) lastBearPosition.current = { x: pos.x, y: pos.y };

          timer = setTimeout(loop, 4000); // Đợi lâu hơn một chút vì gấu hiện ra chậm
        }, 1500);
      }, 2000);
    };
    loop();
    return () => clearTimeout(timer);
  }, [targetBushId]);

  useEffect(() => {
    const record = setInterval(() => {
      const ai = latestAIResult.current?.features || {};
      const target = bushes.find(b => b.id === targetBushId);
      const feature: PeekabooFeature = {
        timestamp: Date.now(),
        gazeX: ai.gazeX || 0.5, gazeY: ai.gazeY || 0.5,
        targetX: target?.x || 50,
        targetY: bearVisible ? (target?.y || 50) - 15 : (target?.y || 50),
        targetSize: bearVisible ? 140 : 110,
        attentionLevel: ai.avgAttention || 0,
        smileIntensity: ai.avgSmile || 0,
        frownIntensity: ai.avgFrown || 0,
        isObjectVisible: bearVisible,
        anticipationScore: 0, 
        childVocalization: ai.micVolume || 0,
        audioStimulus: bearVisible ? 'pop' : null,
        affect: 'neutral',
        poseConfidence: ai.faceDetectionConfidence || 0,
        faceConfidence: ai.faceConfidence || 0
      };
      onFeatureCapture(feature);
    }, 100);
    return () => clearInterval(record);
  }, [bearVisible, targetBushId, latestAIResult, onFeatureCapture]);

  return (
    <div className="peekaboo-game-container">
      <style>{styles}</style>
      <div className="game-timer">⏱️ {timeElapsed}s / 120s</div>
      <div className="game-title">🐻 Ú Òa: {childName}</div>

      {bushes.map((bush) => (
        <div key={bush.id} className="bush-wrapper" style={{ left: `${bush.x}%`, top: `${bush.y}%` }}>
          
          {bush.id === targetBushId && (
            <div 
              className="bear-character"
              style={{
                /* Gấu trồi lên chậm nhờ transition 3s đã khai báo ở trên */
                transform: bearVisible ? 'translate(-50%, -100px)' : 'translate(-50%, 0px)',
                opacity: (gameState === 'SEARCHING' && !bearVisible) ? 0 : 1,
                animation: bearVisible ? 'bearJump 2s infinite' : 'none'
              }}
            >
              <div className="bear-head">
                <div className="ear left" /><div className="ear right" />
                <div className="eye left" /><div className="eye right" />
                <div className="muzzle" />
              </div>
            </div>
          )}

          <div 
            className="bush-container"
            style={{ animation: (bush.id === targetBushId && gameState === 'SHAKING') ? 'shake 0.4s infinite' : 'none' }}
          >
            <div className="bush-main" />
          </div>
        </div>
      ))}

      <div className="game-instruction">
        {bearVisible ? "Ú ÒA! Gấu đây rồi! ✨" : "Gấu đang trốn ở đâu nhỉ? 👀"}
      </div>
    </div>
  );
};

export default G1_4_Peekaboo;