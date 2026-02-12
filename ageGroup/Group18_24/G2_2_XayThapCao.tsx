import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SubGameProps } from '../../types';

type GamePhase = 'DEMO' | 'PLAY';

interface Block {
  id: number;
  name: string;
  emoji: string;
  color: string;
}

const G2_2_XayThapCao: React.FC<SubGameProps> = ({
  latestAIResult,
  onFeatureCapture,
  timeElapsed,
}) => {
  // ================= CSS =================
  const styles = `
    .xaythap-container {
      width: 100%; height: 100%;
      background: linear-gradient(180deg, #E3F2FD, #FFF9C4);
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }

    .guide-character {
      position: absolute;
      top: 20px;
      left: 20px;
      font-size: 80px;
    }

    .xaythap-stage {
      flex: 1;
      width: 100%;
      display: flex;
      flex-direction: column-reverse;
      align-items: center;
      padding-bottom: 20px;
    }

    .xaythap-block {
      height: 50px;
      margin-bottom: 4px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      color: white;
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      animation: drop 0.3s ease-out;
    }

    @keyframes drop {
      from { transform: translateY(-80px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .xaythap-panel {
      height: 160px;
      width: 100%;
      background: white;
      display: flex;
      justify-content: center;
      gap: 30px;
      padding: 10px;
      border-top: 5px solid #FF9800;
    }

    .xaythap-item {
      width: 90px;
      height: 90px;
      border-radius: 20px;
      font-size: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
    }

    .instruction {
      position: absolute;
      top: 120px;
      font-size: 34px;
      font-weight: bold;
      color: #FF5722;
    }
  `;

  // ================= DATA =================
  const blockOptions = useMemo<Block[]>(() => [
    { id: 1, name: 'Khối đỏ', emoji: '🟥', color: '#F44336' },
    { id: 2, name: 'Khối xanh', emoji: '🟦', color: '#2196F3' },
    { id: 3, name: 'Khối vàng', emoji: '🟨', color: '#FFEB3B' },
    { id: 4, name: 'Khối lá', emoji: '🟩', color: '#4CAF50' },
  ], []);

  const demoSequence = [blockOptions[0], blockOptions[1], blockOptions[2]];

  // ================= STATE =================
  const [phase, setPhase] = useState<GamePhase>('DEMO');
  const [tower, setTower] = useState<Block[]>([]);
  const [childActions, setChildActions] = useState<any[]>([]);
  const draggedBlock = useRef<Block | null>(null);

  // ================= SPEECH =================
  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'vi-VN';
    msg.rate = 0.9;
    window.speechSynthesis.speak(msg);
  };

  // ================= DEMO LOGIC =================
  useEffect(() => {
    if (phase !== 'DEMO') return;

    speak('Cô làm mẫu cho con xem nhé');

    demoSequence.forEach((block, idx) => {
      setTimeout(() => {
        setTower(prev => [...prev, block]);
        speak(block.name);
      }, 1200 * (idx + 1));
    });

    setTimeout(() => {
      speak('Bây giờ đến lượt con nhé!');
      setTower([]);
      setPhase('PLAY');
    }, 5000);
  }, [phase]);

  // ================= DRAG & DROP =================
  const handleDrop = () => {
    if (!draggedBlock.current) return;

    const block = draggedBlock.current;
    setTower(prev => [...prev, block]);

    setChildActions(prev => [
      ...prev,
      {
        block: block.name,
        order: prev.length,
        correct: demoSequence[prev.length]?.id === block.id,
        timestamp: Date.now(),
      },
    ]);

    draggedBlock.current = null;
  };

  // ================= AI TRACKING =================
  useEffect(() => {
    const interval = setInterval(() => {
      const ai = latestAIResult.current?.features;

      onFeatureCapture({
        timestamp: Date.now(),
        phase,
        gazeX: ai?.gazeX ?? 0.5,
        gazeY: ai?.gazeY ?? 0.5,
        lookingAtGuide: phase === 'DEMO',
        currentTowerHeight: tower.length,
        childActions,
        attentionLevel: ai?.avgAttention ?? 0.5,
      } as any);
    }, 200);

    return () => clearInterval(interval);
  }, [phase, tower, childActions, latestAIResult, onFeatureCapture]);

  // ================= RENDER =================
  return (
    <div className="xaythap-container">
      <style>{styles}</style>

      {phase === 'DEMO' && <div className="guide-character">🤖</div>}

      <div className="instruction">
        {phase === 'DEMO'
          ? 'Cô đang xếp tháp...'
          : 'Con kéo khối để xây tháp nhé!'}
      </div>

      <div
        className="xaythap-stage"
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        {tower.map((block, idx) => (
          <div
            key={idx}
            className="xaythap-block"
            style={{
              backgroundColor: block.color,
              width: `${240 - idx * 20}px`,
            }}
          >
            {block.emoji}
          </div>
        ))}
      </div>

      <div className="xaythap-panel">
        {blockOptions.map(block => (
          <div
            key={block.id}
            className="xaythap-item"
            style={{ backgroundColor: block.color }}
            draggable={phase === 'PLAY'}
            onDragStart={() => (draggedBlock.current = block)}
          >
            {block.emoji}
          </div>
        ))}
      </div>
    </div>
  );
};

export default G2_2_XayThapCao;
