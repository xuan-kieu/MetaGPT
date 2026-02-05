import React, { useState, useEffect, useRef } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

// Mở rộng interface để ghi nhận Head Pose
interface ExtendedAttentionFeature extends BehavioralFeature {
  headYaw: number;   // Quay trái/phải
  headPitch: number; // Ngẩng lên/cúi xuống
  isTrainActive: boolean;
  soundDirection: 'left' | 'right' | 'center';
}

const G1_3_Attention: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed, 
  childName 
}) => {
  // --- CSS NỘI BỘ ---
  const styles = `
    .attention-game {
      width: 100%;
      height: 100%;
      background: linear-gradient(180deg, #38bdf8 0%, #bae6fd 100%); /* Sky Blue */
      position: relative;
      overflow: hidden;
      border-radius: 20px;
    }

    .cloud {
      position: absolute;
      background: white;
      border-radius: 50px;
      opacity: 0.8;
      animation: drift linear infinite;
    }

    @keyframes drift {
      from { transform: translateX(-150px); }
      to { transform: translateX(calc(100vw + 150px)); }
    }

    .train-container {
      position: absolute;
      bottom: 15%;
      left: -100%;
      font-size: 5rem;
      white-space: nowrap;
      transition: left 4s linear;
      z-index: 20;
      filter: drop-shadow(0 10px 10px rgba(0,0,0,0.2));
    }

    .train-active {
      left: 120%;
    }

    .animal-emoji {
      position: absolute;
      font-size: 3.5rem;
      transform: translate(-50%, -50%);
      z-index: 10;
    }

    .direction-indicator {
      position: absolute;
      top: 50%;
      font-size: 3rem;
      opacity: 0;
      transition: opacity 0.5s;
    }
  `;

  // --- LOGIC & STATE ---
  const [animals, setAnimals] = useState<{id: number, emoji: string, x: number, y: number}[]>([]);
  const [showTrain, setShowTrain] = useState(false);
  const [soundDir, setSoundDir] = useState<'left' | 'right' | 'center'>('center');
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const pannerRef = useRef<StereoPannerNode | null>(null);
  const lastReactionTime = useRef<number>(Date.now());
  const initialHeadYaw = useRef<number | null>(null);

  const GAME_DURATION = 120;

  // 1. SOUND LOGIC: ÂM THANH ĐỊNH HƯỚNG
  const playStereoVoice = (text: string, panValue: number) => {
    if (!('speechSynthesis' in window)) return;
    
    // Cập nhật hướng âm thanh để UI biết
    setSoundDir(panValue < 0 ? 'left' : 'right');
    
    // Lưu Head Pose hiện tại để so sánh phản ứng
    const aiData = latestAIResult.current?.features;
    if (aiData) lastReactionTime.current = Date.now();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.0;
    
    // Lưu ý: speechSynthesis mặc định không hỗ trợ Stereo Panning trực tiếp, 
    // nhưng ta đánh dấu dữ liệu soundDirection để AI phân tích phản ứng của trẻ.
    window.speechSynthesis.speak(utterance);
  };

  // 2. SOUND LOGIC: TIẾNG TÀU HỎA (MẠNH)
  const playTrainSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 3);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 4);
    } catch (e) { console.error(e); }
  };

  // 3. CHU KỲ TRÒ CHƠI
  useEffect(() => {
    // Spawn chim bay/thú
    const interval = setInterval(() => {
      setAnimals(prev => [...prev.slice(-3), {
        id: Math.random(),
        emoji: ['☁️', '🐦', '🎈', '🦅'][Math.floor(Math.random() * 4)],
        x: Math.random() * 80 + 10,
        y: Math.random() * 40 + 10
      }]);
    }, 3000);

    // Kích hoạt chuỗi sự kiện: Gọi tên -> Check phản ứng -> Tàu hỏa
    const eventSequence = setInterval(() => {
      const side = Math.random() > 0.5 ? 1 : -1; // 1: Phải, -1: Trái
      playStereoVoice(`Bé ${childName || ''} ơi, nhìn bên ${side > 0 ? 'phải' : 'trái'} kìa!`, side);

      // Sau 3 giây, kiểm tra phản ứng head pose
      setTimeout(() => {
        const currentYaw = latestAIResult.current?.features?.headYaw ?? 0;
        const headMoved = Math.abs(currentYaw) > 15; // Ngưỡng quay đầu 15 độ

        if (!headMoved) {
          // Trẻ không phản ứng -> Kích thích mạnh bằng tàu hỏa
          setShowTrain(true);
          playTrainSound();
          setTimeout(() => setShowTrain(false), 5000);
        }
      }, 3000);

    }, 15000);

    return () => {
      clearInterval(interval);
      clearInterval(eventSequence);
      window.speechSynthesis.cancel();
    };
  }, [childName]);

  // 4. DATA CAPTURE
  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      
      const feature: ExtendedAttentionFeature = {
        timestamp: Date.now(),
        gazeX: aiData?.gazeX ?? 0.5,
        gazeY: aiData?.gazeY ?? 0.5,
        targetX: showTrain ? 50 : 50,
        targetY: showTrain ? 80 : 30,
        targetSize: showTrain ? 400 : 100,
        audioStimulus: showTrain ? "train_loud_horn" : (soundDir !== 'center' ? "directional_voice" : "ambient"),
        
        // Dữ liệu Head Pose bổ sung
        headYaw: aiData?.headYaw ?? 0,
        headPitch: aiData?.headPitch ?? 0,
        isTrainActive: showTrain,
        soundDirection: soundDir,
        
        isLookingAtTarget: false,
        attentionLevel: aiData?.avgAttention ?? 0.5,
        smileIntensity: aiData?.avgSmile ?? 0,
        frownIntensity: aiData?.avgFrown ?? 0,
        affect: 'neutral',
        poseConfidence: aiData?.faceDetectionConfidence ?? 0,
        faceConfidence: aiData?.faceDetectionConfidence ?? 0
      };
      onFeatureCapture(feature);
    }, 100);

    return () => clearInterval(recordLoop);
  }, [showTrain, soundDir, onFeatureCapture, latestAIResult]);

  return (
    <div className="attention-game">
      <style>{styles}</style>
      
      <div className="game-timer">
        ⏱️ {timeElapsed}s / {GAME_DURATION}s
      </div>

      {/* Trang trí mây */}
      <div className="cloud" style={{ top: '10%', width: '100px', height: '40px', animationDuration: '20s' }} />
      <div className="cloud" style={{ top: '25%', width: '150px', height: '60px', animationDuration: '35s', animationDelay: '-10s' }} />

      {/* Render Animals/Objects */}
      {animals.map(a => (
        <div key={a.id} className="animal-emoji" style={{ left: `${a.x}%`, top: `${a.y}%` }}>
          {a.emoji}
        </div>
      ))}

      {/* Tàu hỏa chạy ngang */}
      <div className={`train-container ${showTrain ? 'train-active' : ''}`}>
        🚂 Gầm gừ... Tu tu xình xịch! 🚃🚃🚃
      </div>

      {/* Chỉ báo hướng âm thanh (Dành cho việc debug/quan sát của phụ huynh) */}
      <div className="direction-indicator" style={{ left: '5%', opacity: soundDir === 'left' ? 1 : 0 }}>🔈👈</div>
      <div className="direction-indicator" style={{ right: '5%', opacity: soundDir === 'right' ? 1 : 0 }}>👉🔈</div>

      <div className="game-instruction" style={{ position: 'absolute', bottom: '5%', width: '100%', textAlign: 'center', color: '#0369a1', fontWeight: 'bold' }}>
        {showTrain ? "Ối! Tàu hỏa đến kìa! 🚂" : "Lắng nghe xem tiếng gọi ở đâu nhé? 👂"}
      </div>
    </div>
  );
};

export default G1_3_Attention;