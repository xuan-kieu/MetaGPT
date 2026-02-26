import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G4_1_WhySoSocial: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- CSS TỐI ƯU CHO TÌNH HUỐNG XÃ HỘI ---
  const styles = `
    .social-game-container {
      width: 100%; height: 100%; position: relative;
      background: #F0F9FF; display: flex; flex-direction: column; align-items: center; padding: 20px;
    }
    .scenario-image-box {
      width: 450px; height: 280px; background: white; border-radius: 30px;
      display: flex; align-items: center; justify-content: center;
      position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 8px solid #BAE6FD;
      margin-bottom: 20px;
    }
    .main-emoji { font-size: 150px; }
    .secondary-emoji { position: absolute; font-size: 80px; }
    
    /* Vùng nhận diện nhìn vào (Gaze Targets) */
    .target-face { position: absolute; width: 120px; height: 120px; border-radius: 50%; z-index: 5; }
    .target-object { position: absolute; width: 100px; height: 100px; z-index: 5; }

    .question-box {
      background: white; padding: 15px 30px; border-radius: 20px;
      font-size: 26px; font-weight: bold; color: #0369A1; text-align: center;
      margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .options-row { display: flex; gap: 20px; width: 100%; justify-content: center; }
    .option-card {
      background: white; border-radius: 25px; padding: 20px; width: 280px;
      cursor: pointer; border: 6px solid white; transition: all 0.2s;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      box-shadow: 0 6px 15px rgba(0,0,0,0.1);
    }
    .option-card.correct { border-color: #4ADE80; background: #F0FDF4; }
    .option-card.incorrect { border-color: #F87171; background: #FEF2F2; animation: shake 0.5s; }
    
    @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
  `;

  // --- DỮ LIỆU TÌNH HUỐNG XÃ HỘI ---
  const scenarios = useMemo(() => [
    {
      id: 1,
      mainEmoji: "😢", 
      objectEmoji: "🍦",
      objectPos: { right: '40px', bottom: '40px' },
      facePos: { left: '35%', top: '25%' },
      scenario: "Bạn nhỏ đang khóc, bên cạnh có một cây kem bị rơi.",
      question: "Vì sao bạn ấy buồn thế nhỉ?",
      options: [
        { text: "Vì bạn bị rơi kem", emoji: "🍦", correct: true },
        { text: "Vì trời đang nắng", emoji: "☀️", correct: false },
        { text: "Vì cái cây màu xanh", emoji: "🌳", correct: false }
      ]
    },
    {
      id: 2,
      mainEmoji: "🎁", 
      objectEmoji: "🥰",
      objectPos: { left: '40px', top: '40px' },
      facePos: { right: '30%', top: '25%' },
      scenario: "Bạn nhỏ được mẹ tặng một hộp quà thật to.",
      question: "Bạn nhỏ cảm thấy thế nào?",
      options: [
        { text: "Bạn rất vui và bất ngờ", emoji: "🎉", correct: true },
        { text: "Bạn đang buồn ngủ", emoji: "😴", correct: false },
        { text: "Hộp quà có màu đỏ", emoji: "🟥", correct: false }
      ]
    },
    {
      id: 3,
      mainEmoji: "😠", 
      objectEmoji: "🧱",
      objectPos: { left: '30px', bottom: '40px' },
      facePos: { right: '35%', top: '25%' },
      scenario: "Một bạn khác vừa làm đổ tháp đồ chơi của bạn.",
      question: "Theo con, vì sao bạn ấy giận?",
      options: [
        { text: "Vì tháp bị đổ mất rồi", emoji: "🏗️", correct: true },
        { text: "Vì bạn thích ngồi sàn", emoji: "🏢", correct: false },
        { text: "Vì bạn đang đói", emoji: "🍪", correct: false }
      ]
    },
      {
        id: 4,
        mainEmoji: "😨",
        objectEmoji: "🐕",
        objectPos: { right: '30px', bottom: '30px' },
        facePos: { left: '40%', top: '20%' },
        scenario: "Một chú chó to đang chạy về phía bạn nhỏ.",
        question: "Bạn ấy đang cảm thấy thế nào?",
        options: [
          { text: "Bạn ấy hơi sợ", emoji: "😰", correct: true },
          { text: "Bạn ấy muốn ăn kem", emoji: "🍦", correct: false },
          { text: "Bạn ấy đang rất vui", emoji: "😂", correct: false }
        ]
      },
      {
        id: 5,
        mainEmoji: "🥱",
        objectEmoji: "🛏️",
        objectPos: { left: '50px', bottom: '40px' },
        facePos: { right: '30%', top: '30%' },
        scenario: "Đã đến giờ ngủ trưa, bạn nhỏ đang trên giường.",
        question: "Vì sao bạn ấy ngáp ngắn ngáp dài?",
        options: [
          { text: "Vì bạn ấy buồn ngủ", emoji: "💤", correct: true },
          { text: "Vì bạn ấy đang hát", emoji: "🎤", correct: false },
          { text: "Vì bạn ấy thấy con mèo", emoji: "🐱", correct: false }
        ]
      },
      {
        id: 6,
        mainEmoji: "🤢",
        objectEmoji: "💊",
        objectPos: { right: '40px', top: '40px' },
        facePos: { left: '35%', top: '25%' },
        scenario: "Bạn nhỏ phải uống thuốc đắng.",
        question: "Cảm giác của bạn ấy thế nào?",
        options: [
          { text: "Thuốc đắng làm bạn khó chịu", emoji: "🤮", correct: true },
          { text: "Bạn ấy thích uống thuốc", emoji: "😋", correct: false },
          { text: "Bạn ấy đang đánh răng", emoji: "🪥", correct: false }
        ]
      },
      {
        id: 7,
        mainEmoji: "🤗",
        objectEmoji: "👨‍👦",
        objectPos: { left: '40px', top: '30px' },
        facePos: { right: '30%', bottom: '30%' },
        scenario: "Bố của bạn nhỏ vừa đi công tác về.",
        question: "Tại sao bạn ấy ôm bố chặt thế?",
        options: [
          { text: "Vì bạn nhớ bố rất nhiều", emoji: "❤️", correct: true },
          { text: "Vì bạn muốn đi chơi công viên", emoji: "🎠", correct: false },
          { text: "Vì bố đang đọc sách", emoji: "📚", correct: false }
        ]
      },
      {
        id: 8,
        mainEmoji: "😰",
        objectEmoji: "⛈️",
        objectPos: { right: '30px', top: '30px' },
        facePos: { left: '40%', bottom: '30%' },
        scenario: "Trời đang mưa to, sấm chớp ầm ầm.",
        question: "Vì sao bạn ấy trùm chăn kín vậy?",
        options: [
          { text: "Vì bạn sợ tiếng sấm", emoji: "⚡", correct: true },
          { text: "Vì bạn đang chơi trốn tìm", emoji: "👻", correct: false },
          { text: "Vì bạn muốn ngắm mưa", emoji: "🌧️", correct: false }
        ]
      },
      {
        id: 9,
        mainEmoji: "😞",
        objectEmoji: "🚗",
        objectPos: { left: '50px', bottom: '40px' },
        facePos: { right: '35%', top: '25%' },
        scenario: "Bạn chơi thân của bạn nhỏ vừa chuyển nhà đi xa.",
        question: "Tâm trạng của bạn ấy thế nào?",
        options: [
          { text: "Bạn ấy buồn vì nhớ bạn", emoji: "💔", correct: true },
          { text: "Bạn ấy muốn đi xe đạp", emoji: "🚲", correct: false },
          { text: "Bạn ấy thích chiếc ô tô", emoji: "🚙", correct: false }
        ]
      },
      {
        id: 10,
        mainEmoji: "🤫",
        objectEmoji: "🎭",
        objectPos: { right: '40px', top: '40px' },
        facePos: { left: '30%', bottom: '30%' },
        scenario: "Ở rạp hát, mọi người đang xem kịch.",
        question: "Tại sao bạn ấy lại đặt ngón tay lên miệng?",
        options: [
          { text: "Để giữ yên lặng cho mọi người xem kịch", emoji: "🙊", correct: true },
          { text: "Vì bạn ấy đói bụng", emoji: "🍕", correct: false },
          { text: "Vì bạn ấy đang hắt xì", emoji: "🤧", correct: false }
        ]
      },
      {
        id: 11,
        mainEmoji: "😲",
        objectEmoji: "🎂",
        objectPos: { left: '40px', top: '40px' },
        facePos: { right: '35%', bottom: '25%' },
        scenario: "Mẹ bất ngờ mang ra một chiếc bánh sinh nhật thật to.",
        question: "Biểu cảm của bạn ấy nói lên điều gì?",
        options: [
          { text: "Bạn ấy rất ngạc nhiên và vui sướng", emoji: "🎉", correct: true },
          { text: "Bạn ấy không thích ăn bánh", emoji: "👎", correct: false },
          { text: "Bạn ấy đang tìm mũ", emoji: "🧢", correct: false }
        ]
      },
      {
        id: 12,
        mainEmoji: "😖",
        objectEmoji: "🧦",
        objectPos: { right: '30px', bottom: '40px' },
        facePos: { left: '40%', top: '30%' },
        scenario: "Bạn nhỏ không thể đi giày vì thiếu một chiếc tất.",
        question: "Bạn ấy cảm thấy thế nào?",
        options: [
          { text: "Bực bội vì không tìm thấy tất", emoji: "🧦", correct: true },
          { text: "Muốn đi chân đất ra ngoài", emoji: "🦶", correct: false },
          { text: "Thích ngồi một chỗ", emoji: "🪑", correct: false }
        ]
      },
      {
        id: 13,
        mainEmoji: "🤭",
        objectEmoji: "🍪",
        objectPos: { left: '40px', bottom: '30px' },
        facePos: { right: '35%', top: '25%' },
        scenario: "Bạn nhỏ lén lấy một chiếc bánh quy trong lọ.",
        question: "Tại sao bạn ấy lại cười một mình thế?",
        options: [
          { text: "Vì bạn vừa lấy được bánh mà chưa ai biết", emoji: "😼", correct: true },
          { text: "Vì bạn thích cái lọ", emoji: "🫙", correct: false },
          { text: "Vì bạn đang xem phim hài", emoji: "📺", correct: false }
        ]
      },
      {
        id: 14,
        mainEmoji: "😣",
        objectEmoji: "🧩",
        objectPos: { right: '40px', top: '30px' },
        facePos: { left: '35%', bottom: '30%' },
        scenario: "Bạn nhỏ đang cố ghép một bộ xếp hình khó.",
        question: "Biểu cảm này cho thấy điều gì?",
        options: [
          { text: "Bạn ấy đang rất tập trung và hơi căng thẳng", emoji: "🤔", correct: true },
          { text: "Bạn ấy ghét chơi xếp hình", emoji: "😠", correct: false },
          { text: "Bạn ấy muốn đi ngủ", emoji: "🛌", correct: false }
        ]
      },
      {
        id: 15,
        mainEmoji: "🥺",
        objectEmoji: "🪀",
        objectPos: { left: '30px', top: '40px' },
        facePos: { right: '40%', bottom: '25%' },
        scenario: "Đồ chơi yêu thích của bạn nhỏ bị hỏng.",
        question: "Vì sao mắt bạn ấy lại rưng rưng thế?",
        options: [
          { text: "Vì bạn ấy tiếc đồ chơi bị hỏng", emoji: "💧", correct: true },
          { text: "Vì bạn ấy vừa ngủ dậy", emoji: "🛏️", correct: false },
          { text: "Vì có bụi bay vào mắt", emoji: "💨", correct: false }
        ]
      },
      {
        id: 16,
        mainEmoji: "😡",
        objectEmoji: "✏️",
        objectPos: { right: '35px', bottom: '35px' },
        facePos: { left: '40%', top: '25%' },
        scenario: "Bạn cùng bàn vô tình làm gãy bút chì mới của bạn nhỏ.",
        question: "Cảm xúc của bạn ấy lúc này là gì?",
        options: [
          { text: "Bạn ấy tức giận", emoji: "💢", correct: true },
          { text: "Bạn ấy muốn cho bạn mượn bút", emoji: "🤝", correct: false },
          { text: "Bạn ấy thích bút chì ngắn", emoji: "✂️", correct: false }
        ]
      },
      {
        id: 17,
        mainEmoji: "🤩",
        objectEmoji: "🌈",
        objectPos: { left: '40px', top: '30px' },
        facePos: { right: '35%', bottom: '30%' },
        scenario: "Sau cơn mưa, một cầu vồng rất to xuất hiện.",
        question: "Tại sao bạn ấy lại reo lên thích thú?",
        options: [
          { text: "Vì cầu vồng quá đẹp và kỳ diệu", emoji: "✨", correct: true },
          { text: "Vì trời đang mưa", emoji: "☔", correct: false },
          { text: "Vì bạn ấy thích màu xám", emoji: "🩶", correct: false }
        ]
      },
      {
        id: 18,
        mainEmoji: "😌",
        objectEmoji: "🛁",
        objectPos: { right: '30px', top: '40px' },
        facePos: { left: '40%', bottom: '25%' },
        scenario: "Sau một ngày chơi đùa, bạn nhỏ được tắm nước ấm.",
        question: "Cảm giác của bạn ấy thế nào?",
        options: [
          { text: "Thư giãn và dễ chịu", emoji: "🛀", correct: true },
          { text: "Nóng bức và khó chịu", emoji: "🥵", correct: false },
          { text: "Muốn chạy ra ngoài chơi tiếp", emoji: "🏃", correct: false }
        ]
      },
      {
        id: 19,
        mainEmoji: "😐",
        objectEmoji: "🥦",
        objectPos: { left: '45px', bottom: '40px' },
        facePos: { right: '35%', top: '25%' },
        scenario: "Trên bàn ăn có một đĩa súp lơ xanh.",
        question: "Biểu cảm này của bạn ấy có nghĩa là gì?",
        options: [
          { text: "Bạn ấy không thích ăn rau", emoji: "🤢", correct: true },
          { text: "Bạn ấy rất đói và thèm ăn", emoji: "🤤", correct: false },
          { text: "Bạn ấy ngạc nhiên vì đĩa đẹp", emoji: "🍽️", correct: false }
        ]
      },
      {
        id: 20,
        mainEmoji: "🙂",
        objectEmoji: "🪴",
        objectPos: { right: '40px', top: '30px' },
        facePos: { left: '35%', bottom: '30%' },
        scenario: "Cây hoa nhỏ bạn nhỏ trồng đã nở một bông hoa đầu tiên.",
        question: "Bạn ấy cảm thấy thế nào?",
        options: [
          { text: "Hạnh phúc và tự hào về thành quả", emoji: "🌼", correct: true },
          { text: "Buồn vì hoa có gai", emoji: "🥀", correct: false },
          { text: "Chán vì phải tưới cây", emoji: "💦", correct: false }
        ]
      },
      {
        id: 21,
        mainEmoji: "😟",
        objectEmoji: "🪞",
        objectPos: { left: '30px', top: '40px' },
        facePos: { right: '40%', bottom: '25%' },
        scenario: "Bạn nhỏ soi gương và thấy một vết bẩn trên mặt.",
        question: "Vì sao bạn ấy nhăn mặt thế?",
        options: [
          { text: "Bạn ấy không thích mặt mình bị bẩn", emoji: "🧼", correct: true },
          { text: "Bạn ấy thích chiếc gương", emoji: "👍", correct: false },
          { text: "Bạn ấy đang tập thể dục", emoji: "🤸", correct: false }
        ]
      },
      {
        id: 22,
        mainEmoji: "😊",
        objectEmoji: "🏆",
        objectPos: { right: '35px', bottom: '35px' },
        facePos: { left: '40%', top: '25%' },
        scenario: "Bạn nhỏ vừa nhận được một chiếc cúp trong cuộc thi vẽ.",
        question: "Cảm xúc của bạn ấy là gì?",
        options: [
          { text: "Vui và hãnh diện", emoji: "🎨", correct: true },
          { text: "Buồn vì không được giải nhất", emoji: "🥈", correct: false },
          { text: "Mệt vì chạy thi", emoji: "�", correct: false }
        ]
      },
      {
        id: 23,
        mainEmoji: "🥶",
        objectEmoji: "⛄",
        objectPos: { left: '40px', top: '30px' },
        facePos: { right: '35%', bottom: '30%' },
        scenario: "Trời tuyết rất lạnh, bạn nhỏ đang đứng ngoài trời.",
        question: "Tại sao bạn ấy run rẩy thế?",
        options: [
          { text: "Vì bạn ấy cảm thấy lạnh cóng", emoji: "❄️", correct: true },
          { text: "Vì bạn ấy đang nhảy múa", emoji: "💃", correct: false },
          { text: "Vì bạn ấy sợ người tuyết", emoji: "☃️", correct: false }
        ]
      }
  ], []);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [gazeStats, setGazeStats] = useState({ face: 0, object: 0, total: 0 });

  const current = scenarios[currentIdx];

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'vi-VN';
      msg.rate = 0.85;
      window.speechSynthesis.speak(msg);
    }
  };

  useEffect(() => {
    speak(`${current.scenario}. ${current.question}`);
    setStartTime(Date.now());
    setGazeStats({ face: 0, object: 0, total: 0 });
  }, [currentIdx, current]);

  // --- AI TRACKING (Phân tích nhìn mặt vs đồ vật) ---
  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      const gx = aiData?.gazeX ?? 0.5;
      const gy = aiData?.gazeY ?? 0.5;

      // Giả định vùng nhìn dựa trên bố cục UI
      const isLookingAtFace = (gx > 0.3 && gx < 0.6) && (gy > 0.2 && gy < 0.5);
      const isLookingAtObject = (gx > 0.6 || gx < 0.3) && (gy > 0.4);

      if (isLookingAtFace) setGazeStats(prev => ({ ...prev, face: prev.face + 1, total: prev.total + 1 }));
      else if (isLookingAtObject) setGazeStats(prev => ({ ...prev, object: prev.object + 1, total: prev.total + 1 }));
      else setGazeStats(prev => ({ ...prev, total: prev.total + 1 }));

      onFeatureCapture({
        timestamp: Date.now(),
        gazeX: gx, gazeY: gy,
        targetX: 50, targetY: 40,
        lookingAt: isLookingAtFace ? 'FACE' : (isLookingAtObject ? 'OBJECT' : 'OTHER'),
        thinkingTime: (Date.now() - startTime) / 1000,
        attentionLevel: aiData?.avgAttention ?? 0.5
      } as any);
    },300);
    return () => clearInterval(recordLoop);
  }, [onFeatureCapture, latestAIResult, startTime]);

  const handleSelect = (idx: number, isCorrect: boolean) => {
    if (selectedIdx !== null) return;
    setSelectedIdx(idx);
    
    if (isCorrect) {
      speak("Đúng rồi! Con hiểu bạn ấy thật đấy.");
      setTimeout(() => {
        setSelectedIdx(null);
        setCurrentIdx((prev) => (prev + 1) % scenarios.length);
      }, 2500);
    } else {
      speak("Chưa đúng rồi, con nhìn lại bạn nhé.");
      setTimeout(() => setSelectedIdx(null), 1500);
    }
  };

  return (
    <div className="social-game-container">
      <style>{styles}</style>
      
      <div className="question-box">
        {current.question}
      </div>

      <div className="scenario-image-box">
        {/* Minh họa tình huống xã hội */}
        <div className="main-emoji" style={current.facePos as any}>{current.mainEmoji}</div>
        <div className="secondary-emoji" style={current.objectPos as any}>{current.objectEmoji}</div>
        
        {/* Vùng tracking (ẩn) */}
        <div className="target-face" style={current.facePos as any} />
        <div className="target-object" style={current.objectPos as any} />
      </div>

      <div className="options-row">
        {current.options.map((opt, i) => (
          <div 
            key={i} 
            className={`option-card ${selectedIdx === i ? (opt.correct ? 'correct' : 'incorrect') : ''}`}
            onClick={() => handleSelect(i, opt.correct)}
          >
            <span style={{fontSize: '50px'}}>{opt.emoji}</span>
            <span style={{fontSize: '20px', fontWeight: 'bold', textAlign: 'center'}}>{opt.text}</span>
          </div>
        ))}
      </div>

      <div style={{marginTop: '20px', fontSize: '18px', color: '#64748B'}}>
        Tỉ lệ nhìn khuôn mặt: {gazeStats.total > 0 ? Math.round((gazeStats.face / gazeStats.total) * 100) : 0}%
      </div>
    </div>
  );
};

export default G4_1_WhySoSocial;