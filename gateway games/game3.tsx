import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SubGameProps, BehavioralFeature } from '../types';

const G3VoTayCungBan: React.FC<SubGameProps> = ({
  latestAIResult,
  onFeatureCapture,
  onGameComplete,
  timeElapsed,
  gameDuration = 120,
}) => {
  const [currentAction, setCurrentAction] = useState({ name: 'vỗ tay', emoji: '👏' });
  const [score, setScore] = useState<number>(0);
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [lastActionTime, setLastActionTime] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('🐻 Làm theo bạn nhé!');
  
  const gameCompletedRef = useRef<boolean>(false);
  const lastRecordTimeRef = useRef<number>(0);
  const animationRef = useRef<number>(0);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'vi-VN';
      window.speechSynthesis.speak(msg);
    }
  };

  const performAction = useCallback(() => {
    if (gameCompletedRef.current) return;
    const actions = [
      { name: 'vỗ tay', emoji: '👏' },
      { name: 'vẫy tay', emoji: '👋' }
    ];
    const action = actions[Math.floor(Math.random() * actions.length)];
    setCurrentAction(action);
    setIsWaiting(true);
    setLastActionTime(Date.now());
    setMessage(`🐻 Bé hãy ${action.name} nào!`);
    speak(`Bé hãy ${action.name} nào!`);
  }, []);

  const handleSuccess = useCallback((reactionTime: number) => {
    setScore(prev => prev + 1);
    setMessage(`🎉 Đúng rồi! (+${reactionTime}ms)`);
    setIsWaiting(false);
    
    onFeatureCapture({
      timestamp: Date.now(),
      isLookingAtTarget: true,
      imitationLatency: reactionTime,
      imitationSuccess: true,
      actionName: currentAction.name,
    } as any);

    setTimeout(performAction, 2500);
  }, [currentAction, onFeatureCapture, performAction]);

  const updateLoop = useCallback(() => {
    const now = Date.now();
    if (now - lastRecordTimeRef.current > 200) { // Check AI mỗi 200ms
      const aiData = latestAIResult.current?.features;
      
      if (isWaiting && aiData && !gameCompletedRef.current) {
        // Logic phát hiện vỗ tay (giả định từ AI hoặc Hand Landmarks)
        let detected = false;
        if (aiData.handDetected) { 
            detected = true; // Nếu AI của bạn có field này
        }

        if (detected) {
          handleSuccess(now - (lastActionTime || now));
        }
      }
      lastRecordTimeRef.current = now;
    }
    animationRef.current = requestAnimationFrame(updateLoop);
  }, [isWaiting, lastActionTime, latestAIResult, handleSuccess]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(updateLoop);
    const startTimer = setTimeout(performAction, 2000);
    return () => {
      cancelAnimationFrame(animationRef.current);
      clearTimeout(startTimer);
      window.speechSynthesis.cancel();
    };
  }, [updateLoop, performAction]);


  return (
    <div className="game-container">
      <style>{`
        .game-container { width: 100%; height: 100%; position: relative; background: #ffeaa7; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 40px; }
        .character { font-size: 180px; margin-bottom: 20px; transition: 0.3s; }
        .clap-btn { width: 120px; height: 120px; border-radius: 60px; background: #ff6b6b; border: 5px solid white; cursor: pointer; font-size: 50px; display: flex; align-items: center; justify-content: center; }
        .timer { position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.6); color: white; padding: 10px 20px; border-radius: 30px; }
        .score { position: absolute; top: 20px; right: 20px; background: white; padding: 10px 25px; border-radius: 30px; font-size: 1.5rem; font-weight: bold; color: #00b894; }
      `}`</style>
      <div className="timer">⏱️ {timeElapsed}s / {gameDuration}s</div>
      <div className="score">⭐ {score}</div>
      <div className={`character ${isWaiting ? 'clapping' : ''}`}>{currentAction.emoji}</div>
      <div style={{fontSize: '1.5rem', marginBottom: '20px', fontWeight: 'bold'}}>{message}</div>
      <div className="clap-btn" onClick={() => isWaiting && handleSuccess(Date.now() - (lastActionTime || 0))}>👏</div>
      <p style={{marginTop: '10px', color: '#666'}}>(Bấm nút hoặc vỗ tay trước camera)</p>
    </div>
  );
};

export default G3VoTayCungBan;