import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G3_4_PairMatch: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- KHO DỮ LIỆU HÌNH ẢNH PHONG PHÚ ---
  const emojiLibrary = useMemo(() => [
    { emoji: '🍎', name: 'Táo' }, { emoji: '🐱', name: 'Mèo' },
    { emoji: '🚗', name: 'Ô tô' }, { emoji: '🧸', name: 'Gấu' },
    { emoji: '🍦', name: 'Kem' }, { emoji: '🎈', name: 'Bóng' },
    { emoji: '🐶', name: 'Chó' }, { emoji: '🦁', name: 'Sư tử' },
    { emoji: '🍓', name: 'Dâu' }, { emoji: '🐸', name: 'Ếch' }
  ], []);

  const GAME_DURATION = 180; // 3 phút

  interface Card {
    id: number;
    emoji: string;
    pairId: number;
    flipped: boolean;
    matched: boolean;
  }

  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [round, setRound] = useState(1);

  // --- LOGIC TẠO VÒNG CHƠI MỚI ---
  const initGame = useCallback(() => {
    // Chọn ngẫu nhiên 3 cặp từ thư viện (tổng 6 ô) để vừa sức trẻ 2-3 tuổi
    const selectedEmojis = [...emojiLibrary]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const newCards: Card[] = [];
    selectedEmojis.forEach((item, index) => {
      // Mỗi hình tạo 2 bản sao
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
  }, [emojiLibrary]);

  useEffect(() => {
    initGame();
  }, [initGame, round]);

  // Kiểm tra hoàn thành vòng chơi
  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.matched)) {
      const timer = setTimeout(() => {
        setRound(prev => prev + 1);
      }, 1500); // Đợi 1.5s để bé thấy kết quả rồi sang vòng mới
      return () => clearTimeout(timer);
    }
  }, [cards]);

  const handleCardClick = (id: number) => {
    if (isChecking || flippedCards.length >= 2) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

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
        // Đúng cặp
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === firstId || c.id === secondId) ? { ...c, matched: true } : c
          ));
          setFlippedCards([]);
          setIsChecking(false);
        }, 600);
      } else {
        // Sai cặp
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

  // --- STYLES ---
  const styles = `
    .pair-match-container {
      width: 100%; height: 100%; position: relative;
      background: #E1F5FE; border-radius: 20px;
      display: flex; flex-direction: column; align-items: center; padding: 20px;
    }
    .timer-bar {
      width: 90%; height: 12px; background: #FFF; border-radius: 10px; overflow: hidden; margin-bottom: 20px;
    }
    .timer-fill {
      height: 100%; background: #4FC3F7; width: ${(timeElapsed / GAME_DURATION) * 100}%;
    }
    .grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
      width: 100%; max-width: 500px; flex: 1; align-content: center;
    }
    .card {
      aspect-ratio: 1; perspective: 1000px; cursor: pointer;
    }
    .card-inner {
      position: relative; width: 100%; height: 100%; transition: transform 0.6s;
      transform-style: preserve-3d;
    }
    .card.flipped .card-inner { transform: rotateY(180deg); }
    .card.matched { animation: bounce 0.5s; opacity: 0.7; }
    
    .front, .back {
      position: absolute; width: 100%; height: 100%; backface-visibility: hidden;
      border-radius: 20px; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 0 rgba(0,0,0,0.1); border: 4px solid white;
    }
    .back { background: linear-gradient(135deg, #FF80AB, #F06292); color: white; font-size: 50px; }
    .front { background: white; transform: rotateY(180deg); font-size: 70px; }
    
    .feedback { font-size: 26px; font-weight: bold; color: #0277BD; margin-top: 20px; background: white; padding: 10px 30px; border-radius: 30px; }
    @keyframes bounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
  `;

  return (
    <div className="pair-match-container">
      <style>{styles}</style>
      
      <div className="timer-bar"><div className="timer-fill" /></div>
      
      <div style={{fontSize: '24px', fontWeight: 'bold', color: '#01579B', marginBottom: '10px'}}>
        Màn {round}: Tìm đôi bạn thân! 👫
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
              <div className="back">⭐</div>
            </div>
          </div>
        ))}
      </div>

      <div className="feedback">
        {cards.every(c => c.matched) ? 'Bé giỏi quá! 🎉' : 'Bé chạm vào thẻ nào!'}
      </div>
    </div>
  );
};

export default G3_4_PairMatch;