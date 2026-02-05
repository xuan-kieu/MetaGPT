import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G3_2_EmotionMatch: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- CSS TỐI ƯU ---
  const styles = `
    .emotion-container {
      width: 100%; height: 100%; position: relative;
      background: #F3E5F5; border-radius: 20px;
      display: flex; flex-direction: column; align-items: center;
      justify-content: space-around; padding: 20px; overflow: hidden;
    }

    .main-display-area {
      position: relative; width: 300px; height: 300px;
      display: flex; align-items: center; justify-content: center;
    }

    .main-emoji-display {
      font-size: 200px; 
      animation: bounce 2s infinite;
      z-index: 2;
    }

    .options-grid { display: flex; gap: 30px; width: 100%; justify-content: center; }

    .emotion-card {
      width: 180px; height: 180px; background: white;
      border-radius: 35px; display: flex; flex-direction: column;
      align-items: center; justify-content: center; cursor: pointer;
      box-shadow: 0 8px 0 #E0E0E0; border: 6px solid white;
      transition: all 0.2s;
    }

    .emotion-card.selected-correct { background: #C8E6C9; border-color: #4CAF50; transform: scale(1.1); }
    .emotion-card.selected-wrong { background: #FFCDD2; border-color: #F44336; animation: shake 0.5s; }

    .card-emoji { font-size: 70px; }
    .card-label { font-size: 24px; font-weight: bold; color: #333; margin-top: 8px; }

    @keyframes bounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
    @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
  `;

  // --- 3 CẢM XÚC CHÍNH ---
  const emotionPool = useMemo(() => [
    { id: 1, emoji: '😊', name: 'Vui', type: 'positive', call: 'Bạn ấy đang vui này!' },
    { id: 2, emoji: '😢', name: 'Buồn', type: 'negative', call: 'Bạn ấy đang buồn quá!' },
    { id: 3, emoji: '😡', name: 'Giận', type: 'negative', call: 'Bạn ấy đang giận dữ kìa!' },
  ], []);

  const [currentQuestion, setCurrentQuestion] = useState(emotionPool[0]);
  const [options, setOptions] = useState<typeof emotionPool>([]);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [clickedId, setClickedId] = useState<number | null>(null); // Dùng để xác định card nào bị bấm sai

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'vi-VN';
      msg.rate = 0.85;
      window.speechSynthesis.speak(msg);
    }
  }, []);

  const generateNewQuestion = useCallback(() => {
    const correct = emotionPool[Math.floor(Math.random() * emotionPool.length)];
    const shuffled = [...emotionPool].sort(() => Math.random() - 0.5);
    
    setCurrentQuestion(correct);
    setOptions(shuffled);
    setStatus('idle');
    setClickedId(null);
    
    setTimeout(() => {
      speak(`${correct.call}. Con chọn hình giống bạn đi!`);
    }, 500);
  }, [emotionPool, speak]);

  useEffect(() => {
    generateNewQuestion();
  }, [generateNewQuestion]);

  const handleSelect = (id: number) => {
    if (status !== 'idle') return;
    setClickedId(id);

    if (id === currentQuestion.id) {
      setStatus('correct');
      speak("Đúng rồi! Bé giỏi quá!");
      setTimeout(generateNewQuestion, 2000);
    } else {
      setStatus('wrong');
      speak("Bé nhìn kỹ lại nhé!");
      setTimeout(() => {
        setStatus('idle');
        setClickedId(null);
      }, 1000);
    }
  };

  // --- AI TRACKING (Phân tích vùng nhìn Mắt/Miệng) ---
  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      const gx = aiData?.gazeX ?? 0.5;
      const gy = aiData?.gazeY ?? 0.5;

      // Tính toán vùng chi tiết (Giả định vùng emoji ở giữa màn hình)
      const isLookingAtEyes = (gx > 0.4 && gx < 0.6) && (gy > 0.25 && gy < 0.35);
      const isLookingAtMouth = (gx > 0.4 && gx < 0.6) && (gy > 0.45 && gy < 0.55);

      onFeatureCapture({
        timestamp: Date.now(),
        gazeX: gx, gazeY: gy,
        targetX: 50, targetY: 40,
        audioStimulus: currentQuestion.name,
        isLookingAtTarget: true,
        focusZone: isLookingAtEyes ? 'EYES' : (isLookingAtMouth ? 'MOUTH' : 'FACE'),
        attentionLevel: aiData?.avgAttention ?? 0.5,
        affect: currentQuestion.type as any,
        poseConfidence: aiData?.faceDetectionConfidence ?? 0,
      } as any);
    }, 200);
    return () => clearInterval(recordLoop);
  }, [currentQuestion, onFeatureCapture, latestAIResult]);

  return (
    <div className="emotion-container">
      <style>{styles}</style>
      
      <div style={{fontSize: '32px', fontWeight: 'bold', color: '#7B1FA2'}}>
        Cảm Xúc Của Bạn
      </div>

      <div className="main-display-area">
        <div className="main-emoji-display">{currentQuestion.emoji}</div>
      </div>

      <div className="options-grid">
        {options.map(opt => (
          <div
            key={opt.id}
            className={`emotion-card 
              ${status === 'correct' && opt.id === currentQuestion.id ? 'selected-correct' : ''}
              ${status === 'wrong' && opt.id === clickedId ? 'selected-wrong' : ''} 
            `}
            onClick={() => handleSelect(opt.id)}
          >
            <span className="card-emoji">{opt.emoji}</span>
            <span className="card-label">{opt.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default G3_2_EmotionMatch;