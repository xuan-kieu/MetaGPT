import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G3_4_PairMatch: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
  childName
}) => {
  // --- KHO DỮ LIỆU ---
  const emojiLibrary = useMemo(() => [
    { emoji: '🍎', name: 'Táo' }, { emoji: '🐱', name: 'Mèo' },
    { emoji: '🚗', name: 'Ô tô' }, { emoji: '🧸', name: 'Gấu' },
    { emoji: '🍦', name: 'Kem' }, { emoji: '🎈', name: 'Bóng' },
    { emoji: '🐶', name: 'Chó' }, { emoji: '🦁', name: 'Sư tử' },
    { emoji: '🍓', name: 'Dâu' }, { emoji: '🐸', name: 'Ếch' }
  ], []);

  const GAME_DURATION = 180;

  interface Card {
    id: number;
    emoji: string;
    pairId: number;
    flipped: boolean;
    matched: boolean;
  }

  // --- STATE ---
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [round, setRound] = useState(1);
  const [stats, setStats] = useState({ flips: 0, mistakes: 0, memoryHits: 0 });

  // Theo dõi bộ nhớ vị trí của trẻ
  const seenCards = useRef<Set<number>>(new Set());

  // --- LOGIC GAME ---
  const initGame = useCallback(() => {
    // Chọn 4 cặp ngẫu nhiên
    const selectedEmojis = [...emojiLibrary]
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);

    const newCards: Card[] = [];
    selectedEmojis.forEach((item, index) => {
      for (let i = 0; i < 2; i++) {
        newCards.push({
          id: Math.random(),
          emoji: item.emoji,
          pairId: index,
          flipped: false,
          matched: false
        });
      }
    });

    setCards(newCards.sort(() => Math.random() - 0.5));
    setFlippedCards([]);
    setIsChecking(false);
    seenCards.current.clear();
  }, [emojiLibrary]);

  useEffect(() => {
    initGame();
  }, [initGame, round]);

  // Tự động chuyển màn khi hoàn thành
  useEffect(() => {
    if (cards.length > 0 && cards.every(card => card.matched)) {
      const nextRoundTimer = setTimeout(() => {
        setRound(prev => prev + 1);
      }, 2500); // Đợi 2.5s để bé thấy thông báo chiến thắng
      return () => clearTimeout(nextRoundTimer);
    }
  }, [cards]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'vi-VN';
      msg.rate = 0.9;
      window.speechSynthesis.speak(msg);
    }
  };

  const handleCardClick = (id: number) => {
    if (isChecking || flippedCards.length >= 2) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

    setStats(s => ({ ...s, flips: s.flips + 1 }));
    
    if (seenCards.current.has(id)) {
      setStats(s => ({ ...s, memoryHits: s.memoryHits + 1 }));
    }
    seenCards.current.add(id);

    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    setCards(newCards);

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setIsChecking(true);
      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = newCards.find(c => c.id === secondId);

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        speak(`Tìm thấy ${firstCard.emoji} rồi!`);
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === firstId || c.id === secondId) ? { ...c, matched: true } : c
          ));
          setFlippedCards([]);
          setIsChecking(false);
        }, 600);
      } else {
        setStats(s => ({ ...s, mistakes: s.mistakes + 1 }));
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === firstId || c.id === secondId) ? { ...c, flipped: false } : c
          ));
          setFlippedCards([]);
          setIsChecking(false);
        }, 1200);
      }
    }
  };

  // --- AI TRACKING ---
  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      const gx = aiData?.gazeX ?? 0.5;
      const gy = aiData?.gazeY ?? 0.5;

      const isAvoidingScreen = gx < 0.1 || gx > 0.9 || gy < 0.1 || gy > 0.9;
      const isWin = cards.length > 0 && cards.every(c => c.matched);

      onFeatureCapture({
        timestamp: Date.now(),
        gazeX: gx,
        gazeY: gy,
        attentionLevel: aiData?.avgAttention ?? 0.5,
        smileIntensity: aiData?.avgSmile ?? 0,
        frownIntensity: aiData?.avgFrown ?? 0,
        affect: isWin ? 'positive' : 'neutral',
        poseConfidence: aiData?.faceDetectionConfidence ?? 0,
        faceConfidence: aiData?.faceConfidence ?? 0,
        anticipation: false,
        childVocalization: aiData?.isSpeaking ?? false,
        gameId: 'G3.4',
        childName,
      } as BehavioralFeature);
    }, 200);
    return () => clearInterval(recordLoop);
  }, [onFeatureCapture, latestAIResult, cards, childName]);

  // --- STYLES ---
  const styles = `
    .pair-match-container {
      width: 100%; height: 100%; position: relative;
      background: linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%); 
      border-radius: 20px;
      display: flex; flex-direction: column; align-items: center; padding: 20px;
      overflow: hidden;
    }
    .grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;
      width: 100%; max-width: 600px; flex: 1; align-content: center;
    }
    .card {
      aspect-ratio: 1; perspective: 1000px; cursor: pointer;
    }
    .card-inner {
      position: relative; width: 100%; height: 100%; 
      transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      transform-style: preserve-3d;
    }
    .card.flipped .card-inner { transform: rotateY(180deg); }
    .front, .back {
      position: absolute; width: 100%; height: 100%; backface-visibility: hidden;
      border-radius: 15px; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 12px rgba(0,0,0,0.1); border: 4px solid white;
    }
    .back { background: #FF4081; color: white; font-size: 40px; }
    .front { background: white; transform: rotateY(180deg); font-size: 60px; }
    
    .matched .front {
      background: #C8E6C9;
      border-color: #4CAF50;
      animation: pulse 1s infinite alternate;
    }

    @keyframes pulse {
      from { transform: rotateY(180deg) scale(1); }
      to { transform: rotateY(180deg) scale(1.05); }
    }

    .feedback-box {
      font-size: 24px; font-weight: bold; color: #0277BD; 
      margin-top: 20px; padding: 10px 30px;
      background: rgba(255,255,255,0.7); border-radius: 30px;
    }
  `;

  return (
    <div className="pair-match-container">
      <style>{styles}</style>
      
      <div style={{fontSize: '28px', fontWeight: 'bold', color: '#01579B', marginBottom: '10px'}}>
        Màn {round}: Tìm cặp giống nhau! 🧩
      </div>

      <div className="grid">
        {cards.map(card => (
          <div 
            key={card.id} 
            className={`card ${card.flipped || card.matched ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
            onClick={() => handleCardClick(card.id)}
          >
            <div className="card-inner">
              <div className="front">{card.emoji}</div>
              <div className="back">❓</div>
            </div>
          </div>
        ))}
      </div>

      <div className="feedback-box">
        {cards.length > 0 && cards.every(c => c.matched) 
          ? '🌟 Giỏi lắm! Chuẩn bị màn mới nhé...' 
          : 'Bé hãy tìm 2 hình giống nhau nào!'}
      </div>

      <div style={{marginTop: '10px', color: '#546E7A', fontSize: '14px'}}>
        ⏱️ Thời gian chơi: {timeElapsed}s
      </div>
    </div>
  );
};

export default G3_4_PairMatch;