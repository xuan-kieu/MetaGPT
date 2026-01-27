import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G3_1_AnimalHome: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- KHO DỮ LIỆU CON VẬT PHONG PHÚ ---
  const animalLibrary = useMemo(() => [
    { id: 1, emoji: '🐶', name: 'Cún con', color: '#FFB347' },
    { id: 2, emoji: '🐱', name: 'Mèo con', color: '#81D4FA' },
    { id: 3, emoji: '🐰', name: 'Bạn Thỏ', color: '#F48FB1' },
    { id: 4, emoji: '🐤', name: 'Gà chíp', color: '#FFF176' },
    { id: 5, emoji: '🐸', name: 'Bạn Ếch', color: '#81C784' },
    { id: 6, emoji: '🐷', name: 'Ủn Ỉn', color: '#F8BBD0' },
    { id: 7, emoji: '🦁', name: 'Sư tử', color: '#FFCC80' },
    { id: 8, emoji: '🐘', name: 'Voi con', color: '#B0BEC5' },
    { id: 9, emoji: '🐼', name: 'Gấu trúc', color: '#EEEEEE' },
    { id: 10, emoji: '🐮', name: 'Bạn Bò', color: '#D7CCC8' },
  ], []);

  const GAME_DURATION = 180; // 3 phút

  // Hàm xáo trộn (Shuffle)
  const shuffle = (arr: any[]) => [...arr].sort(() => Math.random() - 0.5);

  // State quản lý màn chơi hiện tại
  const [gameState, setGameState] = useState(() => {
    const selected = shuffle(animalLibrary).slice(0, 3);
    return {
      animals: selected.map(a => ({ ...a, placed: false })),
      homes: shuffle(selected).map(a => ({ id: a.id, color: a.color, animalId: null })),
    };
  });

  const [selectedAnimal, setSelectedAnimal] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('Bé tìm nhà cho các bạn nhé! 🐾');

  // Reset sang màn mới với con vật mới
  const nextRound = useCallback(() => {
    const selected = shuffle(animalLibrary).slice(0, 3);
    setGameState({
      animals: selected.map(a => ({ ...a, placed: false })),
      homes: shuffle(selected).map(a => ({ id: a.id, color: a.color, animalId: null })),
    });
    setFeedback('Tuyệt quá! Thêm các bạn mới nè! ✨');
    setSelectedAnimal(null);
  }, [animalLibrary]);

  // Kiểm tra hoàn thành màn
  useEffect(() => {
    if (gameState.animals.every(a => a.placed)) {
      const timer = setTimeout(nextRound, 1200);
      return () => clearTimeout(timer);
    }
  }, [gameState.animals, nextRound]);

  const handleAnimalClick = (id: number) => {
    setSelectedAnimal(id);
    const animal = gameState.animals.find(a => a.id === id);
    setFeedback(`Đưa bạn ${animal?.name} về nhà nào!`);
  };

  const handleHomeClick = (homeId: number) => {
    if (selectedAnimal === null) return;
    const animal = gameState.animals.find(a => a.id === selectedAnimal);
    
    if (animal && animal.id === homeId) {
      setGameState(prev => ({
        animals: prev.animals.map(a => a.id === selectedAnimal ? { ...a, placed: true } : a),
        homes: prev.homes.map(h => h.id === homeId ? { ...h, animalId: selectedAnimal } : h)
      }));
      setFeedback(`Đúng rồi! Hoan hô bé! 👏`);
      setSelectedAnimal(null);
    } else {
      setFeedback('Nhầm nhà rồi! Bé tìm nhà cùng màu nhé! ❤️');
    }
  };

  // --- GIAO DIỆN ---
  const styles = `
    .game-container {
      width: 100%; height: 100%; position: relative;
      background: #F1F8E9; border-radius: 20px;
      display: flex; flex-direction: column; align-items: center; padding: 20px;
      overflow: hidden;
    }
    .progress-bar {
      width: 90%; height: 15px; background: #E0E0E0;
      border-radius: 10px; margin-bottom: 20px; overflow: hidden;
    }
    .progress-fill {
      height: 100%; background: #66BB6A;
      width: ${Math.min(100, (timeElapsed / GAME_DURATION) * 100)}%;
      transition: width 1s linear;
    }
    .play-area {
      flex: 1; width: 100%; display: flex; flex-direction: column;
      justify-content: space-evenly; align-items: center;
    }
    .row { display: flex; gap: 30px; justify-content: center; width: 100%; }
    .card {
      width: 130px; height: 130px; border-radius: 25px;
      background: white; display: flex; align-items: center; justify-content: center;
      font-size: 70px; cursor: pointer; border: 6px solid white;
      box-shadow: 0 6px 12px rgba(0,0,0,0.1); transition: transform 0.2s;
    }
    .card.active { transform: scale(1.15); border-color: #FFD54F; box-shadow: 0 0 20px #FFD54F; }
    .card.hidden { visibility: hidden; }
    .home-target {
      width: 150px; height: 150px; border-radius: 30px;
      border: 5px dashed rgba(0,0,0,0.15); display: flex;
      align-items: center; justify-content: center; font-size: 75px;
    }
    .bubble {
      background: white; padding: 15px 40px; border-radius: 50px;
      font-size: 22px; font-weight: bold; color: #455A64;
      box-shadow: 0 4px 0 #CFD8DC; margin-top: 10px;
    }
  `;

  return (
    <div className="game-container">
      <style>{styles}</style>
      
      <div className="progress-bar">
        <div className="progress-fill" />
      </div>

      <div className="play-area">
        <div className="row">
          {gameState.animals.map(animal => (
            <div
              key={animal.id}
              className={`card ${selectedAnimal === animal.id ? 'active' : ''} ${animal.placed ? 'hidden' : ''}`}
              style={{ backgroundColor: animal.color }}
              onClick={() => handleAnimalClick(animal.id)}
            >
              {animal.emoji}
            </div>
          ))}
        </div>

        <div className="row">
          {gameState.homes.map(home => (
            <div
              key={home.id}
              className="home-target"
              style={{ 
                backgroundColor: home.animalId ? home.color : 'white',
                borderColor: home.color,
                borderStyle: home.animalId ? 'solid' : 'dashed'
              }}
              onClick={() => handleHomeClick(home.id)}
            >
              {home.animalId ? 
                gameState.animals.find(a => a.id === home.animalId)?.emoji : 
                <span style={{opacity: 0.1}}>🏠</span>
              }
            </div>
          ))}
        </div>
      </div>

      <div className="bubble">{feedback}</div>
    </div>
  );
};

export default G3_1_AnimalHome;