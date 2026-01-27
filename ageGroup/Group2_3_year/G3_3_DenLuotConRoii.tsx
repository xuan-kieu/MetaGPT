import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G3_3_WhoseTurn: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- KHO 12 NHÂN VẬT ---
  const characterLibrary = useMemo(() => [
    { id: 1, emoji: '👧', name: 'Bé Lan' }, { id: 2, emoji: '👦', name: 'Bé Bi' },
    { id: 3, emoji: '🐻', name: 'Gấu Pooh' }, { id: 4, emoji: '🐶', name: 'Cún con' },
    { id: 5, emoji: '🐱', name: 'Mèo Mi' }, { id: 6, emoji: '🐰', name: 'Thỏ Trắng' },
    { id: 7, emoji: '🦁', name: 'Sư tử nhỏ' }, { id: 8, emoji: '🐘', name: 'Voi con' },
    { id: 9, emoji: '🐵', name: 'Khỉ con' }, { id: 10, emoji: '🐷', name: 'Heo hồng' },
    { id: 11, emoji: '🐸', name: 'Ếch cốm' }, { id: 12, emoji: '🐯', name: 'Hổ con' },
  ], []);

  const [currentRoundChars, setCurrentRoundChars] = useState<typeof characterLibrary>([]);
  const [nextTurnId, setNextTurnId] = useState<number | null>(null); // ID của bạn được chọn ngẫu nhiên
  const [actingId, setActingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');

  // Hàm chọn 3 bạn ngẫu nhiên và chọn 1 bạn bắt đầu
  const startNewRound = useCallback(() => {
    const shuffled = [...characterLibrary].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);
    setCurrentRoundChars(selected);
    
    // Chọn ngẫu nhiên 1 trong 3 bạn để bắt đầu
    const randomFirst = selected[Math.floor(Math.random() * 3)];
    setNextTurnId(randomFirst.id);
    setFeedback(`Ơ kìa, đến lượt ${randomFirst.name} đấy!`);
    setActingId(null);
  }, [characterLibrary]);

  useEffect(() => {
    startNewRound();
  }, [startNewRound]);

  const handleCharClick = (id: number, name: string) => {
    // Chỉ hoạt động nếu bấm đúng bạn đang có tín hiệu
    if (id !== nextTurnId || actingId !== null) return;

    setActingId(id);
    setFeedback(`${name} nhảy lên cao quá! ✨`);

    // Sau khi nhảy xong, chọn ngẫu nhiên bạn TIẾP THEO
    setTimeout(() => {
      setActingId(null);
      // Lọc ra danh sách 2 bạn còn lại để không trùng với bạn vừa nhảy
      const otherChars = currentRoundChars.filter(c => c.id !== id);
      const randomNext = otherChars[Math.floor(Math.random() * otherChars.length)];
      
      setNextTurnId(randomNext.id);
      setFeedback(`Giỏi quá! Giờ đến lượt ${randomNext.name} nhé!`);
    }, 1200);
  };

  // --- STYLES ---
  const styles = `
    .turn-container {
      width: 100%; height: 100%; position: relative;
      background: #E8F5E9; border-radius: 20px;
      display: flex; flex-direction: column; align-items: center; padding: 20px;
    }
    .timer {
      position: absolute; top: 15px; left: 20px;
      background: #2E7D32; color: white; padding: 5px 15px;
      border-radius: 20px; font-weight: bold;
    }
    .title {
      font-size: 28px; font-weight: bold; color: #1B5E20;
      background: white; padding: 10px 40px; border-radius: 50px;
      margin-bottom: 20px; box-shadow: 0 4px 0 #C8E6C9;
    }
    .stage {
      flex: 1; display: flex; gap: 40px; justify-content: center; align-items: center;
    }
    .char-card {
      width: 160px; height: 160px; background: white; border-radius: 50%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      border: 8px solid white; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      cursor: pointer; position: relative;
    }
    .char-card.glow {
      border-color: #FFD600; transform: scale(1.1);
      box-shadow: 0 0 30px #FFD600;
    }
    .char-card.jump {
      transform: translateY(-70px) scale(1.2);
      border-color: #4CAF50;
    }
    .emoji { font-size: 90px; }
    .name-tag {
      position: absolute; bottom: -45px; font-size: 22px;
      font-weight: bold; color: #2E7D32;
    }
    .arrow {
      position: absolute; top: -60px; font-size: 50px;
      animation: bounce-arrow 0.8s infinite;
    }
    .bubble {
      background: white; padding: 20px 50px; border-radius: 40px;
      font-size: 24px; font-weight: bold; color: #333;
      box-shadow: 0 6px 0 #BDBDBD; margin-top: 20px;
    }
    @keyframes bounce-arrow {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(15px); }
    }
  `;

  return (
    <div className="turn-container">
      <style>{styles}</style>
      
      <div className="timer">⏳ {Math.max(0, 180 - timeElapsed)}s</div>
      <div className="title">🔄 Nhấn Vào Bạn Có Mũi Tên</div>

      <div className="stage">
        {currentRoundChars.map((char) => (
          <div
            key={char.id}
            className={`char-card 
              ${nextTurnId === char.id && actingId === null ? 'glow' : ''} 
              ${actingId === char.id ? 'jump' : ''}
            `}
            onClick={() => handleCharClick(char.id, char.name)}
          >
            {nextTurnId === char.id && actingId === null && (
              <div className="arrow">👇</div>
            )}
            <span className="emoji">{char.emoji}</span>
            <div className="name-tag">{char.name}</div>
          </div>
        ))}
      </div>

      <div className="bubble">{feedback}</div>
      
      <button 
        onClick={startNewRound}
        style={{
          marginTop: '20px', padding: '10px 25px', borderRadius: '30px', 
          border: 'none', background: '#FF8A65', color: 'white', 
          fontWeight: 'bold', cursor: 'pointer', fontSize: '18px'
        }}
      >
        Đổi bạn mới 🔀
      </button>
    </div>
  );
};

export default G3_3_WhoseTurn;