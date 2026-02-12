import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G4_5_DecodeRule: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
  childName
}) => {
  // --- CSS ---
  const styles = `
    .decode-game-container {
      width: 100%; height: 100%; position: relative;
      background: #FFFAF0; border-radius: 20px; overflow: hidden;
      display: flex; flex-direction: column; align-items: center; padding: 20px;
      border: 8px solid #FFD700;
    }
    .decode-title {
      font-size: 36px; font-weight: bold; color: #FF4500; margin-bottom: 20px;
      text-shadow: 2px 2px 0px #fff;
    }
    .decode-examples {
      background: white; padding: 30px; border-radius: 30px;
      display: flex; gap: 15px; box-shadow: 0 10px 20px rgba(0,0,0,0.05);
      border: 4px solid #87CEEB; margin-bottom: 30px;
    }
    .item-box {
      font-size: 60px; width: 90px; height: 90px;
      display: flex; align-items: center; justify-content: center;
      background: #F0F8FF; border-radius: 20px;
    }
    .question-box {
      background: #FFFACD; border: 4px dashed #FF4500;
      animation: bounce 1s infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    .decode-choices {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
    }
    .choice-btn {
      font-size: 60px; width: 110px; height: 110px;
      background: white; border: 4px solid #FFA500; border-radius: 25px;
      cursor: pointer; transition: transform 0.2s;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 0 #FFA500;
    }
    .choice-btn:active { transform: translateY(6px); box-shadow: none; }
    .feedback-text {
      margin-top: 30px; font-size: 28px; font-weight: bold; color: #4B5563;
      min-height: 40px; text-align: center;
    }
  `;

  // --- QUY TẮC ĐƠN GIẢN ---
  const simplePatterns = useMemo(() => [
    { id: 1, name: "AB", description: "Bé tìm hình xen kẽ nhé", examples: ["🔴", "🔵", "🔴", "🔵"], options: ["🔴", "🔵", "🟡"], correct: "🔴" },
    { id: 2, name: "ABB", description: "Hai bạn xanh sau một bạn đỏ", examples: ["🍎", "🍐", "🍐", "🍎"], options: ["🍎", "🍐", "🍇"], correct: "🍐" },
    { id: 3, name: "Animal", description: "Bạn nào đứng tiếp theo nhỉ?", examples: ["🐶", "🐱", "🐶", "🐱"], options: ["🐶", "🐱", "🐭"], correct: "🐶" },
    { id: 4, name: "Size", description: "Hình to rồi đến hình nhỏ", examples: ["🐘", "🐭", "🐘", "🐭"], options: ["🐘", "🐭", "🐰"], correct: "🐘" },
    { id: 5, name: "Fruit", description: "Chu kỳ trái cây", examples: ["🍌", "🍓", "🍌", "🍓"], options: ["🍌", "🍓", "🍊"], correct: "🍌" },
    
    { id: 6, name: "AAB", description: "Hai giống, một khác", examples: ["⭐", "⭐", "🌙", "⭐", "⭐"], options: ["⭐", "🌙", "☀️"], correct: "🌙" },
    { id: 7, name: "Color Pattern", description: "Màu sắc luân phiên", examples: ["🟥", "🟨", "🟥", "🟨"], options: ["🟥", "🟨", "🟩"], correct: "🟥" },
    { id: 8, name: "Shape Pattern", description: "Hình dạng lặp lại", examples: ["🟦", "🔺", "🟦", "🔺"], options: ["🟦", "🔺", "🔴"], correct: "🟦" },
    { id: 9, name: "Transport", description: "Phương tiện giao thông", examples: ["🚗", "🚌", "🚗", "🚌"], options: ["🚗", "🚌", "🚲"], correct: "🚗" },
    { id: 10, name: "Weather", description: "Thời tiết thay đổi", examples: ["☀️", "☁️", "☀️", "☁️"], options: ["☀️", "☁️", "⛈️"], correct: "☀️" },
    
    { id: 11, name: "Food", description: "Đồ ăn yêu thích", examples: ["🍕", "🍦", "🍕", "🍦"], options: ["🍕", "🍦", "🍎"], correct: "🍕" },
    { id: 12, name: "Animal Sound", description: "Tiếng kêu của bạn nào?", examples: ["🐶", "🐱", "🐶", "🐱"], options: ["🐶", "🐱", "🐮"], correct: "🐶" },
    { id: 13, name: "ABC", description: "Mẫu ba bước", examples: ["🔴", "🟡", "🔵", "🔴", "🟡"], options: ["🔴", "🟡", "🔵"], correct: "🔵" },
    { id: 14, name: "Flower", description: "Hoa nở rộ", examples: ["🌻", "🌹", "🌻", "🌹"], options: ["🌻", "🌹", "🌸"], correct: "🌻" },
    { id: 15, name: "Sea Animal", description: "Bạn dưới biển", examples: ["🐠", "🐙", "🐠", "🐙"], options: ["🐠", "🐙", "🦈"], correct: "🐠" },
    
    { id: 16, name: "Face", description: "Cảm xúc thay đổi", examples: ["😊", "😢", "😊", "😢"], options: ["😊", "😢", "😠"], correct: "😊" },
    { id: 17, name: "Direction", description: "Hướng mũi tên", examples: ["⬆️", "➡️", "⬆️", "➡️"], options: ["⬆️", "➡️", "⬇️"], correct: "⬆️" },
    { id: 18, name: "Number", description: "Đếm số đơn giản", examples: ["1️⃣", "2️⃣", "1️⃣", "2️⃣"], options: ["1️⃣", "2️⃣", "3️⃣"], correct: "1️⃣" },
    { id: 19, name: "Clothing", description: "Quần áo theo mùa", examples: ["👕", "👖", "👕", "👖"], options: ["👕", "👖", "🧥"], correct: "👕" },
    { id: 20, name: "Sports", description: "Môn thể thao", examples: ["⚽", "🏀", "⚽", "🏀"], options: ["⚽", "🏀", "🎾"], correct: "⚽" },
    
    { id: 21, name: "Music", description: "Nhạc cụ vui tai", examples: ["🎹", "🥁", "🎹", "🥁"], options: ["🎹", "🥁", "🎸"], correct: "🎹" },
    { id: 22, name: "Season", description: "Các mùa trong năm", examples: ["🌸", "☀️", "🍂", "❄️", "🌸"], options: ["🌸", "☀️", "🍂"], correct: "☀️" },
    { id: 23, name: "Time", description: "Thời gian trong ngày", examples: ["🌅", "🌞", "🌅", "🌞"], options: ["🌅", "🌞", "🌙"], correct: "🌅" },
    { id: 24, name: "Building", description: "Công trình xây dựng", examples: ["🏠", "🏢", "🏠", "🏢"], options: ["🏠", "🏢", "🏫"], correct: "🏠" },
    { id: 25, name: "Nature", description: "Thiên nhiên tươi đẹp", examples: ["🌳", "🌺", "🌳", "🌺"], options: ["🌳", "🌺", "🌱"], correct: "🌳" }
  ], []);

  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [msg, setMsg] = useState("Chào bé! Hãy giúp tớ giải mã nhé!");

  const current = simplePatterns[round % simplePatterns.length];

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleChoice = (emoji: string) => {
    if (selected) return;
    setSelected(emoji);
    if (emoji === current.correct) {
      setMsg("Tuyệt vời! Bé giỏi quá! 🎉");
      speak("Tuyệt vời! Bé giỏi quá!");
      setTimeout(() => {
        setRound(r => r + 1);
        setSelected(null);
        setMsg("Cùng thử câu tiếp theo nào!");
      }, 2000);
    } else {
      setMsg("Ơ, thử lại một lần nữa nhé! 🤔");
      speak("Bé thử lại một lần nữa xem");
      setTimeout(() => setSelected(null), 1500);
    }
  };

  // --- AI TRACKING ---
  useEffect(() => {
    const interval = setInterval(() => {
      const ai = latestAIResult.current?.features;
      onFeatureCapture({
        timestamp: Date.now(),
        gazeX: ai?.gazeX ?? 0.5,
        gazeY: ai?.gazeY ?? 0.5,
        attentionLevel: ai?.avgAttention ?? 0.5,
        smileIntensity: ai?.avgSmile ?? 0,
        frownIntensity: ai?.avgFrown ?? 0,
        affect: selected === current.correct ? 'positive' : 'neutral',
        poseConfidence: ai?.faceDetectionConfidence ?? 0,
        faceConfidence: ai?.faceConfidence ?? 0,
        anticipation: false,
        childVocalization: ai?.isSpeaking ?? false,
        gameId: 'G4.5',
        childName
      } as BehavioralFeature);
    }, 200);
    return () => clearInterval(interval);
  }, [selected, current, onFeatureCapture, latestAIResult, childName]);

  return (
    <div className="decode-game-container">
      <style>{styles}</style>
      
      <div className="decode-title">🧩 Giải Mã Tí Hon</div>
      
      <div style={{fontSize: '22px', marginBottom: '10px', fontWeight: 'bold', color: '#555'}}>
        Câu hỏi số {round + 1}
      </div>

      <div className="decode-examples">
        {current.examples.map((ex, i) => (
          <div key={i} className="item-box">{ex}</div>
        ))}
        <div className="item-box question-box">❓</div>
      </div>

      <div className="decode-choices">
        {current.options.map((opt, i) => (
          <button 
            key={i} 
            className="choice-btn"
            onClick={() => handleChoice(opt)}
            disabled={!!selected}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="feedback-text">{msg}</div>
      
      <div style={{position: 'absolute', bottom: 20, right: 20, opacity: 0.6}}>
        ⏱️ {timeElapsed}s
      </div>
    </div>
  );
};

export default G4_5_DecodeRule;