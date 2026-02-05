import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G3_3_TurnTaking: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- STATE QUẢN LÝ LƯỢT ---
  const [turn, setTurn] = useState<'AI' | 'CHILD'>('AI');
  const [status, setStatus] = useState<'IDLE' | 'ACTING' | 'WAITING'>('IDLE');
  const [timeLeft, setTimeLeft] = useState(5); // 5 giây cho lượt của trẻ
  const [feedback, setFeedback] = useState('Chờ đến lượt mình nhé!');
  const [score, setScore] = useState({ success: 0, miss: 0, wrongTurn: 0 });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'vi-VN';
      msg.rate = 0.9;
      window.speechSynthesis.speak(msg);
    }
  }, []);

  // --- LOGIC ĐIỀU PHỐI LƯỢT ---
  const startChildTurn = useCallback(() => {
    setTurn('CHILD');
    setStatus('WAITING');
    setTimeLeft(5);
    setFeedback('Đến lượt con đấy! Chạm vào bạn Gấu đi!');
    speak("Đến lượt con rồi!");
    startTimeRef.current = Date.now();
  }, [speak]);

  const startAITurn = useCallback(() => {
    setTurn('AI');
    setStatus('IDLE');
    setFeedback('Đang chờ bạn Gấu chơi...');
    
    // Giả lập AI suy nghĩ rồi hành động
    setTimeout(() => {
      setStatus('ACTING');
      setFeedback('Bạn Gấu đập nè! Hây da!');
      speak("Tớ đập này!");
      
      setTimeout(() => {
        setStatus('IDLE');
        startChildTurn();
      }, 1500);
    }, 2000);
  }, [speak, startChildTurn]);

  // Khởi tạo trò chơi
  useEffect(() => {
    startAITurn();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Đếm ngược lượt của trẻ
  useEffect(() => {
    if (turn === 'CHILD' && timeLeft > 0 && status === 'WAITING') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setScore(s => ({ ...s, miss: s.miss + 1 }));
            startAITurn();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [turn, timeLeft, status, startAITurn]);

  const handleInteract = () => {
    if (turn === 'CHILD') {
      const reactionTime = (Date.now() - startTimeRef.current) / 1000;
      setStatus('ACTING');
      setFeedback(`Giỏi quá! Con làm được rồi! (${reactionTime}s)`);
      setScore(s => ({ ...s, success: s.success + 1 }));
      
      if (timerRef.current) clearInterval(timerRef.current);
      
      setTimeout(() => {
        startAITurn();
      }, 1500);
    } else {
      // Trẻ đập sai lượt (Impulsive behavior)
      setFeedback('Chưa đến lượt con đâu, chờ một chút nhé!');
      setScore(s => ({ ...s, wrongTurn: s.wrongTurn + 1 }));
      speak("Chờ tớ một tí!");
    }
  };

  // --- AI TRACKING ---
  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      const gx = aiData?.gazeX ?? 0.5;
      const gy = aiData?.gazeY ?? 0.5;

      onFeatureCapture({
        timestamp: Date.now(),
        gazeX: gx, gazeY: gy,
        isLookingAtTarget: gx > 0.3 && gx < 0.7 && gy > 0.3 && gy < 0.7,
        currentTurn: turn,
        turnStatus: status,
        reactionTime: turn === 'CHILD' ? (Date.now() - startTimeRef.current) / 1000 : null,
        impulsiveClicks: score.wrongTurn,
        attentionLevel: aiData?.avgAttention ?? 0.5,
      } as any);
    }, 200);
    return () => clearInterval(recordLoop);
  }, [onFeatureCapture, latestAIResult, turn, status, score]);

  // --- STYLES ---
  const styles = `
    .game-container {
      width: 100%; height: 100%; position: relative;
      background: #FFF9C4; display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .status-banner {
      position: absolute; top: 40px; font-size: 32px; font-weight: bold;
      color: ${turn === 'CHILD' ? '#E64A19' : '#1976D2'};
      background: white; padding: 10px 40px; border-radius: 40px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    .mascot-container {
      width: 300px; height: 300px; border-radius: 50%;
      background: white; border: 15px solid ${turn === 'CHILD' ? '#FFEB3B' : '#BBDEFB'};
      display: flex; align-items: center; justify-content: center;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      cursor: pointer; position: relative;
    }
    .mascot-acting { transform: scale(1.2); border-color: #4CAF50; box-shadow: 0 0 40px #4CAF50; }
    .mascot-emoji { font-size: 180px; }
    
    .countdown-circle {
      position: absolute; top: -20px; right: -20px;
      width: 80px; height: 80px; border-radius: 50%;
      background: #F44336; color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 36px; font-weight: bold; border: 5px solid white;
    }
    .feedback-bubble {
      margin-top: 40px; font-size: 28px; font-weight: bold; color: #5D4037;
      max-width: 80%; text-align: center;
    }
  `;

  return (
    <div className="game-container">
      <style>{styles}</style>
      
      <div className="status-banner">
        {turn === 'AI' ? '🤖 Lượt bạn Gấu' : '👶 Lượt của con'}
      </div>

      <div 
        className={`mascot-container ${status === 'ACTING' ? 'mascot-acting' : ''}`}
        onClick={handleInteract}
      >
        <span className="mascot-emoji">{turn === 'AI' && status === 'ACTING' ? '💥' : '🐻'}</span>
        {turn === 'CHILD' && status === 'WAITING' && (
          <div className="countdown-circle">{timeLeft}</div>
        )}
      </div>

      <div className="feedback-bubble">{feedback}</div>
    </div>
  );
};

export default G3_3_TurnTaking;