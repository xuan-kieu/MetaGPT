import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G4_5_DecodeRule: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- CSS NỘI BỘ ---
  const styles = `
    .decode-game-container {
      width: 100%;
      height: 100%;
      position: relative;
      background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }

    .decode-timer {
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

    .decode-title {
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

    .decode-instruction {
      background: rgba(255, 255, 255, 0.95);
      padding: 20px;
      border-radius: 20px;
      text-align: center;
      font-size: 22px;
      font-weight: bold;
      color: #7C3AED;
      margin: 10px 0;
      width: 90%;
      border: 4px solid #A78BFA;
    }

    .decode-rule-display {
      background: rgba(0, 0, 0, 0.2);
      padding: 20px 30px;
      border-radius: 20px;
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      color: white;
      margin: 15px 0;
      width: 90%;
      border: 3px dashed white;
      min-height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .decode-examples {
      background: rgba(255, 255, 255, 0.95);
      padding: 20px;
      border-radius: 20px;
      width: 90%;
      margin: 15px 0;
    }

    .decode-example-title {
      text-align: center;
      font-size: 20px;
      font-weight: bold;
      color: #7C3AED;
      margin-bottom: 15px;
    }

    .decode-example-items {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
    }

    .decode-example-item {
      background: white;
      border-radius: 15px;
      padding: 20px;
      text-align: center;
      font-size: 28px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      border: 3px solid #A78BFA;
      min-height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .decode-example-item.question {
      background: #FEF3C7;
      border-color: #F59E0B;
      animation: pulse 2s infinite;
    }

    .decode-choices {
      background: rgba(255, 255, 255, 0.95);
      padding: 20px;
      border-radius: 20px;
      width: 90%;
      margin: 15px 0;
    }

    .decode-choice-title {
      text-align: center;
      font-size: 20px;
      font-weight: bold;
      color: #7C3AED;
      margin-bottom: 20px;
    }

    .decode-choice-options {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
    }

    .decode-choice-option {
      background: white;
      border-radius: 15px;
      padding: 25px;
      text-align: center;
      font-size: 32px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
      border: 4px solid transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100px;
    }

    .decode-choice-option:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
    }

    .decode-choice-option.correct {
      border-color: #10B981;
      background: #D1FAE5;
      animation: correctGlow 0.5s ease;
    }

    .decode-choice-option.incorrect {
      border-color: #EF4444;
      background: #FEE2E2;
      animation: shake 0.5s ease;
    }

    .decode-feedback {
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
      border-left: 6px solid #8B5CF6;
    }

    .decode-progress {
      width: 80%;
      height: 10px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      overflow: hidden;
      margin: 10px 0;
    }

    .decode-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #FCD34D, #F59E0B);
      border-radius: 10px;
      transition: width 0.5s ease;
    }

    .decode-controls {
      display: flex;
      gap: 20px;
      margin-top: 15px;
    }

    .decode-control-btn {
      background: white;
      border: none;
      padding: 12px 25px;
      border-radius: 15px;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .decode-control-btn:hover {
      transform: translateY(-3px);
    }

    .decode-control-btn.hint {
      background: #3B82F6;
      color: white;
    }

    .decode-control-btn.next {
      background: #10B981;
      color: white;
    }

    .decode-control-btn.skip {
      background: #F59E0B;
      color: white;
    }

    .decode-complete-screen {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 20px;
      margin: 20px;
      width: 90%;
    }

    .decode-complete-emoji {
      font-size: 72px;
      margin-bottom: 20px;
    }

    .decode-complete-title {
      font-size: 32px;
      font-weight: bold;
      color: #7C3AED;
      margin-bottom: 10px;
    }

    .decode-complete-stats {
      background: #FEF3C7;
      padding: 20px;
      border-radius: 15px;
      font-size: 20px;
      font-weight: bold;
      color: #92400E;
      margin-bottom: 30px;
      width: 80%;
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
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
      100% { transform: scale(1); opacity: 1; }
    }

    @media (max-width: 768px) {
      .decode-example-items,
      .decode-choice-options {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      
      .decode-title {
        font-size: 24px;
        padding: 8px 20px;
      }
      
      .decode-instruction {
        font-size: 18px;
        padding: 15px;
      }
      
      .decode-rule-display {
        font-size: 20px;
        padding: 15px 20px;
      }
      
      .decode-example-item {
        padding: 15px;
        font-size: 24px;
        min-height: 60px;
      }
      
      .decode-choice-option {
        padding: 15px;
        font-size: 28px;
        min-height: 80px;
      }
      
      .decode-feedback {
        font-size: 18px;
        padding: 15px 20px;
      }
      
      .decode-complete-emoji {
        font-size: 48px;
      }
      
      .decode-complete-title {
        font-size: 24px;
      }
    }
  `;

  // --- LOGIC ---
  interface PatternRule {
    id: number;
    name: string;
    description: string;
    examples: string[];
    allOptions: string[];
    correctAnswer: string; // Emoji string
    hints: string[];
    difficulty: number; // 1-3: dễ, trung bình, khó
  }

  const GAME_DURATION = 300;
  
  const patterns: PatternRule[] = useMemo(() => [
    {
      id: 1,
      name: "Màu sắc luân phiên",
      description: "Màu sắc thay đổi luân phiên",
      examples: ["🔴", "🔵", "🔴", "🔵", "❓"],
      allOptions: ["🔴", "🔵", "🟡", "🟢", "🟣", "🟠"],
      correctAnswer: "🔴",
      hints: ["Nhìn màu sắc xen kẽ", "Sau xanh là gì nhỉ?"],
      difficulty: 1
    },
    {
      id: 2,
      name: "Kích thước tăng dần",
      description: "Kích thước thay đổi theo chu kỳ",
      examples: ["🟠", "🔶", "🔷", "🟠", "❓"],
      allOptions: ["🟠", "🔶", "🔷", "🔴", "🔵"],
      correctAnswer: "🔶",
      hints: ["Kích thước thay đổi theo chu kỳ", "Sau nhỏ là vừa"],
      difficulty: 1
    },
    {
      id: 3,
      name: "Hình dạng lặp lại",
      description: "Hình dạng lặp lại sau mỗi 3 bước",
      examples: ["⬜", "🔵", "🔺", "⬜", "❓"],
      allOptions: ["🔵", "🔺", "⬜", "🟦", "⭐", "❤️"],
      correctAnswer: "🔵",
      hints: ["Chuỗi lặp lại sau 3 hình", "Hình thứ 2 là gì?"],
      difficulty: 1
    },
    {
      id: 4,
      name: "Số lượng tăng",
      description: "Số đếm tăng dần",
      examples: ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "❓"],
      allOptions: ["5️⃣", "6️⃣", "1️⃣", "0️⃣", "7️⃣", "8️⃣"],
      correctAnswer: "5️⃣",
      hints: ["Đếm số tiếp theo", "Sau 4 là số nào?"],
      difficulty: 1
    },
    {
      id: 5,
      name: "Hướng quay",
      description: "Kim đồng hồ quay vòng",
      examples: ["⬆️", "➡️", "⬇️", "⬅️", "❓"],
      allOptions: ["⬆️", "➡️", "⬇️", "🔄", "↗️", "↙️"],
      correctAnswer: "⬆️",
      hints: ["Kim đồng hồ quay vòng", "Sau trái là gì?"],
      difficulty: 1
    },
    {
      id: 6,
      name: "Hoa quả theo mùa",
      description: "Hoa quả thay đổi theo mùa",
      examples: ["🍓", "🍉", "🍎", "🎃", "❓"],
      allOptions: ["🎄", "🌸", "🍊", "🍇", "🥭", "🍑"],
      correctAnswer: "🎄",
      hints: ["Mùa đông có gì?", "Sau Halloween là Giáng sinh"],
      difficulty: 2
    },
    {
      id: 7,
      name: "Động vật tăng kích thước",
      description: "Động vật từ nhỏ đến lớn",
      examples: ["🐜", "🐦", "🐱", "🐕", "❓"],
      allOptions: ["🐘", "🦒", "🐭", "🐧", "🦁", "🐯"],
      correctAnswer: "🐘",
      hints: ["Động vật nào to nhất?", "Theo thứ tự kích thước"],
      difficulty: 2
    },
    {
      id: 8,
      name: "Thời tiết theo mùa",
      description: "Thời tiết thay đổi theo chu kỳ",
      examples: ["☀️", "⛈️", "🍂", "❄️", "❓"],
      allOptions: ["☀️", "🌸", "🌧️", "🍁", "🌨️", "🌬️"],
      correctAnswer: "☀️",
      hints: ["Mùa nào lặp lại?", "Bắt đầu lại từ đầu"],
      difficulty: 2
    },
    {
      id: 9,
      name: "Phương tiện tăng tốc",
      description: "Phương tiện từ chậm đến nhanh",
      examples: ["🚶", "🚲", "🚗", "✈️", "❓"],
      allOptions: ["🚀", "🛸", "🚤", "🚁", "🛴", "🚂"],
      correctAnswer: "🚀",
      hints: ["Cái gì nhanh hơn máy bay?", "Phương tiện nhanh nhất"],
      difficulty: 2
    },
    {
      id: 10,
      name: "Nhạc cụ theo độ lớn",
      description: "Nhạc cụ từ nhỏ đến lớn",
      examples: ["🎹", "🎸", "🥁", "🎺", "❓"],
      allOptions: ["🎻", "🪕", "📯", "🎷", "🪗", "🪘"],
      correctAnswer: "🎻",
      hints: ["Nhạc cụ dây lớn", "Tiếp theo là violin"],
      difficulty: 2
    },
    {
      id: 11,
      name: "Biểu cảm khuôn mặt",
      description: "Cảm xúc thay đổi",
      examples: ["😊", "😢", "😠", "😴", "❓"],
      allOptions: ["😊", "🤔", "😍", "😨", "😎", "🤢"],
      correctAnswer: "😊",
      hints: ["Chu kỳ cảm xúc", "Quay lại cảm xúc đầu tiên"],
      difficulty: 2
    },
    {
      id: 12,
      name: "Hình học phức tạp",
      description: "Hình học thay đổi theo quy tắc",
      examples: ["🔺", "🔶", "⬜", "🔷", "❓"],
      allOptions: ["🔺", "⭐", "🟦", "🟩", "🟥", "🟨"],
      correctAnswer: "🔺",
      hints: ["Quay lại hình đầu tiên", "Chu kỳ 4 hình"],
      difficulty: 3
    },
    {
      id: 13,
      name: "Chữ cái xen kẽ",
      description: "Chữ cái thay đổi theo bảng chữ cái",
      examples: ["A", "C", "E", "G", "❓"],
      allOptions: ["I", "K", "M", "O", "B", "D"],
      correctAnswer: "I",
      hints: ["Bỏ qua một chữ cái", "A, C, E, G, ?"],
      difficulty: 3
    },
    {
      id: 14,
      name: "Số chẵn tăng dần",
      description: "Số chẵn tăng dần",
      examples: ["2", "4", "6", "8", "❓"],
      allOptions: ["10", "12", "14", "16", "18", "20"],
      correctAnswer: "10",
      hints: ["Số chẵn tiếp theo", "Sau 8 là gì?"],
      difficulty: 1
    },
    {
      id: 15,
      name: "Số lẻ giảm dần",
      description: "Số lẻ giảm dần",
      examples: ["9", "7", "5", "3", "❓"],
      allOptions: ["1", "11", "13", "-1", "0", "2"],
      correctAnswer: "1",
      hints: ["Số lẻ nhỏ hơn 3", "Đếm ngược số lẻ"],
      difficulty: 2
    },
    {
      id: 16,
      name: "Thể thao theo mức độ",
      description: "Môn thể thao từ nhẹ đến mạnh",
      examples: ["🏓", "🏸", "🏀", "🏈", "❓"],
      allOptions: ["🥊", "🤼", "🏋️", "🚴", "🏊", "⛷️"],
      correctAnswer: "🥊",
      hints: ["Môn thể thao mạnh hơn", "Tiếp theo là đấm bốc"],
      difficulty: 2
    },
    {
      id: 17,
      name: "Đồ ăn theo bữa",
      description: "Đồ ăn theo các bữa trong ngày",
      examples: ["🥐", "🍱", "🍝", "🍪", "❓"],
      allOptions: ["🥛", "🍎", "🍕", "🥗", "🍦", "🍫"],
      correctAnswer: "🥛",
      hints: ["Bữa nào sau bữa tối?", "Đồ uống trước khi ngủ"],
      difficulty: 2
    },
    {
      id: 18,
      name: "Cảm xúc tích cực",
      description: "Cảm xúc tích cực tăng dần",
      examples: ["🙂", "😊", "😄", "🤩", "❓"],
      allOptions: ["🎉", "💖", "🥳", "😍", "🤗", "😌"],
      correctAnswer: "🎉",
      hints: ["Sau vui mừng là gì?", "Cảm xúc vui nhất"],
      difficulty: 1
    },
    {
      id: 19,
      name: "Thời gian trong ngày",
      description: "Thời gian thay đổi trong ngày",
      examples: ["🌅", "☀️", "🌇", "🌙", "❓"],
      allOptions: ["🌅", "⛅", "🌆", "🌃", "🌄", "🌌"],
      correctAnswer: "🌅",
      hints: ["Ngày mới bắt đầu", "Sau đêm là bình minh"],
      difficulty: 2
    },
    {
      id: 20,
      name: "Công cụ theo kích thước",
      description: "Công cụ từ nhỏ đến lớn",
      examples: ["🔧", "🔨", "🪚", "🚜", "❓"],
      allOptions: ["🏗️", "🚁", "🛠️", "⚙️", "🧰", "📐"],
      correctAnswer: "🏗️",
      hints: ["Công cụ xây dựng lớn", "Máy móc lớn hơn máy kéo"],
      difficulty: 3
    },
    {
      id: 21,
      name: "Nước giải khát",
      description: "Đồ uống theo mức độ ngọt",
      examples: ["💧", "🍵", "🧃", "🍹", "❓"],
      allOptions: ["🍸", "🍷", "🥤", "🍺", "🍶", "☕"],
      correctAnswer: "🍸",
      hints: ["Đồ uống có cồn nhẹ", "Sau cocktail là gì?"],
      difficulty: 2
    },
    {
      id: 22,
      name: "Phương hướng",
      description: "Hướng di chuyển",
      examples: ["⬆️", "↗️", "➡️", "↘️", "❓"],
      allOptions: ["⬇️", "↙️", "⬅️", "↖️", "⏫", "⏬"],
      correctAnswer: "⬇️",
      hints: ["Theo chiều kim đồng hồ", "Tiếp theo hướng nào?"],
      difficulty: 3
    },
    {
      id: 23,
      name: "Động vật biển",
      description: "Động vật biển theo kích thước",
      examples: ["🐠", "🐡", "🐙", "🦈", "❓"],
      allOptions: ["🐋", "🦑", "🐬", "🐢", "🦀", "🦐"],
      correctAnswer: "🐋",
      hints: ["Động vật biển lớn nhất", "Lớn hơn cá mập"],
      difficulty: 2
    },
    {
      id: 24,
      name: "Hành tinh",
      description: "Hành tinh theo khoảng cách Mặt Trời",
      examples: ["☀️", "🪐", "🌎", "🔴", "❓"],
      allOptions: ["🟠", "🟡", "🟢", "🔵", "🟣", "⚫"],
      correctAnswer: "🟠",
      hints: ["Hành tinh màu cam", "Sao Hỏa có màu gì?"],
      difficulty: 3
    },
    {
      id: 25,
      name: "Nhạc cụ dân tộc",
      description: "Nhạc cụ từ các nước",
      examples: ["🎻", "🎷", "🪕", "🎸", "❓"],
      allOptions: ["🎺", "🪈", "🥁", "🪗", "🎹", "🎼"],
      correctAnswer: "🎺",
      hints: ["Nhạc cụ đồng", "Tiếp theo trumpet"],
      difficulty: 2
    },
    {
      id: 26,
      name: "Cờ các nước",
      description: "Màu cờ theo quy luật",
      examples: ["🇻🇳", "🇯🇵", "🇺🇸", "🇫🇷", "❓"],
      allOptions: ["🇬🇧", "🇩🇪", "🇮🇹", "🇨🇳", "🇰🇷", "🇷🇺"],
      correctAnswer: "🇬🇧",
      hints: ["Cờ có chữ thập", "Nước châu Âu"],
      difficulty: 3
    },
    {
      id: 27,
      name: "Động vật có cánh",
      description: "Động vật bay từ nhỏ đến lớn",
      examples: ["🐝", "🦋", "🐦", "🦅", "❓"],
      allOptions: ["🦚", "🦆", "🦉", "🦜", "🐔", "🦢"],
      correctAnswer: "🦚",
      hints: ["Động vật bay đẹp nhất", "Công có cánh lớn"],
      difficulty: 2
    },
    {
      id: 28,
      name: "Trái cây theo màu",
      description: "Trái cây thay đổi màu sắc",
      examples: ["🍎", "🍌", "🍇", "🍊", "❓"],
      allOptions: ["🍓", "🥝", "🍑", "🍒", "🍉", "🥭"],
      correctAnswer: "🍓",
      hints: ["Trái cây màu đỏ", "Quay lại màu đầu"],
      difficulty: 1
    },
    {
      id: 29,
      name: "Biển báo giao thông",
      description: "Biển báo theo mức độ nguy hiểm",
      examples: ["⚠️", "🚸", "⛔", "🚫", "❓"],
      allOptions: ["🚷", "📵", "🛑", "🚳", "🚭", "🔞"],
      correctAnswer: "🚷",
      hints: ["Biển báo nghiêm cấm", "Cấm người đi bộ"],
      difficulty: 2
    },
    {
      id: 30,
      name: "Emoji cảm xúc mạnh",
      description: "Cảm xúc từ nhẹ đến mạnh",
      examples: ["😐", "😮", "😲", "🤯", "❓"],
      allOptions: ["💥", "🎊", "🤪", "🥴", "😵", "💫"],
      correctAnswer: "💥",
      hints: ["Sau sốc là gì?", "Cảm xúc mạnh nhất"],
      difficulty: 3
    }
  ], []);

  const [currentPattern, setCurrentPattern] = useState<PatternRule | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(0);
  const [score, setScore] = useState(0);
  const [patternIndex, setPatternIndex] = useState(0);
  const [feedback, setFeedback] = useState('Tìm quy tắc và chọn hình tiếp theo! 🔍');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hintIndex, setHintIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [availablePatterns, setAvailablePatterns] = useState<number[]>([]);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);

  // Khởi tạo patterns có sẵn
  useEffect(() => {
    const initialAvailable = patterns.map(p => p.id);
    setAvailablePatterns(initialAvailable);
    selectRandomPattern(initialAvailable);
  }, []);

  const selectRandomPattern = (availableIds: number[]) => {
    if (availableIds.length === 0) {
      setGameCompleted(true);
      setCurrentPattern(null);
      setFeedback('🎉 Chúc mừng! Bạn đã hoàn thành tất cả quy tắc! 🏆');
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableIds.length);
    const randomId = availableIds[randomIndex];
    const pattern = patterns.find(p => p.id === randomId);
    
    if (pattern) {
      setCurrentPattern(pattern);
      
      // Tạo 4 lựa chọn ngẫu nhiên (bao gồm đáp án đúng)
      const allOptions = [...pattern.allOptions];
      const correctAnswer = pattern.correctAnswer;
      
      // Xáo trộn tất cả lựa chọn
      const shuffledAll = [...allOptions].sort(() => Math.random() - 0.5);
      
      // Chọn 3 lựa chọn ngẫu nhiên khác với đáp án đúng
      const wrongOptions = shuffledAll.filter(opt => opt !== correctAnswer).slice(0, 3);
      
      // Tạo mảng 4 lựa chọn (3 sai + 1 đúng)
      const options = [...wrongOptions, correctAnswer];
      
      // Xáo trộn lần nữa để đáp án đúng không cố định vị trí
      const finalShuffled = [...options].sort(() => Math.random() - 0.5);
      setShuffledOptions(finalShuffled);
      
      // Tìm vị trí của đáp án đúng trong mảng đã xáo trộn
      const correctIndex = finalShuffled.indexOf(correctAnswer);
      setCorrectAnswerIndex(correctIndex);
      
      setFeedback(`Quy tắc ${patternIndex + 1}/30: ${pattern.description}`);
    }
  };

  const handleOptionClick = (optionIndex: number) => {
    if (selectedOption !== null || !currentPattern) return;
    
    setSelectedOption(optionIndex);
    
    // Tính điểm dựa trên độ khó
    const pointsEarned = currentPattern.difficulty * 10;
    
    if (optionIndex === correctAnswerIndex) {
      setScore(prev => prev + pointsEarned);
      setCorrectAnswers(prev => prev + 1);
      setFeedback(`Xuất sắc! +${pointsEarned} điểm! Con đã giải mã đúng quy tắc! 🎉`);
    } else {
      setFeedback(`Ôi, chưa đúng! Đáp án đúng là ${currentPattern.correctAnswer} 🤔`);
    }
    
    // Tự động chuyển pattern sau 2 giây
    setTimeout(() => {
      nextPattern();
    }, 2000);
  };

  const showHintMessage = () => {
    if (!currentPattern) return;
    
    if (hintIndex < currentPattern.hints.length) {
      setFeedback(`💡 Gợi ý: ${currentPattern.hints[hintIndex]}`);
      setHintIndex(prev => prev + 1);
      setShowHint(true);
    } else {
      setFeedback('Đã hết gợi ý! Hãy cố gắng suy nghĩ nhé! 💪');
    }
  };

  const nextPattern = () => {
    if (gameCompleted) return;
    
    // Loại bỏ pattern hiện tại khỏi danh sách có sẵn
    if (currentPattern) {
      const newAvailable = availablePatterns.filter(id => id !== currentPattern.id);
      setAvailablePatterns(newAvailable);
      
      // Chọn pattern ngẫu nhiên mới
      selectRandomPattern(newAvailable);
    }
    
    setPatternIndex(prev => prev + 1);
    setSelectedOption(null);
    setHintIndex(0);
    setShowHint(false);
  };

  const skipPattern = () => {
    if (gameCompleted) return;
    nextPattern();
    setFeedback('Đã bỏ qua quy tắc này! Thử quy tắc tiếp theo nào! ⏭️');
  };

  const resetGame = () => {
    const initialAvailable = patterns.map(p => p.id);
    setAvailablePatterns(initialAvailable);
    setScore(0);
    setCorrectAnswers(0);
    setPatternIndex(0);
    setGameCompleted(false);
    selectRandomPattern(initialAvailable);
    setFeedback('Bắt đầu lại trò chơi! Tìm quy tắc và chọn hình tiếp theo! 🔍');
  };

  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      
      // Xác định affect
      let affect: 'positive' | 'neutral' | 'negative' | 'surprised' = 'neutral';
      if (feedback.includes('Xuất sắc')) affect = 'positive';
      if (feedback.includes('chưa đúng')) affect = 'negative';
      if (showHint) affect = 'surprised';
      if (gameCompleted) affect = 'positive';
      
      // Tập trung vào examples
      const feature: BehavioralFeature = {
        timestamp: Date.now(),
        gazeX: aiData?.gazeX ?? 0.5,
        gazeY: aiData?.gazeY ?? 0.5,
        targetX: 50,
        targetY: 40,
        targetSize: 150,
        audioStimulus: null,
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
  }, [feedback, showHint, gameCompleted, onFeatureCapture, latestAIResult]);

  const progressPercentage = (patternIndex / 30) * 100;

  return (
    <div className="decode-game-container">
      <style>{styles}</style>

      <div className="decode-timer">
        ⏱️ {timeElapsed}s / {GAME_DURATION}s
      </div>
      
      <div className="decode-title">
        🔍 Giải Mã Quy Tắc
      </div>

      {!gameCompleted ? (
        <>
          <div className="decode-instruction">
            Quan sát quy luật và chọn hình tiếp theo!
          </div>

          {currentPattern && (
            <>
              <div className="decode-rule-display">
                Quy tắc: {currentPattern.description}
              </div>

              <div className="decode-examples">
                <div className="decode-example-title">
                  Ví dụ minh họa:
                </div>
                <div className="decode-example-items">
                  {currentPattern.examples.map((emoji, index) => (
                    <div 
                      key={index} 
                      className={`decode-example-item ${emoji === '❓' ? 'question' : ''}`}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
              </div>

              <div className="decode-choices">
                <div className="decode-choice-title">
                  Hình tiếp theo là gì?
                </div>
                <div className="decode-choice-options">
                  {shuffledOptions.map((emoji, index) => (
                    <div
                      key={index}
                      className={`decode-choice-option ${
                        selectedOption === index 
                          ? (index === correctAnswerIndex ? 'correct' : 'incorrect') 
                          : ''
                      }`}
                      onClick={() => handleOptionClick(index)}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="decode-feedback">
            {feedback}
          </div>

          <div className="decode-controls">
            <button 
              className="decode-control-btn hint"
              onClick={showHintMessage}
              disabled={selectedOption !== null}
            >
              <span>💡</span> Gợi ý
            </button>
            <button 
              className="decode-control-btn skip"
              onClick={skipPattern}
              disabled={selectedOption !== null}
            >
              <span>⏭️</span> Bỏ qua
            </button>
            <button 
              className="decode-control-btn next"
              onClick={nextPattern}
              disabled={selectedOption === null}
            >
              <span>➡️</span> Tiếp theo
            </button>
          </div>

          <div className="decode-progress">
            <div 
              className="decode-progress-bar" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <div style={{ 
            color: 'white', 
            fontSize: '20px', 
            fontWeight: 'bold',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '10px 20px',
            borderRadius: '15px',
            marginTop: '10px',
            textAlign: 'center'
          }}>
            <div>Điểm: {score} ✨ | Quy tắc: {patternIndex}/30</div>
            <div style={{ fontSize: '16px', opacity: 0.9 }}>
              Đúng: {correctAnswers} | Độ khó: {currentPattern?.difficulty === 1 ? 'Dễ' : currentPattern?.difficulty === 2 ? 'Trung bình' : 'Khó'}
            </div>
          </div>
        </>
      ) : (
        <div className="decode-complete-screen">
          <div className="decode-complete-emoji">🏆🎉</div>
          <div className="decode-complete-title">
            Chúc mừng bạn!
          </div>
          <div style={{ 
            fontSize: '24px', 
            color: '#6B7280', 
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            Bạn đã hoàn thành tất cả 30 quy tắc giải mã!
          </div>
          <div className="decode-complete-stats">
            <div>Điểm tổng: {score} ✨</div>
            <div>Tỉ lệ đúng: {patternIndex > 0 ? Math.round((correctAnswers / patternIndex) * 100) : 0}%</div>
            <div>Quy tắc đã giải: {patternIndex}/30</div>
          </div>
          <button 
            onClick={resetGame}
            style={{
              background: '#8B5CF6',
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

export default G4_5_DecodeRule;