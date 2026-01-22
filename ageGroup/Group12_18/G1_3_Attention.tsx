import React, { useState, useEffect, useRef } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G1_3_Attention: React.FC<SubGameProps> = ({ latestAIResult, onFeatureCapture, timeElapsed, childName }) => {
  // --- CSS NỘI BỘ ---
  const styles = `
    .attention-game {
      width: 100%;
      height: 100%;
      background: linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%);
      position: relative;
      overflow: hidden;
      border-radius: 20px;
      box-shadow: inset 0 0 20px rgba(0,0,0,0.05);
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

    .animal-emoji {
      position: absolute;
      font-size: 4rem;
      transform: translate(-50%, -50%);
      animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      cursor: pointer;
      filter: drop-shadow(0 4px 4px rgba(0,0,0,0.1));
      transition: top 0.5s, left 0.5s;
    }

    @keyframes popIn {
      from { transform: translate(-50%, -50%) scale(0); opacity: 0; }
      to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }

    .surprise-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
      animation: fadeIn 0.3s ease-out;
      backdrop-filter: blur(5px);
    }

    .surprise-content {
      text-align: center;
      animation: bounceIn 1s infinite;
    }

    .surprise-content h1 {
      font-size: 2.5rem;
      color: #ea580c; /* Orange-600 */
      margin-bottom: 10px;
    }
    
    .surprise-content span {
      color: #db2777; /* Pink-600 */
      font-weight: 900;
      margin: 0 10px;
      text-decoration: underline decoration-wavy;
    }

    .surprise-content p {
      font-size: 1.5rem;
      color: #4b5563;
    }

    .game-instruction {
      position: absolute;
      bottom: 20px;
      width: 100%;
      text-align: center;
      color: #166534;
      font-size: 1.2rem;
      font-weight: bold;
      opacity: 0.8;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes bounceIn {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  `;

  // --- LOGIC GAME ---
  const [animals, setAnimals] = useState<{id: number, emoji: string, x: number, y: number}[]>([]);
  const [showSurprise, setShowSurprise] = useState(false);
  
  const animalEmojis = ['🐶', '🐱', '🐰', '🐻', '🦁', '🐼', '🐨', '🦊', '🐸', '🌟', '🌈'];
  
  const intervalRefs = useRef<NodeJS.Timeout[]>([]);
  const bgMusicRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  
  const GAME_DURATION = 120;

  // 1. TEXT-TO-SPEECH (Gọi tên bé)
  const speakChildName = (name: string) => {
    if ('speechSynthesis' in window) {
      // Hủy các câu nói trước đó để tránh chồng chéo
      window.speechSynthesis.cancel();

      const text = `Bé ${name} ơi! Nhìn này!`;
      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.lang = 'vi-VN'; // Giọng tiếng Việt
      utterance.rate = 1.1; // Tốc độ hơi nhanh một chút cho vui vẻ
      utterance.pitch = 1.2; // Giọng cao hơn một chút (giống giọng trẻ con/hoạt hình)
      utterance.volume = 1;

      window.speechSynthesis.speak(utterance);
    }
  };

  // 2. BACKGROUND MUSIC GENERATOR (Nhạc nền nhẹ nhàng)
  const startBackgroundMusic = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      bgMusicRef.current = ctx;

      // Tạo một Oscillator để giả lập tiếng nhạc nền (dạng chuông gió nhẹ)
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      // Tần số thấp, êm dịu
      osc.frequency.setValueAtTime(200, ctx.currentTime); 
      
      // Hiệu ứng LFO (Low Frequency Oscillator) để làm âm thanh dao động nhẹ như sóng
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.5; // Dao động chậm (0.5Hz)
      
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 50; // Biên độ dao động tần số
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      // Volume rất nhỏ để làm nền
      gainNode.gain.setValueAtTime(0.02, ctx.currentTime);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      oscillatorRef.current = osc;

    } catch (e) {
      console.error("Không thể phát nhạc nền:", e);
    }
  };

  const stopBackgroundMusic = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }
    if (bgMusicRef.current) {
      bgMusicRef.current.close();
    }
  };

  // 3. GAME LOOP
  useEffect(() => {
    // Bật nhạc nền khi game bắt đầu
    startBackgroundMusic();

    // Spawn Animals (Xuất hiện thú)
    const spawnInterval = setInterval(() => {
      setAnimals(prev => {
        // Giữ tối đa 7 con trên màn hình
        const newAnimals = prev.length > 6 ? prev.slice(1) : prev;
        return [...newAnimals, {
          id: Math.random(),
          emoji: animalEmojis[Math.floor(Math.random() * animalEmojis.length)],
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10
        }];
      });
    }, 1500);
    intervalRefs.current.push(spawnInterval);

    // Sự kiện bất ngờ (Surprise) + Gọi tên bé
    const surpriseInterval = setInterval(() => {
      setShowSurprise(true);
      
      // Gọi tên bé!
      speakChildName(childName || "ơi");

      setTimeout(() => {
        setShowSurprise(false);
      }, 4000); // Hiện lâu hơn chút để bé kịp nhìn
    }, 15000); // Mỗi 15 giây
    intervalRefs.current.push(surpriseInterval);

    return () => {
      intervalRefs.current.forEach(interval => clearInterval(interval));
      intervalRefs.current = [];
      stopBackgroundMusic(); // Tắt nhạc khi thoát
      window.speechSynthesis.cancel(); // Tắt giọng nói
    };
  }, [childName]);

  // 4. DATA RECORDING (Ghi hình)
  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      
      // Logic xác định mục tiêu nhìn
      const targetX = showSurprise ? 50 : (animals.length > 0 ? animals[animals.length-1].x : 50);
      const targetY = showSurprise ? 50 : (animals.length > 0 ? animals[animals.length-1].y : 50);
      
      const feature: BehavioralFeature = {
        timestamp: Date.now(),
        gazeX: aiData?.gazeX ?? 0.5,
        gazeY: aiData?.gazeY ?? 0.5,
        targetX,
        targetY,
        targetSize: showSurprise ? 300 : 100, // Surprise to hơn
        
        // Cập nhật Audio Stimulus: Đang có nhạc nền hoặc giọng nói
        audioStimulus: showSurprise ? "voice_call_name" : "background_music_gentle",
        
        isLookingAtTarget: false, // Sẽ tính toán sau
        attentionLevel: aiData?.avgAttention ?? 0.5,
        smileIntensity: aiData?.avgSmile ?? 0,
        frownIntensity: 0,
        affect: 'neutral',
        poseConfidence: aiData?.faceDetectionConfidence ?? 0,
        faceConfidence: aiData?.faceDetectionConfidence ?? 0
      };
      onFeatureCapture(feature);
    }, 100);

    return () => clearInterval(recordLoop);
  }, [showSurprise, animals, onFeatureCapture, latestAIResult]);

  return (
    <div className="game-container attention-game">
      <style>{styles}</style>
      
      <div className="game-timer">
        ⏱️ {timeElapsed}s / {GAME_DURATION}s
      </div>
      
      {/* Render Animals */}
      {animals.map(a => (
        <div 
          key={a.id} 
          className="animal-emoji"
          style={{ 
            left: `${a.x}%`, 
            top: `${a.y}%`
          }}
          // Hiệu ứng nhẹ khi hover chuột (dành cho desktop testing)
          onMouseEnter={(e) => {
             e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.2)";
          }}
          onMouseLeave={(e) => {
             e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)";
          }}
        >
          {a.emoji}
        </div>
      ))}
      
      {/* Surprise Overlay */}
      {showSurprise && (
        <div className="surprise-overlay">
          <div className="surprise-content">
            <h1>
              🎉 
              <span>
                {childName || "Bé"} ơi!
              </span>
              👋
            </h1>
            <p>
              Nhìn này! Có gì đặc biệt nè! ✨
            </p>
          </div>
        </div>
      )}
      
      <div className="game-instruction">
        Theo dõi các bạn thú và lắng nghe nhé! 🎧
      </div>
    </div>
  );
};

export default G1_3_Attention;