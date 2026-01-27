import React, { useState, useEffect, useCallback } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G3_5_SimpleMaze: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- HỆ THỐNG MÊ CUNG PHONG PHÚ ---
  const mazeThemes = [
    { name: 'Rừng Xanh', wall: '#2E7D32', path: '#DCEDC8', player: '🐒', end: '🍌' },
    { name: 'Đại Dương', wall: '#0277BD', path: '#E1F5FE', player: '🐠', end: '🐚' },
    { name: 'Vũ Trụ', wall: '#4527A0', path: '#EDE7F6', player: '🚀', end: '⭐' },
  ];

  const [themeIdx, setThemeIdx] = useState(0);
  const [maze, setMaze] = useState<number[][]>([]);
  const [playerPosition, setPlayerPosition] = useState<[number, number]>([1, 1]);
  const [feedback, setFeedback] = useState('Dẫn bạn đi tìm kho báu nào!');

  // Hàm tạo mê cung ngẫu nhiên đơn giản (Trẻ 2-3 tuổi chỉ nên chơi lưới 7x7)
  const generateMaze = useCallback(() => {
    const newMaze = [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1],
    ];
    
    // Đặt đích đến ngẫu nhiên ở một ô trống (số 0)
    let endR, endC;
    do {
      endR = Math.floor(Math.random() * 5) + 1;
      endC = Math.floor(Math.random() * 5) + 1;
    } while ((endR === 1 && endC === 1) || newMaze[endR][endC] === 1);
    
    newMaze[endR][endC] = 3; // Số 3 là đích
    setMaze(newMaze);
    setPlayerPosition([1, 1]); // Reset player về góc trái
  }, []);

  // Đổi địa hình mỗi 60 giây
  useEffect(() => {
    if (timeElapsed > 0 && timeElapsed % 60 === 0) {
      setThemeIdx((prev) => (prev + 1) % mazeThemes.length);
      generateMaze();
      setFeedback('Oa! Cảnh vật thay đổi rồi kìa! ✨');
    }
  }, [timeElapsed, generateMaze]);

  // Khởi tạo mê cung lần đầu
  useEffect(() => {
    generateMaze();
  }, [generateMaze]);

  const movePlayer = (direction: 'up' | 'down' | 'left' | 'right') => {
    const [row, col] = playerPosition;
    let nR = row, nC = col;
    
    if (direction === 'up') nR--;
    if (direction === 'down') nR++;
    if (direction === 'left') nC--;
    if (direction === 'right') nC++;

    if (maze[nR][nC] !== 1) { // Không phải tường
      if (maze[nR][nC] === 3) { // Đến đích
        setFeedback('Giỏi quá! Bé tìm thấy rồi! 🎉');
        setTimeout(() => {
          generateMaze(); // Đổi vị trí đích và reset bàn chơi
          setFeedback('Tìm tiếp thôi nào! 🔎');
        }, 1000);
      }
      setPlayerPosition([nR, nC]);
    } else {
      setFeedback('Hết đường rồi, đi lối khác bé nhé! 🧱');
    }
  };

  const currentTheme = mazeThemes[themeIdx];
  const cellSize = 100 / 7;

  return (
    <div className="maze-container" style={{ background: currentTheme.wall }}>
      <style>{`
        .maze-container { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; transition: background 1s; }
        .maze-board { position: relative; width: 450px; height: 450px; background: ${currentTheme.path}; border-radius: 15px; border: 10px solid rgba(255,255,255,0.3); overflow: hidden; }
        .cell { position: absolute; display: flex; align-items: center; justify-content: center; font-size: 30px; }
        .wall { background: ${currentTheme.wall}; border-radius: 4px; }
        .player { z-index: 10; transition: all 0.2s; font-size: 45px; }
        .controls { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 20px; }
        .btn { width: 70px; height: 70px; background: white; border: none; border-radius: 20px; font-size: 30px; box-shadow: 0 6px 0 #ccc; cursor: pointer; }
        .btn:active { transform: translateY(4px); box-shadow: none; }
        .feedback { margin-top: 15px; background: white; padding: 10px 30px; border-radius: 30px; font-size: 22px; font-weight: bold; }
      `}</style>

      <div style={{color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '10px'}}>
        🌍 Chủ đề: {currentTheme.name}
      </div>

      <div className="maze-board">
        {maze.map((row, rIdx) => row.map((cell, cIdx) => (
          <div key={`${rIdx}-${cIdx}`} className={`cell ${cell === 1 ? 'wall' : ''}`} style={{
            width: `${cellSize}%`, height: `${cellSize}%`,
            top: `${rIdx * cellSize}%`, left: `${cIdx * cellSize}%`
          }}>
            {cell === 3 ? currentTheme.end : ''}
          </div>
        )))}
        
        {/* Player */}
        <div className="cell player" style={{
          width: `${cellSize}%`, height: `${cellSize}%`,
          top: `${playerPosition[0] * cellSize}%`, left: `${playerPosition[1] * cellSize}%`
        }}>
          {currentTheme.player}
        </div>
      </div>

      <div className="controls">
        <div /> <button className="btn" onClick={() => movePlayer('up')}>🔼</button> <div />
        <button className="btn" onClick={() => movePlayer('left')}>◀️</button>
        <button className="btn" onClick={() => movePlayer('down')}>🔽</button>
        <button className="btn" onClick={() => movePlayer('right')}>▶️</button>
      </div>

      <div className="feedback">{feedback}</div>
    </div>
  );
};

export default G3_5_SimpleMaze;