import React, { useState, useEffect, useCallback } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G3_2_EmotionMatch: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- CSS TỐI ƯU CHO TRẺ 2-3 TUỔI ---
  const styles = `
    .emotion-container {
      width: 100%; height: 100%; position: relative;
      background: #F3E5F5; border-radius: 20px;
      display: flex; flex-direction: column; align-items: center;
      justify-content: space-around; padding: 20px;
    }

    .emotion-title {
      font-size: 32px; font-weight: bold; color: #7B1FA2;
      background: white; padding: 10px 40px; border-radius: 50px;
      box-shadow: 0 4px 0 #CE93D8;
    }

    .main-emoji-display {
      font-size: 150px; /* Siêu lớn cho bé */
      margin: 20px 0;
      animation: bounce 2s infinite;
    }

    .options-grid {
      display: flex; gap: 40px; width: 100%; justify-content: center;
    }

    .emotion-card {
      width: 220px; height: 220px; background: white;
      border-radius: 40px; display: flex; flex-direction: column;
      align-items: center; justify-content: center; cursor: pointer;
      box-shadow: 0 10px 0 #E0E0E0; border: 8px solid white;
      transition: all 0.2s;
    }

    .emotion-card.selected-correct {
      background: #C8E6C9; border-color: #4CAF50;
      transform: scale(1.1);
    }

    .emotion-card.selected-wrong {
      background: #FFCDD2; border-color: #F44336;
      animation: shake 0.5s;
    }

    .card-emoji { font-size: 80px; }
    .card-label { font-size: 28px; font-weight: bold; color: #333; margin-top: 10px; }

    .timer-line {
      position: absolute; top: 0; left: 0; height: 10px;
      background: #BA68C8; width: ${(timeElapsed / 180) * 100}%;
      transition: width 1s linear;
    }

    @keyframes bounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-15px); }
      75% { transform: translateX(15px); }
    }
  `;

  // --- DỮ LIỆU CẢM XÚC ĐƠN GIẢN ---
  const emotionPool = [
    { id: 1, emoji: '😊', name: 'Vui', type: 'positive' },
    { id: 2, emoji: '😢', name: 'Buồn', type: 'negative' },
    { id: 3, emoji: '😡', name: 'Giận', type: 'negative' },
    { id: 4, emoji: '😲', name: 'Ồ!', type: 'surprised' },
    { id: 5, emoji: '😴', name: 'Ngủ', type: 'neutral' },
  ];

  const [currentQuestion, setCurrentQuestion] = useState(emotionPool[0]);
  const [options, setOptions] = useState<typeof emotionPool>([]);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [feedback, setFeedback] = useState('Bạn này đang làm sao nhỉ?');

  const generateNewQuestion = useCallback(() => {
    const correct = emotionPool[Math.floor(Math.random() * emotionPool.length)];
    const others = emotionPool.filter(e => e.id !== correct.id);
    const wrong = others[Math.floor(Math.random() * others.length)];
    
    setCurrentQuestion(correct);
    setOptions([correct, wrong].sort(() => Math.random() - 0.5));
    setStatus('idle');
    setFeedback('Bạn này đang làm sao nhỉ?');
  }, []);

  useEffect(() => {
    generateNewQuestion();
  }, [generateNewQuestion]);

  const handleSelect = (id: number) => {
    if (status !== 'idle') return;

    if (id === currentQuestion.id) {
      setStatus('correct');
      setFeedback('Đúng rồi! Bé giỏi quá! 🎉');
      setTimeout(generateNewQuestion, 1500);
    } else {
      setStatus('wrong');
      setFeedback('Bé nhìn kỹ lại bạn nhé! ❤️');
      setTimeout(() => setStatus('idle'), 1000);
    }
  };

  // --- AI TRACKING ---
  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      const feature: BehavioralFeature = {
        timestamp: Date.now(),
        gazeX: aiData?.gazeX ?? 0.5,
        gazeY: aiData?.gazeY ?? 0.5,
        targetX: 50, targetY: 45, targetSize: 200,
        audioStimulus: null,
        isLookingAtTarget: true,
        attentionLevel: aiData?.avgAttention ?? 0.5,
        smileIntensity: aiData?.avgSmile ?? 0,
        frownIntensity: 0,
        affect: currentQuestion.type as any,
        poseConfidence: aiData?.faceDetectionConfidence ?? 0,
        faceConfidence: aiData?.faceDetectionConfidence ?? 0
      };
      onFeatureCapture(feature);
    }, 200);
    return () => clearInterval(recordLoop);
  }, [currentQuestion, onFeatureCapture, latestAIResult]);

  return (
    <div className="emotion-container">
      <style>{styles}</style>
      <div className="timer-line" />
      
      <div className="emotion-title">Cảm Xúc Của Bạn</div>

      <div className="main-emoji-display">
        {currentQuestion.emoji}
      </div>

      <div className="feedback-text" style={{fontSize: '24px', fontWeight: 'bold', color: '#4A5568'}}>
        {feedback}
      </div>

      <div className="options-grid">
        {options.map(opt => (
          <div
            key={opt.id}
            className={`emotion-card 
              ${status === 'correct' && opt.id === currentQuestion.id ? 'selected-correct' : ''}
              ${status === 'wrong' && opt.id !== currentQuestion.id ? 'selected-wrong' : ''}
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