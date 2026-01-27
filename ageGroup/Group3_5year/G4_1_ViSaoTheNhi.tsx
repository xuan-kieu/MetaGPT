import React, { useState, useEffect, useRef } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G4_1_WhySo: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- CSS NỘI BỘ ---
  const styles = `
    .why-game-container {
      width: 100%;
      height: 100%;
      position: relative;
      background: linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }

    .why-timer {
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

    .why-title {
      text-align: center;
      color: white;
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
      text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
      background: rgba(0, 0, 0, 0.3);
      padding: 10px 30px;
      border-radius: 20px;
    }

    .why-scenario {
      background: rgba(255, 255, 255, 0.95);
      padding: 25px;
      border-radius: 25px;
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      color: #1F2937;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      max-width: 90%;
      margin: 20px 0;
      min-height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1.4;
    }

    .why-question {
      background: rgba(255, 255, 255, 0.9);
      padding: 20px;
      border-radius: 20px;
      text-align: center;
      font-size: 22px;
      font-weight: bold;
      color: #374151;
      margin: 10px 0;
      width: 90%;
    }

    .why-options {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      width: 90%;
      max-width: 700px;
      margin: 20px 0;
    }

    .why-option {
      background: white;
      border-radius: 20px;
      padding: 25px;
      text-align: center;
      font-size: 20px;
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
      min-height: 150px;
    }

    .why-option:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
    }

    .why-option.correct {
      border-color: #10B981;
      background: #D1FAE5;
      animation: correctGlow 0.5s ease;
    }

    .why-option.incorrect {
      border-color: #EF4444;
      background: #FEE2E2;
      animation: shake 0.5s ease;
    }

    .why-option-emoji {
      font-size: 48px;
    }

    .why-feedback {
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
      border-left: 6px solid #3B82F6;
    }

    .why-progress {
      width: 80%;
      height: 12px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      overflow: hidden;
      margin: 10px 0;
    }

    .why-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #FCD34D, #F59E0B);
      border-radius: 10px;
      transition: width 0.5s ease;
    }

    .why-explanation {
      background: rgba(255, 255, 255, 0.9);
      padding: 20px;
      border-radius: 15px;
      font-size: 18px;
      color: #4B5563;
      margin: 10px 0;
      width: 90%;
      text-align: center;
      border-top: 4px solid #10B981;
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

    @media (max-width: 768px) {
      .why-options {
        grid-template-columns: 1fr;
        gap: 15px;
      }
      
      .why-title {
        font-size: 24px;
        padding: 8px 20px;
      }
      
      .why-scenario {
        font-size: 20px;
        padding: 20px;
        min-height: 100px;
      }
      
      .why-question {
        font-size: 18px;
        padding: 15px;
      }
      
      .why-option {
        padding: 20px;
        min-height: 120px;
        font-size: 18px;
      }
      
      .why-option-emoji {
        font-size: 36px;
      }
      
      .why-feedback {
        font-size: 18px;
        padding: 15px 20px;
      }
    }
  `;

  // --- LOGIC ---
  interface Question {
    id: number;
    scenario: string;
    question: string;
    options: {
      text: string;
      emoji: string;
      correct: boolean;
      explanation: string;
    }[];
    correctAnswer: string;
  }

  const GAME_DURATION = 240;
  
  const questions: Question[] = [
    {
      id: 1,
      scenario: "Mẹ để một cốc nước nóng trên bàn. Sau 10 phút, cốc nước trở nên ấm hơn.",
      question: "Vì sao cốc nước nóng trở nên ấm hơn?",
      options: [
        { text: "Vì nước tự động nguội đi", emoji: "❄️", correct: true, explanation: "Đúng! Nước nóng truyền nhiệt ra môi trường nên nguội dần." },
        { text: "Vì cốc tự làm mát nước", emoji: "🧊", correct: false, explanation: "Cốc không tự làm mát nước được." },
        { text: "Vì có gió thổi vào", emoji: "💨", correct: false, explanation: "Gió chỉ làm nguội nhanh hơn, không phải nguyên nhân chính." },
        { text: "Vì nước bốc hơi hết", emoji: "☁️", correct: false, explanation: "Nước có bốc hơi nhưng không hết trong 10 phút." }
      ],
      correctAnswer: "Vì nước tự động nguội đi"
    },
    {
      id: 2,
      scenario: "Bé chạy nhanh trong công viên, tim đập nhanh hơn và thở gấp hơn.",
      question: "Vì sao tim đập nhanh khi chạy?",
      options: [
        { text: "Vì cơ thể cần nhiều oxy hơn", emoji: "💨", correct: true, explanation: "Đúng! Khi vận động, cơ thể cần nhiều oxy để tạo năng lượng." },
        { text: "Vì tim muốn chạy cùng bé", emoji: "🏃", correct: false, explanation: "Tim không có suy nghĩ riêng." },
        { text: "Vì bé sợ hãi", emoji: "😨", correct: false, explanation: "Chạy vui không gây sợ hãi." },
        { text: "Vì thời tiết nóng", emoji: "☀️", correct: false, explanation: "Thời tiết không phải nguyên nhân chính." }
      ],
      correctAnswer: "Vì cơ thể cần nhiều oxy hơn"
    },
    {
      id: 3,
      scenario: "Sau khi tưới nước, cây xanh tốt hơn và lá tươi hơn.",
      question: "Vì sao cây cần nước?",
      options: [
        { text: "Vì nước giúp cây quang hợp", emoji: "🌿", correct: true, explanation: "Đúng! Nước giúp cây tạo chất dinh dưỡng từ ánh sáng." },
        { text: "Vì cây thích uống nước", emoji: "🥤", correct: false, explanation: "Cây không uống nước như người." },
        { text: "Vì nước làm đẹp cây", emoji: "💅", correct: false, explanation: "Nước không chỉ làm đẹp mà cần cho sự sống." },
        { text: "Vì nước rửa sạch lá", emoji: "🚿", correct: false, explanation: "Rửa lá chỉ là tác dụng phụ." }
      ],
      correctAnswer: "Vì nước giúp cây quang hợp"
    },
  
  {
    id: 4,
    scenario: "Khi mặt trời lặn, bầu trời chuyển từ màu xanh sang màu cam đỏ.",
    question: "Vì sao bầu trời có màu cam đỏ khi hoàng hôn?",
    options: [
      { text: "Vì ánh sáng mặt trời xuyên qua nhiều không khí hơn", emoji: "🌅", correct: true, explanation: "Đúng! Ánh sáng xanh bị tán xạ, chỉ còn lại ánh sáng đỏ cam." },
      { text: "Vì mặt trời thay đổi màu sắc", emoji: "🎨", correct: false, explanation: "Mặt trời không thay đổi màu, chỉ do hiện tượng tán xạ ánh sáng." },
      { text: "Vì mây được nhuộm màu", emoji: "☁️", correct: false, explanation: "Mây không bị nhuộm màu, chỉ phản chiếu ánh sáng mặt trời." },
      { text: "Vì trời sắp tối nên đổi màu", emoji: "🌙", correct: false, explanation: "Màu sắc thay đổi do hiện tượng vật lý, không phải vì trời tối." }
    ],
    correctAnswer: "Vì ánh sáng mặt trời xuyên qua nhiều không khí hơn"
  },
  {
    id: 5,
    scenario: "Sau cơn mưa, trên lá cây xuất hiện những giọt nước long lanh.",
    question: "Vì sao nước đọng thành giọt tròn trên lá?",
    options: [
      { text: "Vì lá có lớp phủ không thấm nước", emoji: "💧", correct: true, explanation: "Đúng! Lá có lớp cutin khiến nước không thấm, tạo thành giọt tròn do sức căng bề mặt." },
      { text: "Vì nước thích hình tròn", emoji: "⭕", correct: false, explanation: "Nước không có sở thích, đây là hiện tượng vật lý." },
      { text: "Vì gió thổi tạo thành giọt", emoji: "💨", correct: false, explanation: "Gió không tạo hình dạng giọt nước." },
      { text: "Vì lá tiết ra chất dính", emoji: "🍯", correct: false, explanation: "Lá không tiết chất dính giữ nước." }
    ],
    correctAnswer: "Vì lá có lớp phủ không thấm nước"
  },
  {
    id: 6,
    scenario: "Khi thổi vào mặt bàn có bụi, bụi bay đi.",
    question: "Vì sao bụi bay đi khi thổi?",
    options: [
      { text: "Vì luồng khí đẩy bụi di chuyển", emoji: "💨", correct: true, explanation: "Đúng! Không khí chuyển động tạo lực đẩy làm bụi di chuyển." },
      { text: "Vì bụi sợ hơi thở", emoji: "😨", correct: false, explanation: "Bụi không có cảm xúc, đây là tác dụng của lực vật lý." },
      { text: "Vì bụi nhẹ nên dễ bay", emoji: "🪶", correct: false, explanation: "Bụi nhẹ chỉ là điều kiện, nguyên nhân chính là lực đẩy của không khí." },
      { text: "Vì mặt bàn trơn", emoji: "🪣", correct: false, explanation: "Độ trơn không phải là nguyên nhân chính." }
    ],
    correctAnswer: "Vì luồng khí đẩy bụi di chuyển"
  },
  {
    id: 7,
    scenario: "Một cục đá bỏ vào cốc nước nóng tan chảy nhanh hơn vào cốc nước lạnh.",
    question: "Vì sao đá tan nhanh trong nước nóng?",
    options: [
      { text: "Vì nhiệt độ cao làm đá tan nhanh", emoji: "🔥", correct: true, explanation: "Đúng! Nhiệt độ cao truyền nhiệt năng đến đá làm nó tan nhanh hơn." },
      { text: "Vì nước nóng làm đá sợ", emoji: "😰", correct: false, explanation: "Đá không có cảm xúc, đây là hiện tượng vật lý." },
      { text: "Vì nước nóng nhiều hơn nước lạnh", emoji: "📊", correct: false, explanation: "Khối lượng nước không ảnh hưởng chính đến tốc độ tan." },
      { text: "Vì đá thích nước nóng", emoji: "❤️", correct: false, explanation: "Đá không có sở thích, đây là phản ứng vật lý." }
    ],
    correctAnswer: "Vì nhiệt độ cao làm đá tan nhanh"
  },
  {
    id: 8,
    scenario: "Khi trời lạnh, thở ra thấy khói trắng.",
    question: "Vì sao thở ra có khói trắng khi trời lạnh?",
    options: [
      { text: "Vì hơi nước trong hơi thở ngưng tụ", emoji: "❄️", correct: true, explanation: "Đúng! Hơi nước gặp không khí lạnh ngưng tụ thành những giọt nước nhỏ li ti." },
      { text: "Vì miệng có lửa", emoji: "🔥", correct: false, explanation: "Miệng không có lửa, đây là hiện tượng ngưng tụ." },
      { text: "Vì cơ thể thải khí trắng", emoji: "👻", correct: false, explanation: "Cơ thể không thải ra khí trắng, chỉ là hơi nước." },
      { text: "Vì trời lạnh tạo màu trắng", emoji: "🎨", correct: false, explanation: "Không khí lạnh không tạo màu, chỉ gây ngưng tụ." }
    ],
    correctAnswer: "Vì hơi nước trong hơi thở ngưng tụ"
  },
  {
    id: 9,
    scenario: "Chong chóng quay khi có gió thổi.",
    question: "Vì sao chong chóng quay khi có gió?",
    options: [
      { text: "Vì gió tác động lực lên cánh chong chóng", emoji: "💨", correct: true, explanation: "Đúng! Gió tạo lực đẩy làm các cánh chong chóng chuyển động." },
      { text: "Vì chong chóng thích gió", emoji: "😊", correct: false, explanation: "Chong chóng không có cảm xúc, đây là nguyên lý vật lý." },
      { text: "Vì gió mang điện làm quay", emoji: "⚡", correct: false, explanation: "Gió không mang điện đặc biệt." },
      { text: "Vì chong chóng tự động quay", emoji: "🤖", correct: false, explanation: "Chong chóng không tự quay nếu không có gió." }
    ],
    correctAnswer: "Vì gió tác động lực lên cánh chong chóng"
  },
  {
    id: 10,
    scenario: "Khi nhỏ nước chanh vào sữa, sữa vón cục.",
    question: "Vì sao sữa vón cục khi gặp nước chanh?",
    options: [
      { text: "Vì axit trong chanh làm biến tính protein sữa", emoji: "🍋", correct: true, explanation: "Đúng! Axit citric trong chanh làm protein trong sữa kết tủa." },
      { text: "Vì sữa ghét chanh", emoji: "😠", correct: false, explanation: "Đây là phản ứng hóa học, không phải cảm xúc." },
      { text: "Vì chanh làm sữa chua", emoji: "🥛", correct: false, explanation: "Cần vi khuẩn lên men mới thành sữa chua." },
      { text: "Vì nhiệt độ thay đổi", emoji: "🌡️", correct: false, explanation: "Nhiệt độ không phải nguyên nhân chính trong trường hợp này." }
    ],
    correctAnswer: "Vì axit trong chanh làm biến tính protein sữa"
  },
  {
    id: 11,
    scenario: "Lá cây ngả về phía có ánh sáng mặt trời.",
    question: "Vì sao lá cây hướng về phía ánh sáng?",
    options: [
      { text: "Vì cây cần ánh sáng để quang hợp", emoji: "🌿", correct: true, explanation: "Đúng! Cây hướng sáng để thu nhận nhiều ánh sáng nhất cho quá trình quang hợp." },
      { text: "Vì lá thích ánh sáng", emoji: "😍", correct: false, explanation: "Đây là phản ứng sinh lý, không phải sở thích." },
      { text: "Vì gió thổi lá về hướng đó", emoji: "💨", correct: false, explanation: "Gió không xác định hướng cố định." },
      { text: "Vì ánh sáng làm lá đẹp", emoji: "💅", correct: false, explanation: "Mục đích chính là sinh tồn, không phải làm đẹp." }
    ],
    correctAnswer: "Vì cây cần ánh sáng để quang hợp"
  },
  {
    id: 12,
    scenario: "Khi đổ nước sôi vào cốc thủy tinh dày, cốc dễ vỡ hơn cốc mỏng.",
    question: "Vì sao cốc thủy tinh dày dễ vỡ khi đổ nước sôi?",
    options: [
      { text: "Vì sự giãn nở không đều do chênh lệch nhiệt", emoji: "🔥", correct: true, explanation: "Đúng! Phần trong giãn nở nhanh hơn phần ngoài, tạo ứng suất làm vỡ cốc." },
      { text: "Vì thủy tinh dày yếu hơn", emoji: "🪨", correct: false, explanation: "Thủy tinh dày thường chắc hơn, nhưng kém chịu sốc nhiệt." },
      { text: "Vì nước sôi nặng hơn", emoji: "⚖️", correct: false, explanation: "Trọng lượng không phải nguyên nhân chính." },
      { text: "Vì thủy tinh sợ nóng", emoji: "😨", correct: false, explanation: "Đây là hiện tượng vật lý, không phải cảm xúc." }
    ],
    correctAnswer: "Vì sự giãn nở không đều do chênh lệch nhiệt"
  },
  {
    id: 13,
    scenario: "Sau khi ăn no, cảm thấy buồn ngủ.",
    question: "Vì sao ăn no lại buồn ngủ?",
    options: [
      { text: "Vì máu tập trung nhiều cho hệ tiêu hóa", emoji: "🩸", correct: true, explanation: "Đúng! Máu dồn đến dạ dày và ruột nhiều hơn, giảm lượng máu lên não tạm thời." },
      { text: "Vì thức ăn chứa chất gây ngủ", emoji: "💤", correct: false, explanation: "Thức ăn thông thường không chứa chất gây ngủ đặc biệt." },
      { text: "Vì cơ thể mệt sau khi ăn", emoji: "😴", correct: false, explanation: "Mệt không phải do vận động, mà do quá trình tiêu hóa." },
      { text: "Vì bụng no gây áp lực", emoji: "🎈", correct: false, explanation: "Áp lực cơ học không phải nguyên nhân chính." }
    ],
    correctAnswer: "Vì máu tập trung nhiều cho hệ tiêu hóa"
  },
  {
    id: 14,
    scenario: "Khi bật quạt, cảm thấy mát hơn.",
    question: "Vì sao quạt làm mát?",
    options: [
      { text: "Vì quạt thổi bay lớp không khí nóng quanh da", emoji: "💨", correct: true, explanation: "Đúng! Quạt tăng cường bay hơi mồ hôi và thay thế không khí nóng bằng không khí mát hơn." },
      { text: "Vì quạt thổi ra gió lạnh", emoji: "❄️", correct: false, explanation: "Quạt không tạo ra lạnh, chỉ di chuyển không khí." },
      { text: "Vì quạt hút nhiệt đi", emoji: "🧲", correct: false, explanation: "Quạt không hút nhiệt, điều hòa mới có chức năng này." },
      { text: "Vì quạt làm không khí đông đặc", emoji: "🪨", correct: false, explanation: "Không khí không bị đông đặc bởi quạt." }
    ],
    correctAnswer: "Vì quạt thổi bay lớp không khí nóng quanh da"
  },
  {
    id: 15,
    scenario: "Muỗi thường bay vo ve quanh tai vào ban đêm.",
    question: "Vì sao muỗi thích bay gần tai?",
    options: [
      { text: "Vì muỗi bị thu hút bởi khí CO2 từ hơi thở", emoji: "🦟", correct: true, explanation: "Đúng! Muỗi định vị con mồi qua khí CO2, và tai là nơi gần đường thở." },
      { text: "Vì muỗi thích nghe tiếng động", emoji: "👂", correct: false, explanation: "Muỗi không bị thu hút bởi âm thanh theo cách này." },
      { text: "Vì tai tỏa nhiệt nhiều", emoji: "🔥", correct: false, explanation: "Nhiệt độ toàn cơ thể đều tỏa nhiệt, không chỉ tai." },
      { text: "Vì muỗi muốn nói chuyện", emoji: "🗣️", correct: false, explanation: "Muỗi không có ý định giao tiếp với người." }
    ],
    correctAnswer: "Vì muỗi bị thu hút bởi khí CO2 từ hơi thở"
  },
  {
    id: 16,
    scenario: "Khi cắm ống hút vào hộp sữa, sữa dâng lên trong ống hút.",
    question: "Vì sao sữa dâng lên trong ống hút?",
    options: [
      { text: "Vì áp suất không khí trong ống hút giảm", emoji: "📉", correct: true, explanation: "Đúng! Khi hút, áp suất trong ống giảm, áp suất khí quyển đẩy sữa lên." },
      { text: "Vì sữa tự động chảy lên", emoji: "⬆️", correct: false, explanation: "Sữa không tự chảy ngược lên do trọng lực." },
      { text: "Vì ống hút hút sữa lên", emoji: "🧲", correct: false, explanation: "Ống hút không có lực hút, chỉ tạo chênh lệch áp suất." },
      { text: "Vì sữa nhẹ hơn không khí", emoji: "🪶", correct: false, explanation: "Sữa nặng hơn không khí rất nhiều." }
    ],
    correctAnswer: "Vì áp suất không khí trong ống hút giảm"
  },
  {
    id: 17,
    scenario: "Trời nắng gắt, sờ vào kim loại thấy nóng hơn sờ vào gỗ.",
    question: "Vì sao kim loại nóng hơn gỗ dưới trời nắng?",
    options: [
      { text: "Vì kim loại dẫn nhiệt tốt hơn", emoji: "🔥", correct: true, explanation: "Đúng! Kim loại truyền nhiệt nhanh vào tay, còn gỗ dẫn nhiệt kém nên cảm thấy mát hơn." },
      { text: "Vì kim loại hấp thụ nhiều ánh sáng hơn", emoji: "☀️", correct: false, explanation: "Cả hai đều hấp thụ nhiệt, nhưng khả năng dẫn nhiệt khác nhau." },
      { text: "Vì gỗ phản chiếu ánh sáng", emoji: "✨", correct: false, explanation: "Gỗ thường hấp thụ nhiệt chứ không phản chiếu nhiều." },
      { text: "Vì kim loại có nhiệt độ riêng", emoji: "🌡️", correct: false, explanation: "Cùng điều kiện, nhiệt độ cân bằng như nhau, nhưng cảm giác khác do dẫn nhiệt." }
    ],
    correctAnswer: "Vì kim loại dẫn nhiệt tốt hơn"
  },
  {
    id: 18,
    scenario: "Khi đứng gần biển, cảm thấy mát hơn trong đất liền.",
    question: "Vì sao gần biển mát hơn?",
    options: [
      { text: "Vì nước biển bay hơi hấp thụ nhiệt", emoji: "🌊", correct: true, explanation: "Đúng! Quá trình bay hơi nước biển lấy đi nhiệt lượng từ không khí." },
      { text: "Vì biển thổi gió mát", emoji: "💨", correct: false, explanation: "Gió không phải lúc nào cũng có, nguyên nhân chính là bay hơi nước." },
      { text: "Vì cát ở biển mát", emoji: "🏖️", correct: false, explanation: "Cát thường nóng hơn do hấp thụ nhiệt." },
      { text: "Vì biển màu xanh làm mát", emoji: "🎨", correct: false, explanation: "Màu sắc không trực tiếp làm mát không khí." }
    ],
    correctAnswer: "Vì nước biển bay hơi hấp thụ nhiệt"
  },
  {
    id: 19,
    scenario: "Khi nhúng tờ giấy vào nước, giấy bị ướt và mềm đi.",
    question: "Vì sao giấy bị ướt khi gặp nước?",
    options: [
      { text: "Vì giấy hấp thụ nước qua các sợi xenlulozơ", emoji: "📝", correct: true, explanation: "Đúng! Cấu trúc sợi của giấy có khoảng trống để nước thấm vào." },
      { text: "Vì giấy tan trong nước", emoji: "🫗", correct: false, explanation: "Giấy không tan, chỉ thấm nước và có thể bị rách khi ướt." },
      { text: "Vì nước ăn mòn giấy", emoji: "⚠️", correct: false, explanation: "Nước không ăn mòn giấy, chỉ làm yếu liên kết sợi." },
      { text: "Vì giấy sợ nước", emoji: "😨", correct: false, explanation: "Đây là tính chất vật lý, không phải cảm xúc." }
    ],
    correctAnswer: "Vì giấy hấp thụ nước qua các sợi xenlulozơ"
  },
  {
    id: 20,
    scenario: "Khi đun nước, xuất hiện bong bóng khí nhỏ trước khi sôi.",
    question: "Vì sao có bong bóng trước khi nước sôi?",
    options: [
      { text: "Vì không khí hòa tan trong nước thoát ra", emoji: "🫧", correct: true, explanation: "Đúng! Khi nhiệt độ tăng, độ tan của khí giảm, khí thoát ra tạo bong bóng." },
      { text: "Vì nước bắt đầu sôi từ dưới đáy", emoji: "🔥", correct: false, explanation: "Bong bóng này là không khí, chưa phải hơi nước." },
      { text: "Vì nước có ga", emoji: "🥤", correct: false, explanation: "Nước thường không chứa ga." },
      { text: "Vì nhiệt tạo ra khí mới", emoji: "🧪", correct: false, explanation: "Nhiệt không tạo khí mới, chỉ làm khí hòa tan thoát ra." }
    ],
    correctAnswer: "Vì không khí hòa tan trong nước thoát ra"
  },
  {
    id: 21,
    scenario: "Sau khi chạy nhanh, cơ bắp cảm thấy mỏi.",
    question: "Vì sao cơ bắp bị mỏi sau khi vận động?",
    options: [
      { text: "Vì cơ bắp tích tụ axit lactic", emoji: "💪", correct: true, explanation: "Đúng! Khi thiếu oxy, cơ bắp chuyển hóa đường tạo axit lactic gây mỏi." },
      { text: "Vì cơ bắp bị rách", emoji: "🩹", correct: false, explanation: "Vận động bình thường không làm rách cơ, chỉ gây mỏi." },
      { text: "Vì cơ bắp muốn nghỉ ngơi", emoji: "😴", correct: false, explanation: "Đây là phản ứng hóa sinh, không phải ý muốn." },
      { text: "Vì cơ bắp bị lạnh", emoji: "❄️", correct: false, explanation: "Vận động làm nóng cơ, không làm lạnh." }
    ],
    correctAnswer: "Vì cơ bắp tích tụ axit lactic"
  },
  {
    id: 22,
    scenario: "Khi đánh răng, kem đánh răng tạo bọt.",
    question: "Vì sao kem đánh răng tạo bọt?",
    options: [
      { text: "Vì kem chứa chất tạo bọt như sodium lauryl sulfate", emoji: "🪥", correct: true, explanation: "Đúng! Chất hoạt động bề mặt trong kem làm giảm sức căng bề mặt, bẫy khí tạo bọt." },
      { text: "Vì kem có ga", emoji: "🥤", correct: false, explanation: "Kem đánh răng không chứa khí ga." },
      { text: "Vì nước và kem phản ứng hóa học", emoji: "⚗️", correct: false, explanation: "Không có phản ứng hóa học tạo bọt, chỉ là hiện tượng vật lý." },
      { text: "Vì bàn chải xoay tạo bọt", emoji: "🌀", correct: false, explanation: "Bàn chải giúp tạo bọt nhưng nguyên nhân là chất tạo bọt trong kem." }
    ],
    correctAnswer: "Vì kem chứa chất tạo bọt như sodium lauryl sulfate"
  },
  {
    id: 23,
    scenario: "Mặt trăng lúc tròn lúc khuyết.",
    question: "Vì sao mặt trăng thay đổi hình dạng?",
    options: [
      { text: "Vì ánh sáng mặt trời chiếu vào phần khác nhau của mặt trăng", emoji: "🌗", correct: true, explanation: "Đúng! Mặt trăng không tự phát sáng, ta thấy phần được mặt trời chiếu sáng từ Trái Đất." },
      { text: "Vì mặt trăng tự xoay và thay đổi", emoji: "🔄", correct: false, explanation: "Mặt trăng luôn hướng một mặt về Trái Đất, sự thay đổi do góc chiếu sáng." },
      { text: "Vì mây che khuất một phần", emoji: "☁️", correct: false, explanation: "Mây không phải nguyên nhân của các pha mặt trăng." },
      { text: "Vì mặt trăng bị ăn dần", emoji: "🍽️", correct: false, explanation: "Đây chỉ là truyền thuyết, không đúng khoa học." }
    ],
    correctAnswer: "Vì ánh sáng mặt trời chiếu vào phần khác nhau của mặt trăng"
  }
  ];

  const [currentQuestion, setCurrentQuestion] = useState<Question>(questions[0]);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [feedback, setFeedback] = useState('Hãy chọn câu trả lời đúng! 🤔');
  const [explanation, setExplanation] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleOptionClick = (optionIndex: number) => {
    if (selectedOption !== null) return;
    
    const option = currentQuestion.options[optionIndex];
    setSelectedOption(optionIndex);
    setShowExplanation(true);
    
    if (option.correct) {
      setScore(prev => prev + 1);
      setFeedback('Chính xác! Con giỏi quá! 🎉');
    } else {
      setFeedback('Ôi, chưa đúng rồi! Cùng tìm hiểu nhé! 💡');
    }
    
    setExplanation(option.explanation);
    setTotalAnswered(prev => prev + 1);
    
    // Chuyển câu hỏi sau 3 giây
    setTimeout(() => {
      nextQuestion();
    }, 3000);
  };

  const nextQuestion = () => {
    const remainingQuestions = questions.filter(q => q.id !== currentQuestion.id);
    const randomIndex = Math.floor(Math.random() * remainingQuestions.length);
    setCurrentQuestion(remainingQuestions[randomIndex]);
    setFeedback('Hãy chọn câu trả lời đúng! 🤔');
    setExplanation('');
    setSelectedOption(null);
    setShowExplanation(false);
  };

  useEffect(() => {
    // Xáo trộn câu hỏi
    const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
    setCurrentQuestion(shuffledQuestions[0]);
  }, []);

  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      
      // Xác định affect dựa trên trạng thái
      let affect: 'positive' | 'neutral' | 'negative' | 'surprised' = 'neutral';
      if (feedback.includes('Chính xác')) affect = 'positive';
      if (feedback.includes('chưa đúng')) affect = 'negative';
      if (showExplanation) affect = 'surprised';
      
      // Tập trung vào câu hỏi
      const feature: BehavioralFeature = {
        timestamp: Date.now(),
        gazeX: aiData?.gazeX ?? 0.5,
        gazeY: aiData?.gazeY ?? 0.5,
        targetX: 50,
        targetY: 40,
        targetSize: 100,
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
  }, [currentQuestion, feedback, showExplanation, onFeatureCapture, latestAIResult]);

  const progressPercentage = totalAnswered > 0 ? (score / totalAnswered) * 100 : 0;

  return (
    <div className="why-game-container">
      <style>{styles}</style>

      <div className="why-timer">
        ⏱️ {timeElapsed}s / {GAME_DURATION}s
      </div>
      
      <div className="why-title">
        🤔 Vì Sao Thế Nhỉ?
      </div>

      <div className="why-scenario">
        {currentQuestion.scenario}
      </div>

      <div className="why-question">
        {currentQuestion.question}
      </div>

      <div className="why-options">
        {currentQuestion.options.map((option, index) => (
          <div
            key={index}
            className={`why-option ${
              selectedOption === index 
                ? (option.correct ? 'correct' : 'incorrect') 
                : ''
            }`}
            onClick={() => handleOptionClick(index)}
          >
            <div className="why-option-emoji">
              {option.emoji}
            </div>
            <div>{option.text}</div>
          </div>
        ))}
      </div>

      <div className="why-feedback">
        {feedback}
      </div>

      {showExplanation && explanation && (
        <div className="why-explanation">
          💡 {explanation}
        </div>
      )}

      <div className="why-progress">
        <div 
          className="why-progress-bar" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      <div style={{ 
        color: 'white', 
        fontSize: '20px', 
        fontWeight: 'bold',
        background: 'rgba(0, 0, 0, 0.3)',
        padding: '10px 20px',
        borderRadius: '15px'
      }}>
        Câu đúng: {score}/{totalAnswered} 🏆
      </div>
    </div>
  );
};

export default G4_1_WhySo;