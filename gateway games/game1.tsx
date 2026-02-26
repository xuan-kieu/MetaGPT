import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SubGameProps, BehavioralFeature } from '../types';

const G1BongBongVuiNhon: React.FC<SubGameProps> = ({
  latestAIResult,
  onFeatureCapture,
  onGameComplete,
  timeElapsed,
  childName,
  gameDuration = 120,
}) => {
  // --- HẰNG SỐ ---
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 450;
  const RECORD_INTERVAL = 200; // Gửi dữ liệu AI mỗi 200ms (5 lần/giây) là đủ chuẩn

  // --- REFS ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const specialBubbleRef = useRef<any>(null);
  const gameCompletedRef = useRef<boolean>(false);
  const lastRecordTimeRef = useRef<number>(0); // Theo dõi thời gian gửi dữ liệu

  // --- STATE ---
  const [bubbles, setBubbles] = useState<any[]>([]);
  const [specialBubbleActive, setSpecialBubbleActive] = useState<boolean>(false);
  const [gazeOnSpecial, setGazeOnSpecial] = useState<boolean>(false);
  const [lookedAtParent, setLookedAtParent] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('✨ Tìm bong bóng đặc biệt!');

  // --- LOGIC TẠO BONG BÓNG ---
  const createBubble = useCallback((isSpecial = false) => ({
    x: Math.random() * (CANVAS_WIDTH - 80) + 40,
    y: Math.random() * (CANVAS_HEIGHT - 80) + 40,
    r: isSpecial ? 50 : Math.random() * 25 + 20,
    speed: Math.random() * 1.5 + 0.8,
    color: isSpecial ? 'hsl(50, 100%, 60%)' : `hsl(${Math.random() * 360}, 80%, 70%)`,
    isSpecial,
  }), []);

  // Khởi tạo game
  useEffect(() => {
    const initialBubbles = Array.from({ length: 10 }, () => createBubble(false));
    setBubbles(initialBubbles);
    
    const timer = setTimeout(() => {
      if (!gameCompletedRef.current) {
        const special = createBubble(true);
        setBubbles(prev => [...prev, special]);
        specialBubbleRef.current = special;
        setSpecialBubbleActive(true);
        setMessage('🎈 Bong bóng đặc biệt! Nhìn và chia sẻ với mẹ!');
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [createBubble]);

  // --- VÒNG LẶP CHÍNH (VẼ & AI CHUNG MỘT LUỒNG) ---
  const updateGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Di chuyển & Vẽ
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    setBubbles(prev => prev.map(b => {
      let newY = b.y - b.speed;
      if (newY + b.r < 0) {
        newY = CANVAS_HEIGHT + b.r;
        return { ...b, y: newY, x: Math.random() * (CANVAS_WIDTH - 2 * b.r) + b.r };
      }
      
      // Vẽ bong bóng
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();
      if (b.isSpecial) {
        ctx.font = `${b.r * 0.6}px Arial`;
        ctx.fillText('😊', b.x - b.r * 0.35, b.y + b.r * 0.2);
        specialBubbleRef.current = { ...b, y: newY }; // Cập nhật tọa độ thực tế cho AI
      }
      return { ...b, y: newY };
    }));

    // 2. Kiểm tra AI theo nhịp RECORD_INTERVAL
    const now = Date.now();
    if (now - lastRecordTimeRef.current > RECORD_INTERVAL) {
      const aiData = latestAIResult.current?.features;
      const special = specialBubbleRef.current;

      if (aiData && special && !gameCompletedRef.current) {
        const gazeX = aiData.gazeX ?? 0.5;
        const gazeY = aiData.gazeY ?? 0.5;
        const targetX = special.x / CANVAS_WIDTH;
        const targetY = special.y / CANVAS_HEIGHT;

        // Phát hiện nhìn bong bóng
        const isLookingAtSpecial = Math.abs(gazeX - targetX) < 0.15 && Math.abs(gazeY - targetY) < 0.15;
        if (isLookingAtSpecial && !gazeOnSpecial) setGazeOnSpecial(true);

        // Phát hiện nhìn mẹ (Góc dưới phải)
        const isLookingAtParentNow = gazeX > 0.7 && gazeY > 0.7;
        if (gazeOnSpecial && isLookingAtParentNow && !lookedAtParent) {
          setLookedAtParent(true);
          setMessage('🎉 Tuyệt vời! Bé đã chia sẻ niềm vui!');
          gameCompletedRef.current = true;
          setTimeout(() => onGameComplete?.(true), 1500);
        }

        // Gửi dữ liệu về GameEngine
        onFeatureCapture({
          timestamp: now,
          gazeX, gazeY,
          targetX: targetX * 100, targetY: targetY * 100,
          isLookingAtTarget: isLookingAtSpecial,
          attentionLevel: aiData.avgAttention ?? 0.5,
          smileIntensity: aiData.avgSmile ?? 0,
          jointAttention: (gazeOnSpecial && lookedAtParent) ? 1 : 0,
        } as any);
      }
      lastRecordTimeRef.current = now;
    }

    animationRef.current = requestAnimationFrame(updateGame);
  }, [latestAIResult, onFeatureCapture, gazeOnSpecial, lookedAtParent, onGameComplete]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(updateGame);
    return () => cancelAnimationFrame(animationRef.current);
  }, [updateGame]);


  return (
    <div className="game-container">
      <style>{`
        .game-container { width: 100%; height: 100%; position: relative; background: #6ec3e0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .canvas-wrapper { border: 8px solid #b2f0e5; border-radius: 30px; background: #a3e0fd; overflow: hidden; }
        .timer { position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.6); color: white; padding: 8px 15px; border-radius: 20px; }
        .stats-panel { margin-top: 15px; background: white; padding: 10px 30px; border-radius: 30px; font-weight: bold; font-size: 1.2rem; }
        .parent-pip { position: absolute; bottom: 20px; right: 20px; width: 100px; height: 80px; background: #2d5a27; border: 3px solid white; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; }
      `}</style>
      
      <div className="timer">⏱️ {timeElapsed}s / {gameDuration}s</div>
      <div className="parent-pip">👩 Mẹ</div>

      <div className="canvas-wrapper">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
      </div>

      <div className="stats-panel">
        <span style={{ color: lookedAtParent ? '#10b981' : '#333' }}>{message}</span>
      </div>
    </div>
  );
};

export default G1BongBongVuiNhon;