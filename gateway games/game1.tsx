import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SubGameProps, BehavioralFeature } from '../types';

// ========================================================
// GAME 1: BONG BÓNG VUI NHỘN – CHÚ Ý CHIA SẺ (JOINT ATTENTION)
// ========================================================
const G1BongBongVuiNhon: React.FC<SubGameProps> = ({
  latestAIResult,
  onFeatureCapture,
  onGameComplete,
  timeElapsed,
  childName,
  gameDuration = 120,
}) => {
  // ---------- CSS (giữ nguyên hoặc cải tiến) ----------
  const styles = `
    .game-container {
      width: 100%; height: 100%; position: relative;
      background: radial-gradient(circle at 50% 30%, #a3e0fd, #6ec3e0);
      border-radius: 40px; overflow: hidden;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 20px; box-shadow: inset 0 -8px 0 #3f8f9b;
    }
    .canvas-wrapper {
      position: relative; width: 100%; max-width: 800px; aspect-ratio: 4/3;
      border-radius: 40px; border: 10px solid #b2f0e5;
      box-shadow: 0 15px 0 #6fa89f; background: radial-gradient(circle at 50% 30%, #a3e0fd, #5fa7c7);
      margin-bottom: 20px; overflow: hidden; cursor: pointer;
    }
    canvas { display: block; width: 100%; height: 100%; object-fit: cover; }
    .stats-panel {
      background: #fffbd0; padding: 15px 30px; border-radius: 60px;
      border: 6px solid #ffb085; box-shadow: 0 8px 0 #d48c5b;
      display: flex; align-items: center; gap: 30px; flex-wrap: wrap;
      justify-content: center; font-size: 1.8rem; font-weight: bold;
      color: #2d4055; margin-top: 10px;
    }
    .special-bubble-msg {
      background: #f3d4ff; padding: 8px 25px; border-radius: 40px;
      border: 4px dashed #9b5de5; color: #3b1e4b;
      transition: all 0.3s;
    }
    .timer {
      position: absolute; top: 20px; right: 20px;
      background: rgba(0,0,0,0.6); color: white; padding: 10px 20px;
      border-radius: 30px; font-size: 1.4rem; z-index: 10;
    }
    .parent-pip {
      position: absolute; bottom: 20px; right: 20px;
      width: 120px; height: 90px; border: 4px solid white; border-radius: 12px;
      background: #333; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.5);
      z-index: 20;
    }
    .parent-pip video {
      width: 100%; height: 100%; object-fit: cover;
    }
  `;

  // ---------- HẰNG SỐ CANVAS ----------
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 450;
  const GAME_DURATION = gameDuration;

  // ---------- STATE & REF ----------
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const parentVideoRef = useRef<HTMLVideoElement>(null);
  const specialBubbleRef = useRef<any>(null);
  const gameCompletedRef = useRef<boolean>(false);

  // Điểm số và chỉ số hành vi
  const [score, setScore] = useState<number>(0);
  const [bubbles, setBubbles] = useState<any[]>([]);
  const [specialBubbleActive, setSpecialBubbleActive] = useState<boolean>(false);
  const [specialBubbleTime, setSpecialBubbleTime] = useState<number>(0);
  const [gazeOnSpecial, setGazeOnSpecial] = useState<boolean>(false);
  const [lookedAtParent, setLookedAtParent] = useState<boolean>(false);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('✨ Tìm bong bóng đặc biệt!');

  // ---------- TẠO BONG BÓNG ----------
  const createBubble = useCallback((isSpecial = false) => {
    const base = {
      x: Math.random() * (CANVAS_WIDTH - 80) + 40,
      y: Math.random() * (CANVAS_HEIGHT - 80) + 40,
      r: isSpecial ? 50 : Math.random() * 25 + 20,
      speed: Math.random() * 1.5 + 0.8,
      color: isSpecial ? 'hsl(50, 100%, 60%)' : `hsl(${Math.random() * 360}, 80%, 70%)`,
      isSpecial,
      emoji: isSpecial ? '😊' : undefined,
    };
    return base;
  }, []);

  // Khởi tạo game
  useEffect(() => {
    const initialBubbles = Array.from({ length: 12 }, () => createBubble(false));
    setBubbles(initialBubbles);
    setScore(0);
    setSpecialBubbleActive(false);
    setGazeOnSpecial(false);
    setLookedAtParent(false);
    setReactionTime(null);
    gameCompletedRef.current = false;

    // Xuất hiện bong bóng đặc biệt sau 3 giây
    const timer = setTimeout(() => {
      if (!gameCompletedRef.current) {
        const special = createBubble(true);
        setBubbles(prev => [...prev, special]);
        specialBubbleRef.current = special;
        setSpecialBubbleActive(true);
        setSpecialBubbleTime(Date.now());
        setMessage('🎈 Bong bóng đặc biệt! Nhìn và chia sẻ!');
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [createBubble]);

  // ---------- VẼ CANVAS ----------
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    bubbles.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.shadowColor = 'rgba(255,255,255,0.8)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = b.color;
      ctx.fill();

      if (b.isSpecial) {
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#ffd700';
        ctx.fill();
        // Vẽ mặt cười
        ctx.font = `${b.r * 0.6}px Arial`;
        ctx.fillStyle = 'black';
        ctx.fillText('😊', b.x - b.r * 0.3, b.y - b.r * 0.1);
      }

      ctx.shadowBlur = 0;
      // Hiệu ứng sáng
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.15, b.y - b.r * 0.15, b.r * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fill();
    });
  }, [bubbles]);

  // Di chuyển bong bóng
  const moveBubbles = useCallback(() => {
    setBubbles(prev => prev.map(b => {
      let newY = b.y - b.speed;
      if (newY + b.r < 0) {
        newY = CANVAS_HEIGHT + b.r + Math.random() * 30;
        return {
          ...b,
          y: newY,
          x: Math.random() * (CANVAS_WIDTH - 2 * b.r) + b.r,
          speed: Math.random() * 1.5 + 0.8,
        };
      }
      return { ...b, y: newY };
    }));
  }, []);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      moveBubbles();
      drawCanvas();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [moveBubbles, drawCanvas]);

  // ---------- PHÂN TÍCH AI – PHÁT HIỆN ÁNH MẮT VÀ CHIA SẺ ----------
  useEffect(() => {
    const interval = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      if (!aiData || !specialBubbleActive || gameCompletedRef.current) return;

      // Lấy tọa độ gaze chuẩn hóa (0-1)
      const gazeX = aiData.gazeX ?? 0.5;
      const gazeY = aiData.gazeY ?? 0.5;

      // Vị trí bong bóng đặc biệt trên canvas (chuyển sang tọa độ chuẩn hóa)
      const special = specialBubbleRef.current;
      if (!special) return;

      const targetX = special.x / CANVAS_WIDTH;
      const targetY = special.y / CANVAS_HEIGHT;
      const threshold = (special.r * 1.5) / CANVAS_WIDTH; // tolerance

      // Kiểm tra trẻ có nhìn vào bong bóng đặc biệt không
      const isLookingAtSpecial =
        Math.abs(gazeX - targetX) < threshold &&
        Math.abs(gazeY - targetY) < threshold;

      if (isLookingAtSpecial && !gazeOnSpecial) {
        setGazeOnSpecial(true);
        setReactionTime(Date.now() - specialBubbleTime);
        setMessage('👀 Bé nhìn thấy bong bóng! Hãy chia sẻ với mẹ!');
      }

      // Giả lập phụ huynh: nếu có camera phụ, nhưng ở đây dùng gaze direction để mô phỏng
      // Quay lại nhìn phụ huynh: khi gaze ở góc dưới bên phải (khu vực PIP)
      const isLookingAtParent = gazeX > 0.7 && gazeY > 0.7;
      if (gazeOnSpecial && isLookingAtParent && !lookedAtParent) {
        setLookedAtParent(true);
        setMessage('🎉 Tuyệt vời! Bé đã chia sẻ!');
        
        // Gọi onGameComplete thành công
        if (onGameComplete && !gameCompletedRef.current) {
          gameCompletedRef.current = true;
          onGameComplete(true);
        }
      }

      // Ghi nhận feature
      onFeatureCapture({
        timestamp: Date.now(),
        gazeX,
        gazeY,
        targetX: targetX * 100,
        targetY: targetY * 100,
        targetSize: special.r,
        audioStimulus: 'bong bóng đặc biệt',
        isLookingAtTarget: isLookingAtSpecial,
        attentionLevel: aiData.avgAttention ?? 0.5,
        smileIntensity: aiData.avgSmile ?? 0.2,
        frownIntensity: 0,
        affect: isLookingAtSpecial ? 'happy' : 'neutral',
        poseConfidence: aiData.faceConfidence ?? 0.8,
        faceConfidence: aiData.faceConfidence ?? 0.8,
        // Các chỉ số riêng
        jointAttention: isLookingAtSpecial && lookedAtParent ? 1 : 0,
        gazeShiftTime: reactionTime,
        lookedAtParent,
        specialBubbleDetected: gazeOnSpecial,
      } as BehavioralFeature);
    }, 100);

    return () => clearInterval(interval);
  }, [latestAIResult, specialBubbleActive, gazeOnSpecial, lookedAtParent, reactionTime, onFeatureCapture, onGameComplete]);

  // ---------- HẾT GIỜ: NẾU KHÔNG THÀNH CÔNG, GỌI onGameComplete(false) ----------
  useEffect(() => {
    if (timeElapsed >= GAME_DURATION && !gameCompletedRef.current) {
      gameCompletedRef.current = true;
      onGameComplete?.(false);
    }
  }, [timeElapsed, GAME_DURATION, onGameComplete]);

  // ---------- RENDER ----------
  return (
    <div className="game-container">
      <style>{styles}</style>

      <div className="timer">⏱️ {timeElapsed}s / {GAME_DURATION}s</div>

      {/* Camera phụ huynh giả lập (PIP) */}
      <div className="parent-pip">
        <video ref={parentVideoRef} autoPlay muted playsInline style={{ display: 'none' }} />
        <div style={{ width: '100%', height: '100%', background: '#2d5a27', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px' }}>
          👩 Mẹ
        </div>
      </div>

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
        />
      </div>

      <div className="stats-panel">
        <span style={{ fontSize: '2rem' }}>🎈 {bubbles.length}</span>
        <span className="special-bubble-msg">{message}</span>
      </div>
    </div>
  );
};

export default G1BongBongVuiNhon;