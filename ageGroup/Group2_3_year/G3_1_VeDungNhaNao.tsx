import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SubGameProps } from '../../types';

const G3_SortingGame: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- KHO DỮ LIỆU ĐỒ VẬT ---
  const itemLibrary = useMemo(() => [
    { id: 'f1', emoji: '🍎', type: 'FRUIT', name: 'Quả táo' },
    { id: 'f2', emoji: '🍌', type: 'FRUIT', name: 'Quả chuối' },
    { id: 'f3', emoji: '🍇', type: 'FRUIT', name: 'Quả nho' },
    { id: 'f4', emoji: '🍓', type: 'FRUIT', name: 'Quả dâu' },
    { id: 'v1', emoji: '🚗', type: 'VEHICLE', name: 'Xe hơi' },
    { id: 'v2', emoji: '🚲', type: 'VEHICLE', name: 'Xe đạp' },
    { id: 'v3', emoji: '✈️', type: 'VEHICLE', name: 'Máy bay' },
    { id: 'v4', emoji: '🚢', type: 'VEHICLE', name: 'Tàu thủy' },
  ], []);

  const GAME_DURATION = 180;

  // --- STATE ---
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [feedback, setFeedback] = useState('Bé hãy kéo đồ vật về đúng nhà nhé! 🏠');
  const [isDragging, setIsDragging] = useState(false);
  const [score, setScore] = useState(0);

  // Tạo đồ vật mới ngẫu nhiên
  const spawnItem = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * itemLibrary.length);
    setCurrentItem({ ...itemLibrary[randomIndex], key: Date.now() });
  }, [itemLibrary]);

  useEffect(() => {
    spawnItem();
  }, [spawnItem]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'vi-VN';
      msg.rate = 0.9;
      window.speechSynthesis.speak(msg);
    }
  };

  // --- XỬ LÝ KÉO THẢ ---
  const onDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData("itemType", currentItem.type);
    speak(currentItem.name);
  };

  const onDrop = (e: React.DragEvent, targetType: string) => {
    e.preventDefault();
    setIsDragging(false);
    const draggedType = e.dataTransfer.getData("itemType");

    if (draggedType === targetType) {
      setFeedback('Đúng rồi! Bé giỏi quá! ✨');
      setScore(s => s + 1);
      speak("Đúng rồi!");
      setCurrentItem(null);
      setTimeout(spawnItem, 1000);
    } else {
      setFeedback('Nhầm nhà rồi, bé chọn lại nhé! ❤️');
      speak("Không phải nhà này rồi");
    }
  };

  // --- RECORD AI DATA ---
  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      onFeatureCapture({
        timestamp: Date.now(),
        gazeX: aiData?.gazeX ?? 0.5,
        gazeY: aiData?.gazeY ?? 0.5,
        targetX: 50, targetY: 50,
        isLookingAtTarget: false,
        attentionLevel: aiData?.avgAttention ?? 0.5,
        affect: feedback.includes('Đúng') ? 'positive' : 'neutral',
        // Custom fields cho việc phân loại
        currentItemType: currentItem?.type || null,
        dragActive: isDragging,
        totalCorrect: score
      } as any);
    }, 300);
    return () => clearInterval(recordLoop);
  }, [onFeatureCapture, latestAIResult, currentItem, isDragging, feedback, score]);

  // --- GIAO DIỆN ---
  const styles = `
    .sort-container {
      width: 100%; height: 100%; position: relative;
      background: #E8F5E9; border-radius: 20px;
      display: flex; flex-direction: column; align-items: center; padding: 20px;
      overflow: hidden;
    }
    .progress-bar {
      width: 100%; height: 10px; background: #ddd; border-radius: 5px; margin-bottom: 20px;
    }
    .progress-fill {
      height: 100%; background: #4CAF50; width: ${(timeElapsed / GAME_DURATION) * 100}%;
    }
    .homes-row {
      display: flex; justify-content: space-between; width: 100%; flex: 1; align-items: center;
    }
    .home-box {
      width: 280px; height: 320px; border-radius: 40px;
      background: white; border: 6px dashed #999;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      transition: all 0.3s;
    }
    .home-box.active-drop { border-color: #4CAF50; background: #F1F8E9; transform: scale(1.05); }
    .home-icon { font-size: 80px; margin-bottom: 10px; }
    .home-label { font-size: 28px; font-weight: bold; color: #2E7D32; }

    .center-spawn {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      z-index: 10;
    }
    .draggable-item {
      font-size: 100px; cursor: grab;
      filter: drop-shadow(0 10px 15px rgba(0,0,0,0.2));
      animation: appear 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes appear {
      from { transform: scale(0) rotate(-20deg); opacity: 0; }
      to { transform: scale(1) rotate(0); opacity: 1; }
    }
    .feedback-bubble {
      margin-top: 20px; background: white; padding: 15px 40px;
      border-radius: 30px; font-size: 24px; font-weight: bold; color: #388E3C;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
  `;

  return (
    <div className="sort-container">
      <style>{styles}</style>

      <div className="progress-bar">
        <div className="progress-fill" />
      </div>

      <div className="homes-row">
        {/* Nhà Trái Cây */}
        <div 
          className={`home-box ${isDragging ? 'active-drop' : ''}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onDrop(e, 'FRUIT')}
        >
          <div className="home-icon">🍎</div>
          <div className="home-label">Nhà Trái Cây</div>
        </div>

        {/* Nhà Phương Tiện */}
        <div 
          className={`home-box ${isDragging ? 'active-drop' : ''}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onDrop(e, 'VEHICLE')}
        >
          <div className="home-icon">🚗</div>
          <div className="home-label">Nhà Xe Cộ</div>
        </div>
      </div>

      <div className="center-spawn">
        {currentItem && (
          <div 
            className="draggable-item"
            draggable
            onDragStart={onDragStart}
            onDragEnd={() => setIsDragging(false)}
          >
            {currentItem.emoji}
          </div>
        )}
      </div>

      <div className="feedback-bubble">{feedback}</div>
    </div>
  );
};

export default G3_SortingGame;