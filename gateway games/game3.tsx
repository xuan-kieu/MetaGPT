import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SubGameProps, BehavioralFeature } from '../types';

// ========================================================
// GAME 3: VỖ TAY CÙNG BẠN – BẮT CHƯỚC (IMITATION)
// ========================================================
const G3VoTayCungBan: React.FC<SubGameProps> = ({
  latestAIResult,
  onFeatureCapture,
  onGameComplete,
  timeElapsed,
  childName,
  gameDuration = 120,
}) => {
  // ---------- CSS ----------
  const styles = `
    .game-container {
      width: 100%; height: 100%; position: relative;
      background: linear-gradient(135deg, #ffeaa7, #74b9ff);
      border-radius: 40px; overflow: hidden;
      display: flex; flex-direction: column; align-items: center;
      padding: 20px;
    }
    .character-box {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
    }
    .character {
      font-size: 200px; margin-bottom: 20px;
      transition: all 0.3s;
    }
    .character.clapping {
      animation: clap 0.5s ease-in-out;
    }
    @keyframes clap {
      0%,100% { transform: scale(1); }
      25%,75% { transform: scale(1.2) rotate(-5deg); }
    }
    .instruction {
      font-size: 2rem; background: rgba(255,255,255,0.9);
      padding: 15px 30px; border-radius: 50px;
      margin-bottom: 30px; font-weight: bold;
      box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    }
    .clap-button {
      width: 180px; height: 180px; border-radius: 50%;
      background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
      border: 8px solid white; cursor: pointer;
      font-size: 80px; display: flex; justify-content: center; align-items: center;
      box-shadow: 0 15px 40px rgba(0,0,0,0.4); margin-top: 20px;
    }
    .clap-button:active { transform: scale(0.9); }
    .clap-button.correct {
      animation: correctPulse 0.5s ease-out;
    }
    @keyframes correctPulse {
      0% { transform: scale(1); background: linear-gradient(135deg, #ff6b6b, #ee5a6f); }
      50% { transform: scale(1.2); background: linear-gradient(135deg, #00b894, #00cec9); }
      100% { transform: scale(1); background: linear-gradient(135deg, #ff6b6b, #ee5a6f); }
    }
    .timer {
      position: absolute; top: 20px; left: 20px;
      background: rgba(0,0,0,0.6); color: white; padding: 10px 20px;
      border-radius: 30px; font-size: 1.4rem;
    }
    .score {
      position: absolute; top: 20px; right: 20px;
      background: rgba(255,255,255,0.9); padding: 15px 25px; border-radius: 30px;
      font-size: 2rem; font-weight: bold; color: #00b894;
      box-shadow: 0 5px 20px rgba(0,0,0,0.2);
    }
  `;

  const GAME_DURATION = gameDuration;
  const ACTIONS = [
    { name: 'vỗ tay', emoji: '👏', animation: 'clapping' },
    { name: 'vẫy tay', emoji: '👋', animation: 'waving' },
  ];

  // ---------- STATE ----------
  const [currentAction, setCurrentAction] = useState(ACTIONS[0]);
  const [score, setScore] = useState<number>(0);
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [lastActionTime, setLastActionTime] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('🐻 Làm theo bạn nhé!');
  const [buttonCorrect, setButtonCorrect] = useState<boolean>(false);
  const gameCompletedRef = useRef<boolean>(false);
  const nextActionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ---------- PHÁT HIỆN HAND POSE (GIẢ LẬP NẾU CHƯA CÓ MEDIAPIPE) ----------
  const detectClap = useCallback((): boolean => {
    const aiData = latestAIResult.current?.features;
    if (!aiData) return false;

    // Nếu có hand landmarks, kiểm tra khoảng cách giữa hai tay
    if (aiData.handLandmarks && Array.isArray(aiData.handLandmarks) && aiData.handLandmarks.length >= 2) {
      const leftHand = aiData.handLandmarks[0]?.[8]; // ngón trỏ
      const rightHand = aiData.handLandmarks[1]?.[8];
      if (leftHand && rightHand) {
        const distance = Math.hypot(leftHand.x - rightHand.x, leftHand.y - rightHand.y);
        return distance < 0.1; // gần nhau
      }
    }
    // Fallback: click vào nút (dùng cho debug)
    return false;
  }, [latestAIResult]);

  // ---------- HIỆU ỨNG NHÂN VẬT ----------
  const performAction = useCallback(() => {
    const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    setCurrentAction(action);
    setIsWaiting(true);
    setLastActionTime(Date.now());
    setMessage(`🐻 Làm động tác: ${action.name}!`);

    // Phát âm thanh hướng dẫn
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(`Bé hãy ${action.name} nào!`);
      msg.lang = 'vi-VN';
      msg.rate = 0.9;
      window.speechSynthesis.speak(msg);
    }

    // Tự động hết hạn nếu không phản hồi
    responseTimeoutRef.current = setTimeout(() => {
      if (isWaiting && !gameCompletedRef.current) {
        setMessage('⏳ Chưa kịp, thử lại!');
        setIsWaiting(false);
        // Lên lịch động tác tiếp theo
        nextActionTimeoutRef.current = setTimeout(performAction, 2000);
      }
    }, 5000);
  }, [ACTIONS, isWaiting]);

  // ---------- XỬ LÝ KHI TRẺ BẮT CHƯỚC ----------
  const handleImitation = useCallback(() => {
    if (!isWaiting || gameCompletedRef.current) return;

    const reactionTime = Date.now() - (lastActionTime || Date.now());
    setLatency(reactionTime);
    setScore(prev => prev + 1);
    setButtonCorrect(true);
    setTimeout(() => setButtonCorrect(false), 500);

    // Rung
    if (navigator.vibrate) navigator.vibrate(50);

    // Phát âm thanh khen
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance('Giỏi quá!');
      msg.lang = 'vi-VN';
      window.speechSynthesis.speak(msg);
    }

    setMessage(`🎉 Đúng rồi! +1 điểm (${reactionTime}ms)`);

    // Ghi nhận feature
    onFeatureCapture({
      timestamp: Date.now(),
      gazeX: latestAIResult.current?.features?.gazeX ?? 0.5,
      gazeY: latestAIResult.current?.features?.gazeY ?? 0.5,
      targetX: 50,
      targetY: 50,
      targetSize: 200,
      audioStimulus: currentAction.name,
      isLookingAtTarget: true,
      attentionLevel: latestAIResult.current?.features?.avgAttention ?? 0.5,
      smileIntensity: 0.8,
      frownIntensity: 0,
      affect: 'happy',
      poseConfidence: latestAIResult.current?.features?.faceConfidence ?? 0.8,
      faceConfidence: latestAIResult.current?.features?.faceConfidence ?? 0.8,
      imitationLatency: reactionTime,
      imitationSuccess: true,
      actionName: currentAction.name,
    } as BehavioralFeature);

    setIsWaiting(false);
    if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);

    // Động tác tiếp theo
    nextActionTimeoutRef.current = setTimeout(performAction, 2000);
  }, [isWaiting, lastActionTime, currentAction, onFeatureCapture, latestAIResult, performAction]);

  // ---------- KIỂM TRA HAND POSE QUA AI ----------
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isWaiting || gameCompletedRef.current) return;

      const isClapping = detectClap();
      if (isClapping) {
        handleImitation();
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isWaiting, detectClap, handleImitation]);

  // ---------- KHỞI TẠO GAME ----------
  useEffect(() => {
    const timer = setTimeout(performAction, 2000);
    return () => {
      clearTimeout(timer);
      if (nextActionTimeoutRef.current) clearTimeout(nextActionTimeoutRef.current);
      if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
      window.speechSynthesis.cancel();
    };
  }, [performAction]);

  // ---------- KẾT THÚC GAME: GỬI KẾT QUẢ GATEWAY ----------
  useEffect(() => {
    if (timeElapsed >= GAME_DURATION && !gameCompletedRef.current) {
      gameCompletedRef.current = true;
      // Thành công nếu trẻ bắt chước được ít nhất 2 lần
      const success = score >= 2;
      onGameComplete?.(success);
    }
  }, [timeElapsed, GAME_DURATION, score, onGameComplete]);

  return (
    <div className="game-container">
      <style>{styles}</style>

      <div className="timer">⏱️ {timeElapsed}s / {GAME_DURATION}s</div>
      <div className="score">⭐ {score}</div>

      <div className="character-box">
        <div className={`character ${isWaiting ? currentAction.animation : ''}`}>
          {currentAction.emoji}
        </div>
        <div className="instruction">{message}</div>
        <div
          className={`clap-button ${buttonCorrect ? 'correct' : ''}`}
          onClick={handleImitation}
        >
          👏
        </div>
      </div>
    </div>
  );
};

export default G3VoTayCungBan;