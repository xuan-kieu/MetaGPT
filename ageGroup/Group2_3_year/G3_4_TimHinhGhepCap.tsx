import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G3_4_PairMatch: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
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
    // Tăng lên 4 cặp (8 thẻ) cho trẻ 2.5 - 3 tuổi
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
    
    // Ghi nhớ vị trí: Nếu thẻ này đã từng được lật trước đó
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
        // Đúng cặp
        speak(`Tìm thấy ${firstCard.emoji} rồi!`);
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === firstId || c.id === secondId) ? { ...c, matched: true } : c
          ));
          setFlippedCards([]);
          setIsChecking(false);
        }, 600);
      } else {
        // Sai cặp
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

      // Kiểm tra tránh né ánh mắt: Không nhìn vào vùng thẻ (giữa màn hình)
      const isAvoidingScreen = gx < 0.1 || gx > 0.9 || gy < 0.1 || gy > 0.9;

      onFeatureCapture({
        timestamp: Date.now(),
        gazeX: gx, gazeY: gy,
        isLookingAtTarget: !isAvoidingScreen,
        attentionLevel: aiData?.avgAttention ?? 0.5,
        // Dữ liệu hành vi chuyên sâu
        memoryEfficiency: stats.flips > 0 ? (cards.filter(c => c.matched).length / stats.flips) : 0,
        avoidanceDetected: isAvoidingScreen,
        totalMistakes: stats.mistakes,
        roundProgress: (cards.filter(c => c.matched).length / cards.length) * 100
      } as any);
    }, 200);
    return () => clearInterval(recordLoop);
  }, [onFeatureCapture, latestAIResult, cards, stats]);

  // --- STYLES ---
  const styles = `
    .pair-match-container {
      width: 100%; height: 100%; position: relative;
      background: #E1F5FE; border-radius: 20px;
      display: flex; flex-direction: column; align-items: center; padding: 20px;
    }
    .grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;
      width: 100%; max-width: 650px; flex: 1; align-content: center;
    }
    .card {
      aspect-ratio: 1; perspective: 1000px; cursor: pointer;
    }
    .card-inner {
      position: relative; width: 100%; height: 100%; transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      transform-style: preserve-3d;
    }
    .card.flipped .card-inner { transform: rotateY(180deg); }
    .front, .back {
      position: absolute; width: 100%; height: 100%; backface-visibility: hidden;
      border-radius: 15px; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 0 rgba(0,0,0,0.1); border: 4px solid white;
    }
    .back { background: #FF4081; color: white; font-size: 40px; }
    .front { background: white; transform: rotateY(180deg); font-size: 60px; }
    .feedback { font-size: 24px; font-weight: bold; color: #0277BD; margin-top: 15px; }
  `;

  return (
    <div className="pair-match-container">
      <style>{styles}</style>
      
      <div style={{fontSize: '28px', fontWeight: 'bold', color: '#01579B', marginBottom: '20px'}}>
        Màn {round}: Tìm cặp giống nhau! 🧩
      </div>

      <div className="grid">
        {cards.map(card => (
          <div 
            key={card.id} 
            className={`card ${card.flipped || card.matched ? 'flipped' : ''}`}
            onClick={() => handleCardClick(card.id)}
          >
            <div className="card-inner">
              <div className="front">{card.emoji}</div>
              <div className="back">❓</div>
            </div>
          </div>
        ))}
      </div>

      <div className="feedback">
        {cards.every(c => c.matched) ? 'Xuất sắc quá! 🌟' : 'Tìm 2 hình giống nhau nhé!'}
      </div>
    </div>
  );
};

export default G3_4_PairMatch;