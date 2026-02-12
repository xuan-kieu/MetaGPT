import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SubGameProps } from '../../types';

type StepType = 'TAP' | 'DRAG_TO_BOX';

interface InstructionStep {
  type: StepType;
  targetId: string;
}

interface InstructionSet {
  id: number;
  text: string;
  steps: InstructionStep[];
}

const G4_4_InteractiveInstructions: React.FC<SubGameProps> = ({
  latestAIResult,
  onFeatureCapture,
  timeElapsed,
}) => {
  // ================= CSS =================
  const styles = `
    .inst-container {
      width: 100%; height: 100%; position: relative;
      background: #ECFDF5;
      display: flex; flex-direction: column;
      align-items: center; padding: 20px;
    }
    .speech-bubble {
      background: white;
      padding: 15px 30px;
      border-radius: 40px;
      font-size: 24px;
      font-weight: bold;
      color: #065F46;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      margin-bottom: 15px;
    }
    .inst-room {
      width: 90%; flex: 1;
      background: white;
      border-radius: 30px;
      border: 6px solid #10B981;
      position: relative;
      overflow: hidden;
      box-shadow: inset 0 4px 15px rgba(0,0,0,0.1);
    }
    .inst-object {
      position: absolute;
      font-size: 80px;
      cursor: pointer;
      transition: transform 0.2s, filter 0.2s;
      user-select: none;
      z-index: 10;
    }
    .inst-object.active {
      transform: scale(1.2);
      filter: drop-shadow(0 0 15px #F59E0B);
    }
    .inst-target-box {
      position: absolute;
      bottom: 20px; right: 20px;
      width: 150px; height: 150px;
      border: 4px dashed #10B981;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 60px;
    }
    .feedback {
      margin-top: 15px;
      font-size: 22px;
      font-weight: bold;
      color: #065F46;
    }
    .mic-status {
      margin-top: 10px;
      font-weight: bold;
      color: #EF4444;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `;

  // ================= OBJECT DATA =================
  const baseObjects = [
    { id: 'cat', emoji: '🐱' },
    { id: 'dog', emoji: '🐶' },
    { id: 'duck', emoji: '🦆' },
    { id: 'ball', emoji: '⚽' },
    { id: 'apple', emoji: '🍎' },
    { id: 'banana', emoji: '🍌' },
    { id: 'car', emoji: '🚗' },
    { id: 'box', emoji: '📦' },
  ];

  const randomPos = () => ({
    top: `${10 + Math.random() * 70}%`,
    left: `${10 + Math.random() * 70}%`,
  });

  const initObjects = () =>
    baseObjects.map(o => ({
      ...o,
      initialPos: randomPos(),
    }));

  // ================= INSTRUCTION SETS =================
  const instructionSets: InstructionSet[] = useMemo(() => [
    {
      id: 1,
      text: 'Chạm vào con mèo, sau đó kéo quả bóng vào giỏ!',
      steps: [
        { type: 'TAP', targetId: 'cat' },
        { type: 'DRAG_TO_BOX', targetId: 'ball' },
      ],
    },
    {
      id: 2,
      text: 'Chạm vào quả táo, rồi kéo quả chuối vào giỏ!',
      steps: [
        { type: 'TAP', targetId: 'apple' },
        { type: 'DRAG_TO_BOX', targetId: 'banana' },
      ],
    },
    {
      id: 3,
      text: 'Chạm vào con chó, con mèo, rồi quả bóng!',
      steps: [
        { type: 'TAP', targetId: 'dog' },
        { type: 'TAP', targetId: 'cat' },
        { type: 'TAP', targetId: 'ball' },
      ],
    },
    {
      id: 4,
      text: 'Chạm vào con vịt, chiếc xe, rồi quả táo!',
      steps: [
        { type: 'TAP', targetId: 'duck' },
        { type: 'TAP', targetId: 'car' },
        { type: 'TAP', targetId: 'apple' },
      ],
    },
    {
      id: 5,
      text: 'Chạm vào chiếc xe, rồi kéo con chó vào giỏ!',
      steps: [
        { type: 'TAP', targetId: 'car' },
        { type: 'DRAG_TO_BOX', targetId: 'dog' },
      ],
    },
    {
      id: 6,
      text: 'Chạm vào quả chuối, con mèo, rồi kéo quả bóng vào giỏ!',
      steps: [
        { type: 'TAP', targetId: 'banana' },
        { type: 'TAP', targetId: 'cat' },
        { type: 'DRAG_TO_BOX', targetId: 'ball' },
      ],
    },
    {
      id: 7,
      text: 'Chạm vào con chó, quả táo, con vịt, rồi kéo chiếc hộp vào giỏ!',
      steps: [
        { type: 'TAP', targetId: 'dog' },
        { type: 'TAP', targetId: 'apple' },
        { type: 'TAP', targetId: 'duck' },
        { type: 'DRAG_TO_BOX', targetId: 'box' },
      ],
    },
  ], []);

  // ================= STATE =================
  const [currentSetIdx, setCurrentSetIdx] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [objects, setObjects] = useState(initObjects());
  const [feedback, setFeedback] = useState('Lắng nghe chỉ dẫn nhé!');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [echolaliaDetected, setEcholaliaDetected] = useState(false);

  const currentSet = instructionSets[currentSetIdx];

  // ================= SPEECH =================
  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'vi-VN';
    msg.rate = 0.8;
    msg.onstart = () => setIsSpeaking(true);
    msg.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(msg);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => speak(currentSet.text), 800);
    return () => clearTimeout(t);
  }, [currentSet, speak]);

  // ================= INTERACTION =================
  const handleInteract = (id: string, action: StepType) => {
    if (isSpeaking) return;

    const required = currentSet.steps[currentStepIdx];

    if (id === required.targetId && action === required.type) {
      if (currentStepIdx + 1 < currentSet.steps.length) {
        setCurrentStepIdx(prev => prev + 1);
        setFeedback('Tiếp theo nào...');
      } else {
        setFeedback('Xuất sắc! Con làm đúng hết rồi!');
        speak('Giỏi quá!');
        setTimeout(() => {
          setCurrentSetIdx(prev => (prev + 1) % instructionSets.length);
          setCurrentStepIdx(0);
          setObjects(initObjects());
        }, 2500);
      }
    } else {
      setFeedback('Chưa đúng rồi, nghe lại nhé!');
      speak(currentSet.text);
      setCurrentStepIdx(0);
    }
  };

  // ================= AI TRACKING =================
  useEffect(() => {
    const loop = setInterval(() => {
      const ai = latestAIResult.current?.features;
      const speakingNow = ai?.isSpeaking ?? false;

      if (speakingNow && !isSpeaking) {
        setEcholaliaDetected(true);
      }

      onFeatureCapture({
        timestamp: Date.now(),
        gazeX: ai?.gazeX ?? 0.5,
        gazeY: ai?.gazeY ?? 0.5,
        currentStep: currentStepIdx,
        isFollowingOrder: true,
        echolaliaDetected,
        attentionLevel: ai?.avgAttention ?? 0.5,
        reactionTime: timeElapsed,
        isSpeaking: speakingNow,
      } as any);
    }, 200);

    return () => clearInterval(loop);
  }, [
    latestAIResult,
    onFeatureCapture,
    currentStepIdx,
    echolaliaDetected,
    isSpeaking,
    timeElapsed,
  ]);

  // ================= RENDER =================
  return (
    <div className="inst-container">
      <style>{styles}</style>

      <div className="speech-bubble">{currentSet.text}</div>

      <div className="inst-room">
        {objects.map(obj => (
          <div
            key={obj.id}
            className={`inst-object ${
              currentSet.steps[currentStepIdx]?.targetId === obj.id
                ? 'active'
                : ''
            }`}
            style={obj.initialPos}
            onClick={() => handleInteract(obj.id, 'TAP')}
            draggable
            onDragEnd={e => {
              if (
                e.clientX > window.innerWidth * 0.7 &&
                e.clientY > window.innerHeight * 0.6
              ) {
                handleInteract(obj.id, 'DRAG_TO_BOX');
              }
            }}
          >
            {obj.emoji}
          </div>
        ))}
        <div className="inst-target-box">🧺</div>
      </div>

      <div className="feedback">{feedback}</div>

      {latestAIResult.current?.features?.isSpeaking && (
        <div className="mic-status">
          🎤 Tớ đang nghe con nói...
        </div>
      )}
    </div>
  );
};

export default G4_4_InteractiveInstructions;
