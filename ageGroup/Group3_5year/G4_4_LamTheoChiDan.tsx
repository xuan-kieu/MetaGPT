import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G4_4_FollowInstructions: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- CSS NỘI BỘ ---
  const styles = `
    .instruction-game-container {
      width: 100%;
      height: 100%;
      position: relative;
      background: linear-gradient(135deg, #60A5FA 0%, #1D4ED8 100%);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }

    .instruction-timer {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 16px;
      font-weight: bold;
      z-index: 100;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .instruction-title {
      text-align: center;
      color: white;
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 15px;
      text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
      background: rgba(0, 0, 0, 0.3);
      padding: 10px 30px;
      border-radius: 20px;
    }

    .instruction-display {
      background: rgba(255, 255, 255, 0.95);
      padding: 30px;
      border-radius: 25px;
      text-align: center;
      font-size: 28px;
      font-weight: bold;
      color: #1E40AF;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      width: 90%;
      min-height: 150px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 20px 0;
      border: 5px solid #60A5FA;
      line-height: 1.5;
    }

    .instruction-audio {
      margin: 15px 0;
      background: rgba(255, 255, 255, 0.9);
      padding: 15px;
      border-radius: 20px;
      width: 90%;
      text-align: center;
    }

    .instruction-play-btn {
      background: #10B981;
      color: white;
      border: none;
      padding: 15px 30px;
      border-radius: 15px;
      font-size: 20px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }

    .instruction-play-btn:hover {
      background: #059669;
      transform: translateY(-3px);
    }

    .instruction-play-btn:active {
      transform: translateY(0);
    }

    .instruction-options {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      width: 90%;
      max-width: 600px;
      margin: 25px 0;
    }

    .instruction-option {
      background: white;
      border-radius: 20px;
      padding: 25px;
      text-align: center;
      font-size: 22px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      border: 4px solid transparent;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 15px;
      min-height: 120px;
    }

    .instruction-option:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
    }

    .instruction-option.correct {
      border-color: #10B981;
      background: #D1FAE5;
      animation: correctGlow 0.5s ease;
    }

    .instruction-option.incorrect {
      border-color: #EF4444;
      background: #FEE2E2;
      animation: shake 0.5s ease;
    }

    .instruction-option-emoji {
      font-size: 40px;
    }

    .instruction-feedback {
      background: rgba(255, 255, 255, 0.95);
      padding: 20px 30px;
      border-radius: 20px;
      text-align: center;
      font-size: 22px;
      font-weight: bold;
      color: #4B5563;
      margin: 15px 0;
      width: 90%;
      min-height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-left: 6px solid #60A5FA;
    }

    .instruction-progress {
      width: 80%;
      height: 12px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      overflow: hidden;
      margin: 10px 0;
    }

    .instruction-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #FCD34D, #F59E0B);
      border-radius: 10px;
      transition: width 0.5s ease;
    }

    .instruction-stats {
      display: flex;
      gap: 40px;
      margin-top: 15px;
      color: white;
      font-weight: bold;
      font-size: 20px;
      background: rgba(0, 0, 0, 0.3);
      padding: 15px 30px;
      border-radius: 15px;
    }

    .instruction-timer-display {
      font-size: 20px;
      color: white;
      font-weight: bold;
      background: rgba(0, 0, 0, 0.3);
      padding: 10px 20px;
      border-radius: 15px;
      margin: 10px 0;
    }

    @keyframes correctGlow {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15); }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-8px); }
      75% { transform: translateX(8px); }
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    @media (max-width: 768px) {
      .instruction-options {
        grid-template-columns: 1fr;
        gap: 15px;
      }
      
      .instruction-title {
        font-size: 24px;
        padding: 8px 20px;
      }
      
      .instruction-display {
        font-size: 22px;
        padding: 20px;
        min-height: 120px;
      }
      
      .instruction-option {
        padding: 20px;
        min-height: 100px;
        font-size: 18px;
      }
      
      .instruction-option-emoji {
        font-size: 32px;
      }
      
      .instruction-feedback {
        font-size: 18px;
        padding: 15px 20px;
      }
      
      .instruction-stats {
        font-size: 16px;
        padding: 12px 20px;
        gap: 20px;
      }
    }
  `;

  // --- LOGIC ---
  interface Instruction {
    id: number;
    text: string;
    audioText: string;
    options: {
      text: string;
      emoji: string;
      correct: boolean;
    }[];
    timeLimit: number;
  }

  const GAME_DURATION = 300; // Tăng thời gian vì có nhiều chỉ dẫn hơn
  
  const instructions: Instruction[] = useMemo(() => [
    {
      id: 1,
      text: "Hãy vỗ tay 3 lần rồi giơ ngón tay cái lên!",
      audioText: "Hãy vỗ tay 3 lần rồi giơ ngón tay cái lên!",
      options: [
        { text: "👏👏👏👍", emoji: "👏👏👏👍", correct: true },
        { text: "Nhảy lên 3 lần", emoji: "🏃🏃🏃", correct: false },
        { text: "Quay tròn 2 vòng", emoji: "🌀🌀", correct: false },
        { text: "Ngồi xuống đứng lên", emoji: "🪑↕️", correct: false }
      ],
      timeLimit: 10
    },
    {
      id: 2,
      text: "Chạm vào mũi, sau đó xoay người một vòng!",
      audioText: "Chạm vào mũi, sau đó xoay người một vòng!",
      options: [
        { text: "👃🌀", emoji: "👃🌀", correct: true },
        { text: "Vỗ vào đùi 2 cái", emoji: "🦵🦵", correct: false },
        { text: "Nhắm mắt 5 giây", emoji: "👁️⏱️", correct: false },
        { text: "Hát một bài", emoji: "🎤", correct: false }
      ],
      timeLimit: 10
    },
    {
      id: 3,
      text: "Giơ tay trái lên, chạm vào tai phải!",
      audioText: "Giơ tay trái lên, chạm vào tai phải!",
      options: [
        { text: "✋👂", emoji: "✋👂", correct: true },
        { text: "Giơ cả hai tay", emoji: "✋✋", correct: false },
        { text: "Nhảy lò cò", emoji: "🦵", correct: false },
        { text: "Vẫy tay chào", emoji: "👋", correct: false }
      ],
      timeLimit: 8
    },
    {
      id: 4,
      text: "Đếm từ 1 đến 5 rồi cúi chào!",
      audioText: "Đếm từ 1 đến 5 rồi cúi chào!",
      options: [
        { text: "1️⃣2️⃣3️⃣4️⃣5️⃣🙇", emoji: "1️⃣2️⃣3️⃣4️⃣5️⃣🙇", correct: true },
        { text: "Hát ABC", emoji: "🔤", correct: false },
        { text: "Nhảy 3 bước", emoji: "🕺🕺🕺", correct: false },
        { text: "Vỗ đùi 4 cái", emoji: "🦵🦵🦵🦵", correct: false }
      ],
      timeLimit: 12
    },
    {
      id: 5,
      text: "Cười to rồi làm mặt ngốc nghếch!",
      audioText: "Cười to rồi làm mặt ngốc nghếch!",
      options: [
        { text: "😄😜", emoji: "😄😜", correct: true },
        { text: "Khóc thật to", emoji: "😭", correct: false },
        { text: "Hắt hơi 2 cái", emoji: "🤧🤧", correct: false },
        { text: "Nháy mắt 3 lần", emoji: "😉😉😉", correct: false }
      ],
      timeLimit: 8
    },
    {
      id: 6,
      text: "Đi bằng gót chân 4 bước rồi dừng!",
      audioText: "Đi bằng gót chân 4 bước rồi dừng!",
      options: [
        { text: "👣👣👣👣🛑", emoji: "👣👣👣👣🛑", correct: true },
        { text: "Chạy nhanh 10 bước", emoji: "🏃🏃", correct: false },
        { text: "Ngồi xổm 2 lần", emoji: "🪑🪑", correct: false },
        { text: "Vẫy tay 5 cái", emoji: "👋👋👋👋👋", correct: false }
      ],
      timeLimit: 12
    },
    {
      id: 7,
      text: "Vỗ tay theo nhịp: chậm, nhanh, chậm!",
      audioText: "Vỗ tay theo nhịp: chậm, nhanh, chậm!",
      options: [
        { text: "👏...👏👏...👏", emoji: "👏...👏👏...👏", correct: true },
        { text: "Vỗ tay thật nhanh", emoji: "👏👏👏", correct: false },
        { text: "Vỗ tay 10 cái", emoji: "👏x10", correct: false },
        { text: "Vỗ vào bàn 3 cái", emoji: "🪑👏👏👏", correct: false }
      ],
      timeLimit: 15
    },
    {
      id: 8,
      text: "Lắc đầu 3 lần rồi gật đầu 2 lần!",
      audioText: "Lắc đầu 3 lần rồi gật đầu 2 lần!",
      options: [
        { text: "🙅🙅🙅🙆🙆", emoji: "🙅🙅🙅🙆🙆", correct: true },
        { text: "Gật đầu 5 lần", emoji: "🙆x5", correct: false },
        { text: "Lắc đầu liên tục", emoji: "🙅🙅", correct: false },
        { text: "Xoay cổ 2 vòng", emoji: "🌀🌀", correct: false }
      ],
      timeLimit: 10
    },
    {
      id: 9,
      text: "Nhảy như ếch 2 cái rồi kêu 'Ộp ộp'!",
      audioText: "Nhảy như ếch 2 cái rồi kêu 'Ộp ộp'!",
      options: [
        { text: "🐸🐸🎤", emoji: "🐸🐸🎤", correct: true },
        { text: "Nhảy cao 3 lần", emoji: "🦘🦘🦘", correct: false },
        { text: "Bò như rùa", emoji: "🐢", correct: false },
        { text: "Kêu như mèo", emoji: "🐱🎤", correct: false }
      ],
      timeLimit: 12
    },
    {
      id: 10,
      text: "Đứng trên một chân đếm đến 5!",
      audioText: "Đứng trên một chân đếm đến 5!",
      options: [
        { text: "🦵1️⃣2️⃣3️⃣4️⃣5️⃣", emoji: "🦵1️⃣2️⃣3️⃣4️⃣5️⃣", correct: true },
        { text: "Nhảy lò cò 3 bước", emoji: "🦵🦵🦵", correct: false },
        { text: "Ngồi xuống đếm", emoji: "🪑🔢", correct: false },
        { text: "Chạy tại chỗ 5 giây", emoji: "🏃⏱️", correct: false }
      ],
      timeLimit: 15
    },
    {
      id: 11,
      text: "Vuốt tóc 3 lần rồi thổi một nụ hôn!",
      audioText: "Vuốt tóc 3 lần rồi thổi một nụ hôn!",
      options: [
        { text: "💁💁💁💋", emoji: "💁💁💁💋", correct: true },
        { text: "Chải tóc 5 lần", emoji: "💇x5", correct: false },
        { text: "Hôn vào tay", emoji: "👋💋", correct: false },
        { text: "Vẫy tay chào", emoji: "👋", correct: false }
      ],
      timeLimit: 10
    },
    {
      id: 12,
      text: "Làm máy bay bay 1 vòng quanh phòng!",
      audioText: "Làm máy bay bay 1 vòng quanh phòng!",
      options: [
        { text: "✈️🌀", emoji: "✈️🌀", correct: true },
        { text: "Ngồi im như máy bay", emoji: "✈️🪑", correct: false },
        { text: "Chạy thẳng 1 đường", emoji: "🏃➡️", correct: false },
        { text: "Nhảy lên 2 lần", emoji: "🦘🦘", correct: false }
      ],
      timeLimit: 12
    },
    {
      id: 13,
      text: "Căng cánh tay ra như chim bay!",
      audioText: "Căng cánh tay ra như chim bay!",
      options: [
        { text: "🦅✈️", emoji: "🦅✈️", correct: true },
        { text: "Ngồi xuống như chim", emoji: "🦜🪑", correct: false },
        { text: "Vỗ tay như cánh", emoji: "👏👏", correct: false },
        { text: "Nhắm mắt như ngủ", emoji: "😴", correct: false }
      ],
      timeLimit: 8
    },
    {
      id: 14,
      text: "Bắt chước tiếng gà gáy 'Ò ó o'!",
      audioText: "Bắt chước tiếng gà gáy 'Ò ó o'!",
      options: [
        { text: "🐔🎤", emoji: "🐔🎤", correct: true },
        { text: "Kêu như chó", emoji: "🐶🎤", correct: false },
        { text: "Hót như chim", emoji: "🐦🎤", correct: false },
        { text: "Rống như sư tử", emoji: "🦁🎤", correct: false }
      ],
      timeLimit: 10
    },
    {
      id: 15,
      text: "Đi lùi 3 bước rồi quay lại!",
      audioText: "Đi lùi 3 bước rồi quay lại!",
      options: [
        { text: "👣👣👣🔄", emoji: "👣👣👣🔄", correct: true },
        { text: "Đi sang ngang 5 bước", emoji: "👣👣👣👣👣", correct: false },
        { text: "Chạy tại chỗ 10 giây", emoji: "🏃⏱️", correct: false },
        { text: "Ngồi xuống đứng lên", emoji: "🪑↕️", correct: false }
      ],
      timeLimit: 12
    },
    {
      id: 16,
      text: "Dùng tay vẽ hình tròn trong không khí!",
      audioText: "Dùng tay vẽ hình tròn trong không khí!",
      options: [
        { text: "👆⭕", emoji: "👆⭕", correct: true },
        { text: "Vẽ hình vuông", emoji: "👆⬛", correct: false },
        { text: "Vẽ số 8", emoji: "👆8️⃣", correct: false },
        { text: "Vỗ vào không khí", emoji: "👏", correct: false }
      ],
      timeLimit: 10
    },
    {
      id: 17,
      text: "Giả vờ leo núi 5 bước!",
      audioText: "Giả vờ leo núi 5 bước!",
      options: [
        { text: "🧗‍♀️🧗‍♀️🧗‍♀️🧗‍♀️🧗‍♀️", emoji: "🧗‍♀️🧗‍♀️🧗‍♀️🧗‍♀️🧗‍♀️", correct: true },
        { text: "Nhảy qua vũng nước", emoji: "💦🦘", correct: false },
        { text: "Bơi tại chỗ", emoji: "🏊", correct: false },
        { text: "Chạy nhanh 10 bước", emoji: "🏃🏃", correct: false }
      ],
      timeLimit: 12
    },
    {
      id: 18,
      text: "Hát 'Chúc mừng sinh nhật' thật to!",
      audioText: "Hát 'Chúc mừng sinh nhật' thật to!",
      options: [
        { text: "🎂🎤🎵", emoji: "🎂🎤🎵", correct: true },
        { text: "Hát bài ABC", emoji: "🔤🎤", correct: false },
        { text: "Đọc một bài thơ", emoji: "📖", correct: false },
        { text: "Nói 'Xin chào' 3 lần", emoji: "👋👋👋", correct: false }
      ],
      timeLimit: 15
    },
    {
      id: 19,
      text: "Làm động tác bơi ếch 3 lần!",
      audioText: "Làm động tác bơi ếch 3 lần!",
      options: [
        { text: "🐸🏊🐸🏊🐸🏊", emoji: "🐸🏊🐸🏊🐸🏊", correct: true },
        { text: "Bơi tự do tại chỗ", emoji: "🏊", correct: false },
        { text: "Lặn như cá heo", emoji: "🐬", correct: false },
        { text: "Đứng im như tượng", emoji: "🗿", correct: false }
      ],
      timeLimit: 12
    },
    {
      id: 20,
      text: "Ôm chặt lấy chính mình rồi thả ra!",
      audioText: "Ôm chặt lấy chính mình rồi thả ra!",
      options: [
        { text: "🤗...🫳", emoji: "🤗...🫳", correct: true },
        { text: "Ôm người bên cạnh", emoji: "👫🤗", correct: false },
        { text: "Vỗ vào vai mình", emoji: "👋💪", correct: false },
        { text: "Xoa bụng 3 vòng", emoji: "🌀🌀🌀", correct: false }
      ],
      timeLimit: 10
    },
    {
      id: 21,
      text: "Giả vờ là robot di chuyển 4 bước!",
      audioText: "Giả vờ là robot di chuyển 4 bước!",
      options: [
        { text: "🤖👣👣👣👣", emoji: "🤖👣👣👣👣", correct: true },
        { text: "Chạy như người máy", emoji: "🤖🏃", correct: false },
        { text: "Ngồi như robot", emoji: "🤖🪑", correct: false },
        { text: "Nói như robot", emoji: "🤖🗣️", correct: false }
      ],
      timeLimit: 12
    },
    {
      id: 22,
      text: "Nhắm mắt, giơ 2 ngón tay hòa bình!",
      audioText: "Nhắm mắt, giơ 2 ngón tay hòa bình!",
      options: [
        { text: "😌✌️✌️", emoji: "😌✌️✌️", correct: true },
        { text: "Mở mắt, giơ ngón cái", emoji: "👁️👍", correct: false },
        { text: "Nhắm mắt, vỗ tay", emoji: "😌👏", correct: false },
        { text: "Mở mắt, xòe bàn tay", emoji: "👁️🖐️", correct: false }
      ],
      timeLimit: 10
    },
    {
      id: 23,
      text: "Đi bằng mũi chân 4 bước nhỏ!",
      audioText: "Đi bằng mũi chân 4 bước nhỏ!",
      options: [
        { text: "👣👣👣👣🎩", emoji: "👣👣👣👣🎩", correct: true },
        { text: "Chạy nhanh 10 bước", emoji: "🏃🏃", correct: false },
        { text: "Nhảy lò cò 5 bước", emoji: "🦵🦵🦵🦵🦵", correct: false },
        { text: "Đi thật chậm 2 bước", emoji: "👣👣", correct: false }
      ],
      timeLimit: 12
    },
    {
      id: 24,
      text: "Vừa nhảy vừa vỗ tay 3 lần!",
      audioText: "Vừa nhảy vừa vỗ tay 3 lần!",
      options: [
        { text: "🦘👏🦘👏🦘👏", emoji: "🦘👏🦘👏🦘👏", correct: true },
        { text: "Ngồi vỗ tay", emoji: "🪑👏", correct: false },
        { text: "Nhảy không vỗ tay", emoji: "🦘🦘🦘", correct: false },
        { text: "Vỗ tay không nhảy", emoji: "👏👏👏", correct: false }
      ],
      timeLimit: 10
    }
  ], []);

  const [currentInstruction, setCurrentInstruction] = useState<Instruction | null>(null);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [feedback, setFeedback] = useState('Lắng nghe kỹ chỉ dẫn và làm theo nhé! 👂');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [instructionIndex, setInstructionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [availableInstructions, setAvailableInstructions] = useState<number[]>([]);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);

  // Khởi tạo danh sách chỉ dẫn có sẵn
  useEffect(() => {
    const initialAvailable = instructions.map(inst => inst.id);
    setAvailableInstructions(initialAvailable);
    selectRandomInstruction(initialAvailable);
  }, []);

  const selectRandomInstruction = (availableIds: number[]) => {
    if (availableIds.length === 0) {
      setGameCompleted(true);
      setCurrentInstruction(null);
      setFeedback('🎉 Chúc mừng! Bạn đã hoàn thành tất cả chỉ dẫn! 🏆');
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableIds.length);
    const randomId = availableIds[randomIndex];
    const instruction = instructions.find(inst => inst.id === randomId);
    
    if (instruction) {
      setCurrentInstruction(instruction);
      setTimeLeft(instruction.timeLimit);
      setFeedback(`Chỉ dẫn ${instructionIndex + 1}/24: ${instruction.text}`);
    }
  };

  // Timer cho mỗi chỉ dẫn
  useEffect(() => {
    if (gameCompleted || !currentInstruction) return;

    if (timeLeft <= 0) {
      setFeedback('Hết giờ! Hãy thử chỉ dẫn tiếp theo! ⏰');
      setTimeout(() => {
        nextInstruction();
      }, 1500);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, currentInstruction, gameCompleted]);

  const playAudio = () => {
    if (!currentInstruction || isPlaying) return;
    
    setIsPlaying(true);
    // Sử dụng Web Speech API
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentInstruction.audioText);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.8;
      utterance.pitch = 1.2;
      
      utterance.onend = () => {
        setIsPlaying(false);
        setFeedback('Đã nghe xong! Hãy chọn hành động đúng! 🎧');
      };
      
      utterance.onerror = () => {
        setIsPlaying(false);
        setFeedback('Không thể phát âm thanh. Đọc kỹ chỉ dẫn nhé! 📖');
      };
      
      speechSynthesis.speak(utterance);
    } else {
      setIsPlaying(false);
      setFeedback('Trình duyệt không hỗ trợ đọc văn bản. Đọc kỹ chỉ dẫn nhé! 📖');
    }
  };

  const handleOptionClick = (optionIndex: number) => {
    if (selectedOption !== null || !currentInstruction) return;
    
    const option = currentInstruction.options[optionIndex];
    setSelectedOption(optionIndex);
    
    if (option.correct) {
      const pointsEarned = currentInstruction.timeLimit;
      setScore(prev => prev + pointsEarned);
      setCorrectAnswers(prev => prev + 1);
      setFeedback(`Tuyệt vời! +${pointsEarned} điểm! Con đã làm đúng chỉ dẫn! 🎉`);
    } else {
      setFeedback('Ôi, chưa đúng rồi! Nghe kỹ chỉ dẫn nhé! 👂');
    }
    
    setTotalAnswered(prev => prev + 1);
    
    // Chuyển chỉ dẫn sau 2 giây
    setTimeout(() => {
      nextInstruction();
    }, 2000);
  };

  const nextInstruction = () => {
    if (gameCompleted) return;
    
    // Loại bỏ chỉ dẫn hiện tại khỏi danh sách có sẵn
    if (currentInstruction) {
      const newAvailable = availableInstructions.filter(id => id !== currentInstruction.id);
      setAvailableInstructions(newAvailable);
      
      // Chọn chỉ dẫn ngẫu nhiên mới
      selectRandomInstruction(newAvailable);
    }
    
    setInstructionIndex(prev => prev + 1);
    setSelectedOption(null);
    setIsPlaying(false);
  };

  const resetGame = () => {
    const initialAvailable = instructions.map(inst => inst.id);
    setAvailableInstructions(initialAvailable);
    selectRandomInstruction(initialAvailable);
    setScore(0);
    setTotalAnswered(0);
    setCorrectAnswers(0);
    setInstructionIndex(0);
    setGameCompleted(false);
    setFeedback('Bắt đầu lại trò chơi! Lắng nghe kỹ chỉ dẫn nhé! 👂');
  };

  useEffect(() => {
    // Tự động chuyển chỉ dẫn sau 15 giây nếu không chọn
    const autoNextTimer = setTimeout(() => {
      if (!gameCompleted && selectedOption === null && timeLeft > 0) {
        setFeedback('Hãy chọn nhanh lên nào! ⏳');
      }
    }, 15000);

    return () => clearTimeout(autoNextTimer);
  }, [selectedOption, timeLeft, gameCompleted]);

  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      
      // Xác định affect
      let affect: 'positive' | 'neutral' | 'negative' | 'surprised' = 'neutral';
      if (feedback.includes('Tuyệt vời')) affect = 'positive';
      if (feedback.includes('chưa đúng')) affect = 'negative';
      if (isPlaying) affect = 'surprised';
      if (gameCompleted) affect = 'positive';
      
      const feature: BehavioralFeature = {
        timestamp: Date.now(),
        gazeX: aiData?.gazeX ?? 0.5,
        gazeY: aiData?.gazeY ?? 0.5,
        targetX: 50,
        targetY: 35,
        targetSize: 200,
        audioStimulus: currentInstruction?.audioText || null,
        isLookingAtTarget: false,
        attentionLevel: aiData?.avgAttention ?? 0.5,
        smileIntensity: aiData?.avgSmile ?? 0,
        frownIntensity: 0.1,
        affect: affect,
        poseConfidence: aiData?.faceDetectionConfidence ?? 0,
        faceConfidence: aiData?.faceDetectionConfidence ?? 0
      };
      onFeatureCapture(feature);
    }, 100);

    return () => { 
      clearInterval(recordLoop); 
    };
  }, [currentInstruction, feedback, isPlaying, gameCompleted, onFeatureCapture, latestAIResult]);

  const progressPercentage = totalAnswered > 0 ? (correctAnswers / totalAnswered) * 100 : 0;

  return (
    <div className="instruction-game-container">
      <style>{styles}</style>

      <div className="instruction-timer">
        ⏱️ {timeElapsed}s / {GAME_DURATION}s
      </div>
      
      <div className="instruction-title">
        👂 Làm Theo Chỉ Dẫn
      </div>

      {!gameCompleted ? (
        <>
          <div className="instruction-timer-display">
            ⏳ Thời gian còn lại: {timeLeft} giây
          </div>

          <div className="instruction-display">
            {currentInstruction ? currentInstruction.text : 'Đang tải chỉ dẫn...'}
          </div>

          <div className="instruction-audio">
            <button 
              className="instruction-play-btn"
              onClick={playAudio}
              disabled={isPlaying || !currentInstruction}
            >
              {isPlaying ? (
                <>
                  <span>🔊</span> Đang phát...
                </>
              ) : (
                <>
                  <span>🔊</span> Nghe chỉ dẫn
                </>
              )}
            </button>
          </div>

          <div className="instruction-options">
            {currentInstruction ? (
              currentInstruction.options.map((option, index) => (
                <div
                  key={index}
                  className={`instruction-option ${
                    selectedOption === index 
                      ? (option.correct ? 'correct' : 'incorrect') 
                      : ''
                  }`}
                  onClick={() => handleOptionClick(index)}
                >
                  <div className="instruction-option-emoji">
                    {option.emoji}
                  </div>
                  <div>{option.text}</div>
                </div>
              ))
            ) : (
              <div style={{ 
                gridColumn: '1 / -1', 
                textAlign: 'center', 
                padding: '40px',
                color: '#6B7280',
                fontStyle: 'italic'
              }}>
                Đang tải chỉ dẫn...
              </div>
            )}
          </div>

          <div className="instruction-feedback">
            {feedback}
          </div>

          <div className="instruction-progress">
            <div 
              className="instruction-progress-bar" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <div className="instruction-stats">
            <div>Điểm: {score} ✨</div>
            <div>Chỉ dẫn: {instructionIndex}/{instructions.length}</div>
            <div>Đúng: {correctAnswers}/{totalAnswered}</div>
          </div>
        </>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '40px'
        }}>
          <div style={{ fontSize: '72px', marginBottom: '20px' }}>🏆🎉</div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: 'white', 
            marginBottom: '10px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}>
            Chúc mừng bạn!
          </div>
          <div style={{ 
            fontSize: '24px', 
            color: '#E5E7EB', 
            marginBottom: '20px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
          }}>
            Bạn đã hoàn thành tất cả 24 chỉ dẫn!
          </div>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '20px',
            borderRadius: '15px',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1E40AF',
            marginBottom: '30px',
            width: '80%'
          }}>
            <div>Điểm tổng: {score} ✨</div>
            <div>Tỉ lệ đúng: {totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0}%</div>
          </div>
          <button 
            onClick={resetGame}
            style={{
              background: '#10B981',
              color: 'white',
              border: 'none',
              padding: '15px 40px',
              borderRadius: '15px',
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
            }}
          >
            <span>🔄</span> Chơi lại từ đầu
          </button>
        </div>
      )}
    </div>
  );
};

export default G4_4_FollowInstructions;