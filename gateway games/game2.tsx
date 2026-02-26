import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SubGameProps, BehavioralFeature } from '../types';

const G2BeOiQuayLaiNao: React.FC<SubGameProps> = ({
  latestAIResult,
  onFeatureCapture,
  onGameComplete,
  timeElapsed,
  childName,
  gameDuration = 120,
}) => {
  const [currentChar, setCurrentChar] = useState<string>('🐶');
  const [score, setScore] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  const [lastCallTime, setLastCallTime] = useState<number | null>(null);
  const [responded, setResponded] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('👂 Nghe gọi tên và quay lại nhé!');
  
  const gameCompletedRef = useRef<boolean>(false);
  const lastRecordTimeRef = useRef<number>(0);
  const animationRef = useRef<number>(0);
  const CHARACTERS = ['🐶', '🐱', '🐻', '🐼', '🐨', '🦊', '🐸', '🐧'];

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'vi-VN';
      msg.rate = 0.9;
      window.speechSynthesis.speak(msg);
    }
  };

  const callName = useCallback(() => {
    if (responded || gameCompletedRef.current) return;
    speak(`${childName} ơi!`);
    setLastCallTime(Date.now());
    setResponded(false);
    setMessage(`🔊 Gọi ${childName}...`);
    setAttempts(prev => prev + 1);
  }, [childName, responded]);

  // Vòng lặp AI tối ưu
  const updateLoop = useCallback(() => {
    const now = Date.now();
    // Chỉ xử lý AI mỗi 250ms để tránh treo đồng hồ
    if (now - lastRecordTimeRef.current > 250) {
      const aiData = latestAIResult.current?.features;
      
      if (aiData && lastCallTime && !responded && !gameCompletedRef.current) {
        const gazeX = aiData.gazeX ?? 0.5;
        const gazeY = aiData.gazeY ?? 0.5;
        // Kiểm tra xem trẻ có quay lại nhìn nhân vật (giữa màn hình) không
        const isLookingAtCharacter = gazeX > 0.35 && gazeX < 0.65 && gazeY > 0.35 && gazeY < 0.65;

        if (isLookingAtCharacter) {
          const reactionMs = now - lastCallTime;
          setResponded(true);
          setScore(prev => prev + 1);
          setMessage(`🎉 Bé phản ứng sau ${reactionMs}ms!`);

          onFeatureCapture({
            timestamp: now,
            gazeX, gazeY,
            targetX: 50, targetY: 50,
            audioStimulus: `Tên: ${childName}`,
            isLookingAtTarget: true,
            responseLatency: reactionMs,
            callAttempt: attempts,
          } as any);

          setTimeout(() => {
            if (!gameCompletedRef.current) {
              const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
              setCurrentChar(CHARACTERS[randomIndex]);
              setResponded(false);
              setLastCallTime(null);
            }
          }, 2000);
        }
      }
      lastRecordTimeRef.current = now;
    }
    animationRef.current = requestAnimationFrame(updateLoop);
  }, [latestAIResult, lastCallTime, responded, attempts, childName, onFeatureCapture]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(updateLoop);
    const startTimer = setTimeout(callName, 2000);
    return () => {
      cancelAnimationFrame(animationRef.current);
      clearTimeout(startTimer);
      window.speechSynthesis.cancel();
    };
  }, [updateLoop, callName]);

  
  return (
    <div className="game-container">
      <style>{`
        .game-container { width: 100%; height: 100%; position: relative; background: linear-gradient(135deg, #ffeaa7, #74b9ff); border-radius: 40px; display: flex; flex-direction: column; align-items: center; padding: 20px; }
        .character { font-size: 150px; margin: 40px 0; animation: bounce 2s infinite; }
        .call-button { font-size: 1.5rem; padding: 15px 30px; background: #00b894; color: white; border: none; border-radius: 50px; cursor: pointer; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .timer { position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.6); color: white; padding: 10px 20px; border-radius: 30px; }
        .score-board { position: absolute; top: 20px; right: 20px; background: white; padding: 10px 25px; border-radius: 30px; font-size: 1.5rem; font-weight: bold; }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
      `}</style>
      <div className="timer">⏱️ {timeElapsed}s / {gameDuration}s</div>
      <div className="score-board">⭐ {score}</div>
      <div className="character">{currentChar}</div>
      <button className="call-button" onClick={callName}>🔊 Gọi tên bé</button>
      <div style={{marginTop: '20px', fontSize: '1.2rem'}}>{message}</div>
    </div>
  );
};

export default G2BeOiQuayLaiNao;