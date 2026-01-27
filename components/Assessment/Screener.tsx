import React, { useState, useEffect } from 'react';
import '../../styles.css';

interface Question {
  id: number;
  text: string;
  options: { value: number; label: string }[];
  category: string;
}

interface ScreenerProps {
  onComplete?: (result: any) => void;
}

const Screener: React.FC<ScreenerProps> = ({ onComplete }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 phút = 300 giây
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [priorityLevel, setPriorityLevel] = useState<'low' | 'medium' | 'high' | null>(null);

  // Danh sách câu hỏi M-CHAT-R/F đã điều chỉnh văn hóa Việt
  const allQuestions: Question[] = [
    {
      id: 1,
      text: "Trẻ có thích được đung đưa, nhún nhảy trên đầu gối của bạn không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "social_interaction"
    },
    {
      id: 2,
      text: "Trẻ có quan tâm đến những đứa trẻ khác không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "social_interest"
    },
    {
      id: 3,
      text: "Trẻ có thích leo trèo lên đồ vật không? (Ví dụ: leo cầu thang, đồ đạc)",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "motor_skills"
    },
    {
      id: 4,
      text: "Trẻ có thích chơi trò ú òa (trốn tìm) với bạn không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "social_play"
    },
    {
      id: 5,
      text: "Trẻ có bao giờ giả vờ chơi không? (Ví dụ: giả vờ uống nước từ cốc rỗng, giả vờ nói chuyện điện thoại, hoặc cho búp bê ăn)",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "imaginative_play"
    },
    {
      id: 6,
      text: "Trẻ có dùng ngón trỏ để chỉ vào thứ gì đó mà trẻ muốn không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "communication"
    },
    {
      id: 7,
      text: "Trẻ có dùng ngón trỏ để chỉ vào thứ gì đó thú vị để bạn cùng xem không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "joint_attention"
    },
    {
      id: 8,
      text: "Trẻ có chơi đúng cách với đồ chơi nhỏ (xe ô tô, khối xếp hình) mà không cho vào miệng, vẫy, hay ném đi không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "play_skills"
    },
    {
      id: 9,
      text: "Trẻ có đưa đồ vật cho bạn để khoe với bạn không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "sharing"
    },
    {
      id: 10,
      text: "Trẻ có nhìn vào mắt bạn lâu hơn một hoặc hai giây không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "eye_contact"
    },
    {
      id: 11,
      text: "Trẻ có quá nhạy cảm với tiếng ồn không? (Ví dụ: bịt tai khi nghe tiếng ồn lớn)",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "sensory"
    },
    {
      id: 12,
      text: "Trẻ có mỉm cười khi nhìn thấy bạn hoặc khi bạn mỉm cười với trẻ không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "social_response"
    },
    {
      id: 13,
      text: "Trẻ có bắt chước bạn không? (Ví dụ: nếu bạn làm mặt hề, trẻ có bắt chước không?)",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "imitation"
    },
    {
      id: 14,
      text: "Trẻ có đáp lại khi được gọi tên không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "response_to_name"
    },
    {
      id: 15,
      text: "Nếu bạn chỉ vào đồ chơi ở phòng bên kia, trẻ có nhìn theo không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "gaze_following"
    },
    {
      id: 16,
      text: "Trẻ có biết đi không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "motor_development"
    },
    {
      id: 17,
      text: "Trẻ có nhìn vào đồ vật mà bạn đang nhìn không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "shared_attention"
    },
    {
      id: 18,
      text: "Trẻ có làm những cử động ngón tay bất thường gần mặt không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "stereotyped_behaviors"
    },
    {
      id: 19,
      text: "Trẻ có cố gắng thu hút sự chú ý của bạn vào hoạt động của trẻ không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "social_initiation"
    },
    {
      id: 20,
      text: "Bạn có bao giờ nghi ngờ trẻ bị điếc không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "hearing_concerns"
    }
  ];

  // Khởi tạo - chọn ngẫu nhiên 10 câu hỏi
  useEffect(() => {
    const shuffled = [...allQuestions]
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);
    
    setQuestions(shuffled);
    setLoading(false);
    
    // Bắt đầu đếm ngược thời gian
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const handleTimeUp = () => {
    if (!assessmentCompleted) {
      alert('Thời gian làm bài đã hết! Hệ thống sẽ tự động nộp bài.');
      calculateScore();
    }
  };

  const handleAnswer = (questionId: number, answerValue: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerValue
    }));
  };

  const calculateScore = () => {
    let totalScore = 0;
    const answeredQuestions = Object.keys(answers).length;
    
    // Tính điểm dựa trên câu trả lời
    // Trong M-CHAT-R/F, một số câu trả lời "Không" được tính điểm
    questions.forEach(question => {
      const answer = answers[question.id];
      if (answer !== undefined) {
        // Giả sử câu trả lời "Không" (0) cho một số câu hỏi là dấu hiệu cần quan tâm
        // Điều này cần được điều chỉnh theo tiêu chuẩn M-CHAT-R/F thực tế
        if ([1, 2, 4, 5, 6, 7, 9, 10, 12, 13, 14, 15, 17, 19].includes(question.id)) {
          // Những câu này trả lời "Không" là dấu hiệu đáng lo
          if (answer === 0) totalScore += 1;
        } else {
          // Những câu này trả lời "Có" là dấu hiệu đáng lo
          if (answer === 1) totalScore += 1;
        }
      }
    });
    
    setScore(totalScore);
    
    // Xác định mức độ ưu tiên
    let priority: 'low' | 'medium' | 'high';
    if (totalScore <= 2) {
      priority = 'low';
    } else if (totalScore <= 5) {
      priority = 'medium';
    } else {
      priority = 'high';
    }
    
    setPriorityLevel(priority);
    setAssessmentCompleted(true);
    
    // Lưu kết quả
    saveAssessmentResult(totalScore, priority, answeredQuestions);
  };

  const saveAssessmentResult = (finalScore: number, priority: string, answeredCount: number) => {
    const childData = localStorage.getItem('current_child');
    const parentData = localStorage.getItem('parent_user');
    const neuropathUser = localStorage.getItem('neuropath_user');
    
    if (!childData) {
      console.error('Missing child data');
      return;
    }
    
    const child = JSON.parse(childData);
    const parent = parentData ? JSON.parse(parentData) : null;
    const user = neuropathUser ? JSON.parse(neuropathUser) : null;
    
    const assessmentResult = {
      id: `assessment_${Date.now()}`,
      childId: child.id,
      parentId: parent?.id || user?.id,
      date: new Date().toISOString(),
      score: finalScore,
      priorityLevel: priority,
      totalQuestions: questions.length,
      answeredQuestions: answeredCount,
      answers: answers,
      questions: questions.map(q => ({
        id: q.id,
        text: q.text,
        answer: answers[q.id]
      })),
      timeSpent: 300 - timeRemaining // seconds
    };
    
    // Lưu kết quả đánh giá
    const existingResults = localStorage.getItem('assessment_results');
    let results = existingResults ? JSON.parse(existingResults) : [];
    results.push(assessmentResult);
    localStorage.setItem('assessment_results', JSON.stringify(results));
    
    // Lưu kết quả cho trẻ này
    localStorage.setItem(`screener_${child.id}`, JSON.stringify(assessmentResult));
    
    // Cập nhật thông tin trẻ với kết quả mới nhất
    const existingChildren = localStorage.getItem('children_profiles');
    if (existingChildren) {
      let children = JSON.parse(existingChildren);
      const childIndex = children.findIndex((c: any) => c.id === child.id);
      if (childIndex !== -1) {
        children[childIndex].lastAssessment = {
          date: assessmentResult.date,
          score: assessmentResult.score,
          priority: assessmentResult.priorityLevel
        };
        children[childIndex].screenerCompleted = true;
        localStorage.setItem('children_profiles', JSON.stringify(children));
      }
    }
    
    // Gọi callback onComplete nếu có
    if (onComplete) {
      onComplete(assessmentResult);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'Thấp';
      case 'medium':
        return 'Trung bình';
      case 'high':
        return 'Cao';
      default:
        return 'Không xác định';
    }
  };

  const getPriorityDescription = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'Trẻ có ít dấu hiệu cần quan tâm. Tiếp tục theo dõi sự phát triển của trẻ.';
      case 'medium':
        return 'Trẻ có một số dấu hiệu cần quan tâm. Nên đánh giá chuyên sâu hơn.';
      case 'high':
        return 'Trẻ có nhiều dấu hiệu cần quan tâm. Nên đánh giá chuyên sâu ngay.';
      default:
        return '';
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      const confirmSubmit = window.confirm(
        `Bạn đã trả lời ${answeredCount}/${questions.length} câu hỏi. Bạn có chắc chắn muốn nộp bài không?`
      );
      if (!confirmSubmit) return;
    }
    calculateScore();
  };

  if (loading) {
    return (
      <div className="screener-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải câu hỏi...</p>
        </div>
      </div>
    );
  }

  if (assessmentCompleted) {
    return (
      <div className="assessment-result-container">
        <div className="result-card">
          <h2 className="result-title">Kết quả sàng lọc sơ bộ</h2>
          
          <div className="score-section">
            <div className="score-circle">
              <span className="score-number">{score}</span>
              <span className="score-label">/ {questions.length}</span>
            </div>
            <p className="score-description">Đi số sàng lọc</p>
          </div>
          
          <div className={`priority-section priority-${priorityLevel}`}>
            <h3>Mức độ ưu tiên đánh giá: {getPriorityText(priorityLevel!)}</h3>
            <p>{getPriorityDescription(priorityLevel!)}</p>
          </div>
          
          <div className="result-details">
            <h4>Thông tin chi tiết:</h4>
            <ul>
              <li>Số câu hỏi: {questions.length}</li>
              <li>Số câu đã trả lời: {Object.keys(answers).length}</li>
              <li>Thời gian làm bài: {formatTime(300 - timeRemaining)}</li>
              <li>Ngày đánh giá: {new Date().toLocaleDateString('vi-VN')}</li>
            </ul>
          </div>
          
          <div className="result-actions">
            <button 
              className="back-button"
              onClick={() => {
                if (onComplete) {
                  onComplete({
                    score,
                    priorityLevel,
                    totalQuestions: questions.length,
                    answeredQuestions: Object.keys(answers).length,
                    timeSpent: 300 - timeRemaining,
                    date: new Date().toISOString()
                  });
                }
              }}
            >
              Tiếp tục đến game đánh giá
            </button>
            <button 
              className="detail-button"
              onClick={() => {
                // Hiển thị chi tiết câu trả lời
                alert('Chi tiết câu trả lời đã được lưu. Bạn có thể xem trong hồ sơ trẻ.');
              }}
            >
              Xem chi tiết câu trả lời
            </button>
          </div>
          
          <div className="disclaimer">
            <p>
              <strong>Lưu ý:</strong> Đây chỉ là kết quả sàng lọc sơ bộ. 
              Kết quả này không thay thế cho chẩn đoán chuyên môn. 
              Nếu có lo ngại về sự phát triển của trẻ, vui lòng tham khảo ý kiến chuyên gia.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="screener-container">
      <div className="screener-header">
        <h2>Bảng câu hỏi sàng lọc sơ bộ</h2>
        <div className="header-info">
          <div className="timer">
            ⏱️ Thời gian còn lại: {formatTime(timeRemaining)}
          </div>
          <div className="progress">
            Câu {currentQuestionIndex + 1}/{questions.length}
          </div>
        </div>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="question-card">
        <div className="question-header">
          <span className="question-number">Câu hỏi {currentQuestionIndex + 1}</span>
          <span className="question-category">({currentQuestion.category})</span>
        </div>
        
        <p className="question-text">{currentQuestion.text}</p>
        
        <div className="options-container">
          {currentQuestion.options.map(option => (
            <button
              key={option.value}
              className={`option-button ${answers[currentQuestion.id] === option.value ? 'selected' : ''}`}
              onClick={() => handleAnswer(currentQuestion.id, option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="navigation-buttons">
        <button
          className="nav-button prev-button"
          onClick={handlePrev}
          disabled={currentQuestionIndex === 0}
        >
          ← Câu trước
        </button>
        
        {currentQuestionIndex < questions.length - 1 ? (
          <button
            className="nav-button next-button"
            onClick={handleNext}
            disabled={answers[currentQuestion.id] === undefined}
          >
            Câu tiếp theo →
          </button>
        ) : (
          <button
            className="nav-button submit-button"
            onClick={handleSubmit}
            disabled={Object.keys(answers).length === 0}
          >
            Hoàn thành đánh giá
          </button>
        )}
      </div>
      
      <div className="question-indicators">
        {questions.map((_, index) => (
          <div
            key={index}
            className={`indicator ${index === currentQuestionIndex ? 'active' : ''} ${answers[questions[index].id] !== undefined ? 'answered' : ''}`}
            onClick={() => setCurrentQuestionIndex(index)}
          >
            {index + 1}
          </div>
        ))}
      </div>
      
      <div className="instructions">
        <h4>Hướng dẫn:</h4>
        <ul>
          <li>Chọn câu trả lời đúng nhất với tình trạng của trẻ</li>
          <li>Bạn có thể quay lại chỉnh sửa câu trả lời bất kỳ lúc nào</li>
          <li>Thời gian tối đa: 5 phút</li>
          <li>Hệ thống sẽ tự động nộp bài khi hết giờ</li>
          <li>Sau khi hoàn thành, bạn sẽ được chuyển đến game đánh giá</li>
        </ul>
      </div>
    </div>
  );
};

export default Screener;