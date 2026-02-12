import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SubGameProps, BehavioralFeature } from '../types';

// ========================================================
// GAME 2: BÉ ƠI QUAY LẠI NÀO – PHẢN ỨNG TÊN GỌI (RESPONSE TO NAME)
// ========================================================
const G2BeOiQuayLaiNao: React.FC<SubGameProps> = ({
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
    .character-area {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
    }
    .character {
      font-size: 180px; margin-bottom: 20px;
      animation: bounce 2s ease-in-out infinite;
      filter: drop-shadow(5px 10px 15px rgba(0,0,0,0.3));
    }
    .call-button {
      font-size: 2rem; padding: 20px 40px;
      background: linear-gradient(135deg, #00b894, #00cec9);
      color: white; border: none; border-radius: 50px;
      font-weight: bold; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      cursor: pointer; transition: 0.2s;
      display: flex; align-items: center; gap: 15px;
    }
    .call-button:active { transform: scale(0.95); }
    .timer {
      position: absolute; top: 20px; left: 20px;
      background: rgba(0,0,0,0.6); color: white; padding: 10px 20px;
      border-radius: 30px; font-size: 1.4rem; z-index: 10;
    }
    .score-board {
      position: absolute; top: 20px; right: 20px;
      background: rgba(255,255,255,0.9); padding: 15px 25px; border-radius: 30px;
      font-size: 2rem; font-weight: bold; color: #6c5ce7;
      box-shadow: 0 5px 20px rgba(0,0,0,0.2);
    }
    .feedback {
      margin-top: 20px; font-size: 1.5rem; color: #2d3436;
      background: rgba(255,255,255,0.8); padding: 10px 30px; border-radius: 40px;
    }
    @keyframes bounce {
      0%,100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }
  `;

  const GAME_DURATION = gameDuration;
  const CHARACTERS = ['🐶', '🐱', '🐻', '🐼', '🐨', '🦊', '🐸', '🐧'];

  // ---------- STATE ----------
  const [currentChar, setCurrentChar] = useState<string>('🐶');
  const [score, setScore] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  const [lastCallTime, setLastCallTime] = useState<number | null>(null);
  const [responded, setResponded] = useState<boolean>(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('👂 Nghe gọi tên và quay lại nhé!');
  const gameCompletedRef = useRef<boolean>(false);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ---------- THAY ĐỔI NHÂN VẬT ----------
  const changeCharacter = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
    setCurrentChar(CHARACTERS[randomIndex]);
  }, [CHARACTERS]);

  // ---------- GỌI TÊN BÉ (ÂM THANH) ----------
  const callName = useCallback(() => {
    if (responded || gameCompletedRef.current) return;

    // Hủy timeout cũ
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);

    // Phát âm thanh gọi tên
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(`${childName} ơi!`);
      msg.lang = 'vi-VN';
      msg.rate = 0.9;
      msg.pitch = 1.2;
      window.speechSynthesis.speak(msg);
    }

    setLastCallTime(Date.now());
    setResponded(false);
    setMessage(`🔊 Gọi ${childName}...`);
    setAttempts(prev => prev + 1);

    // Tự động kết thúc nếu không phản hồi sau 4 giây
    callTimeoutRef.current = setTimeout(() => {
      if (!responded && !gameCompletedRef.current) {
        setMessage('⏳ Bé chưa phản hồi, thử lại!');
        // Không tính là thành công
      }
    }, 4000);
  }, [childName, responded]);

  // ---------- PHÂN TÍCH AI: KIỂM TRA PHẢN ỨNG ----------
  useEffect(() => {
    const interval = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      if (!aiData || !lastCallTime || responded || gameCompletedRef.current) return;

      // Kiểm tra xem trẻ có đang nhìn vào nhân vật không (vị trí trung tâm)
      const gazeX = aiData.gazeX ?? 0.5;
      const gazeY = aiData.gazeY ?? 0.5;
      const isLookingAtCharacter = gazeX > 0.4 && gazeX < 0.6 && gazeY > 0.4 && gazeY < 0.6;

      if (isLookingAtCharacter) {
        const reactionMs = Date.now() - lastCallTime;
        setResponded(true);
        setLatency(reactionMs);
        setScore(prev => prev + 1);
        setMessage(`🎉 Bé phản ứng sau ${reactionMs}ms!`);

        // Ghi nhận feature
        onFeatureCapture({
          timestamp: Date.now(),
          gazeX,
          gazeY,
          targetX: 50,
          targetY: 50,
          targetSize: 180,
          audioStimulus: `Tên: ${childName}`,
          isLookingAtTarget: true,
          attentionLevel: aiData.avgAttention ?? 0.5,
          smileIntensity: aiData.avgSmile ?? 0.2,
          frownIntensity: 0,
          affect: 'happy',
          poseConfidence: aiData.faceConfidence ?? 0.8,
          faceConfidence: aiData.faceConfidence ?? 0.8,
          responseLatency: reactionMs,
          callAttempt: attempts,
        } as BehavioralFeature);

        // Nếu phản ứng trong vòng 3 giây → thành công
        if (reactionMs <= 3000) {
          setMessage('✅ Phản ứng tốt!');
          // Có thể gọi onGameComplete nếu đây là lần đánh giá chính thức
          // Nhưng theo spec, game này sẽ được đánh giá sau nhiều lần gọi
        }

        // Sau khi phản ứng, đổi nhân vật
        setTimeout(() => {
          changeCharacter();
          setResponded(false);
          setLastCallTime(null);
        }, 1500);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [latestAIResult, lastCallTime, responded, attempts, childName, onFeatureCapture, changeCharacter]);

  // ---------- KẾT THÚC GAME: GỬI KẾT QUẢ GATEWAY ----------
  useEffect(() => {
    if (timeElapsed >= GAME_DURATION && !gameCompletedRef.current) {
      gameCompletedRef.current = true;
      // Đánh giá thành công nếu trẻ phản ứng ít nhất 2 lần trong thời gian cho phép
      const success = score >= 2;
      onGameComplete?.(success);
    }
  }, [timeElapsed, GAME_DURATION, score, onGameComplete]);

  // ---------- KHỞI TẠO: GỌI TÊN LẦN ĐẦU ----------
  useEffect(() => {
    const timer = setTimeout(() => {
      callName();
    }, 2000);
    return () => {
      clearTimeout(timer);
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
      window.speechSynthesis.cancel();
    };
  }, [callName]);

  return (
    <div className="game-container">
      <style>{styles}</style>

      <div className="timer">⏱️ {timeElapsed}s / {GAME_DURATION}s</div>
      <div className="score-board">⭐ {score}</div>

      <div className="character-area">
        <div className="character">{currentChar}</div>
        <button className="call-button" onClick={callName}>
          <span>🔊</span> Gọi tên bé
        </button>
        <div className="feedback">{message}</div>
      </div>
    </div>
  );
};

export default G2BeOiQuayLaiNao;