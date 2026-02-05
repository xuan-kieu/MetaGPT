import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G2_2_XayThapCao: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- KHAI BÁO BIẾN CỐ ĐỊNH ---
  const GAME_DURATION = 180; // Thêm dòng này để fix lỗi "Cannot find name"

  // --- CSS NÂNG CẤP ---
  const styles = `
    .xaythap-container {
      width: 100%; height: 100%; position: relative;
      background: linear-gradient(180deg, #E3F2FD 0%, #FFF9C4 100%);
      border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; align-items: center;
    }
    .xaythap-timer {
      position: absolute; top: 20px; right: 20px;
      background: rgba(0, 0, 0, 0.5); color: white; padding: 8px 15px; border-radius: 20px; font-size: 18px; z-index: 10;
    }
    .xaythap-mascot {
      position: absolute; left: 50px; top: 100px; font-size: 80px; transition: all 0.5s ease-in-out;
      z-index: 5;
    }
    .xaythap-stage {
      flex: 1; width: 100%; position: relative;
      display: flex; flex-direction: column-reverse; align-items: center; padding-bottom: 20px;
      margin-bottom: 10px;
    }
    .xaythap-block {
      width: 220px; height: 50px; border-radius: 12px; margin-bottom: 4px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; color: white; box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      transition: all 0.3s;
    }
    .xaythap-ground {
      width: 320px; height: 30px; background: #8B4513; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;
    }
    .xaythap-panel {
      width: 100%; height: 180px; background: rgba(255,255,255,0.9);
      display: flex; justify-content: center; align-items: center; gap: 20px; 
      padding: 10px; border-top: 4px solid #FFCC80;
    }
    .xaythap-item {
      width: 80px; height: 80px; border-radius: 15px;
      display: flex; align-items: center; justify-content: center;
      font-size: 40px; cursor: grab; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }
    .xaythap-instruction {
      position: absolute; top: 40px; font-size: 28px; font-weight: bold; color: #FF5722;
      background: white; padding: 10px 30px; border-radius: 40px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      z-index: 10;
    }
    .drop-zone-active { background: rgba(76, 175, 80, 0.15); border: 4px dashed #4CAF50; border-radius: 20px; }
  `;

  // --- STATE ---
  const [gameState, setGameState] = useState<'MODELING' | 'PLAYING'>('MODELING');
  const [tower, setTower] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [mascotPos, setMascotPos] = useState({ x: 50, y: 100 });

  const blockOptions = useMemo(() => [
    { type: 'RED', emoji: "🟥", color: "#F44336", name: "Khối đỏ" },
    { type: 'BLUE', emoji: "🟦", color: "#2196F3", name: "Khối xanh" },
    { type: 'YELLOW', emoji: "🟨", color: "#FFEB3B", name: "Khối vàng" },
    { type: 'GREEN', emoji: "🟩", color: "#4CAF50", name: "Khối lá" }
  ], []);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'vi-VN';
      msg.rate = 0.9;
      window.speechSynthesis.speak(msg);
    }
  }, []);

  // --- LOGIC GIAI ĐOẠN LÀM MẪU ---
  useEffect(() => {
    let active = true;
    if (gameState === 'MODELING') {
      const runDemo = async () => {
        if (!active) return;
        speak("Bạn Gấu xem này, tớ xây tháp nhé!");
        await new Promise(r => setTimeout(r, 2500));

        for (let i = 0; i < 3; i++) {
          if (!active) break;
          const opt = blockOptions[i];
          setMascotPos({ x: 200, y: 150 }); // Di chuyển gấu lại gần tháp
          speak(opt.name);
          setTower(prev => [...prev, { ...opt, id: `demo-${i}` }]);
          await new Promise(r => setTimeout(r, 1800));
        }

        if (active) {
          speak("Đến lượt con đấy! Con xây tháp giống tớ nhé.");
          setTimeout(() => {
            setTower([]); 
            setGameState('PLAYING');
            setMascotPos({ x: 50, y: 100 });
          }, 1500);
        }
      };
      runDemo();
    }
    return () => { active = false; };
  }, [gameState, blockOptions, speak]);

  // --- DRAG & DROP ---
  const onDragStart = (e: React.DragEvent, opt: any) => {
    if (gameState !== 'PLAYING') return;
    e.dataTransfer.setData("blockType", opt.type);
    setIsDragging(true);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (gameState !== 'PLAYING') return;

    const type = e.dataTransfer.getData("blockType");
    const option = blockOptions.find(o => o.type === type);
    
    if (option) {
      setTower(prev => [...prev, { ...option, id: Date.now() }]);
      speak(option.name);
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
        targetX: 50, targetY: 50,
        gameState: gameState,
        isLookingAtMascot: gx < 0.3 && gy < 0.4,
        isLookingAtTower: gx > 0.3 && gx < 0.7,
        handDetected: aiData?.handDetected ?? false,
        dragActive: isDragging,
        towerHeight: tower.length
      } as any);
    }, 100);
    return () => clearInterval(recordLoop);
  }, [onFeatureCapture, latestAIResult, tower, gameState, isDragging]);

  return (
    <div className="xaythap-container">
      <style>{styles}</style>

      <div className="xaythap-timer">⏱️ {timeElapsed}s / {GAME_DURATION}s</div>

      <div className="xaythap-instruction">
        {gameState === 'MODELING' ? "Nhìn tớ làm mẫu nhé!" : "Con hãy kéo khối vào tháp!"}
      </div>

      <div 
        className="xaythap-mascot"
        style={{ left: mascotPos.x, top: mascotPos.y }}
      >
        {gameState === 'MODELING' ? "🐻" : "🐨"}
      </div>

      <div 
        className={`xaythap-stage ${isDragging ? 'drop-zone-active' : ''}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <div className="xaythap-ground">NỀN THÁP</div>
        {tower.map((block, idx) => (
          <div 
            key={block.id} 
            className="xaythap-block"
            style={{ 
              backgroundColor: block.color,
              width: `${240 - (idx * 15)}px`,
            }}
          >
            {block.emoji}
          </div>
        ))}
      </div>

      <div className="xaythap-panel">
        {blockOptions.map((opt, idx) => (
          <div 
            key={idx} 
            className="xaythap-item"
            style={{ 
              backgroundColor: opt.color,
              opacity: gameState === 'MODELING' ? 0.4 : 1,
              cursor: gameState === 'MODELING' ? 'default' : 'grab'
            }}
            draggable={gameState === 'PLAYING'}
            onDragStart={(e) => onDragStart(e, opt)}
            onDragEnd={() => setIsDragging(false)}
          >
            {opt.emoji}
          </div>
        ))}
      </div>
    </div>
  );
};

export default G2_2_XayThapCao;