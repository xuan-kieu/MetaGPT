import React, { useState, useEffect } from 'react';
import * as db from '../../services/dbService';
import '../../styles.css';

interface Question {
  id: number;
  text: string;
  options: { value: number; label: string }[];
  category: string;
  // true nếu trả lời 0 (Không) là dấu hiệu nguy cơ; false nếu trả lời 1 (Có) là dấu hiệu nguy cơ
  failIfZero: boolean;
}

interface ScreenerProps {
  onComplete?: (result: any) => void;
}

const Screener: React.FC<ScreenerProps> = ({ onComplete }) => {
  // ---------- 10 CÂU HỎI CỐ ĐỊNH (M‑CHAT‑R/F bản rút gọn, điều chỉnh văn hóa Việt) ----------
  const questions: Question[] = [
    {
      id: 2,
      text: "Trẻ có quan tâm đến những đứa trẻ khác không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "social_interest",
      failIfZero: true
    },
    {
      id: 4,
      text: "Trẻ có thích chơi trò ú òa (trốn tìm) với bạn không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "social_play",
      failIfZero: true
    },
    {
      id: 5,
      text: "Trẻ có bao giờ giả vờ chơi không? (Ví dụ: giả vờ uống nước từ cốc rỗng, giả vờ nói chuyện điện thoại, hoặc cho búp bê ăn)",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "imaginative_play",
      failIfZero: true
    },
    {
      id: 6,
      text: "Trẻ có dùng ngón trỏ để chỉ vào thứ gì đó mà trẻ muốn không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "communication",
      failIfZero: true
    },
    {
      id: 7,
      text: "Trẻ có dùng ngón trỏ để chỉ vào thứ gì đó thú vị để bạn cùng xem không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "joint_attention",
      failIfZero: true
    },
    {
      id: 9,
      text: "Trẻ có đưa đồ vật cho bạn để khoe với bạn không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "sharing",
      failIfZero: true
    },
    {
      id: 10,
      text: "Trẻ có nhìn vào mắt bạn lâu hơn một hoặc hai giây không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "eye_contact",
      failIfZero: true
    },
    {
      id: 14,
      text: "Trẻ có đáp lại khi được gọi tên không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "response_to_name",
      failIfZero: true
    },
    {
      id: 18,
      text: "Trẻ có làm những cử động ngón tay bất thường gần mắt không? (Ví dụ: vẫy tay liên tục trước mắt)",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "stereotyped_behaviors",
      failIfZero: false // Chú ý: false vì trả lời CÓ (1) là nguy cơ
    },
    {
      id: 19,
      text: "Trẻ có cố gắng thu hút sự chú ý của bạn vào hoạt động của trẻ không?",
      options: [
        { value: 0, label: "Không" },
        { value: 1, label: "Có" }
      ],
      category: "social_initiation",
      failIfZero: true
    }
  ];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 phút
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [priorityLevel, setPriorityLevel] = useState<'low' | 'medium' | 'high' | null>(null);

  // Bộ đếm thời gian
  useEffect(() => {
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
    setAnswers(prev => ({ ...prev, [questionId]: answerValue }));
  };

  // ----- TÍNH ĐIỂM CHUẨN M‑CHAT‑R/F -----
  const calculateScore = () => {
    let totalScore = 0;

    questions.forEach(question => {
      const answer = answers[question.id];
      if (answer !== undefined) {
        // Nếu câu hỏi mà trả lời "Không" (0) là nguy cơ và người dùng chọn "Không" -> +1
        // Hoặc câu hỏi mà trả lời "Có" (1) là nguy cơ và người dùng chọn "Có" -> +1
        if ((question.failIfZero && answer === 0) || (!question.failIfZero && answer === 1)) {
          totalScore += 1;
        }
      }
    });

    setScore(totalScore);

    // Ngưỡng điểm cho bộ 10 câu (tham khảo phân bố M‑CHAT‑R/F gốc)
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

    saveAssessmentResult(totalScore, priority);
  };

  const saveAssessmentResult = (finalScore: number, priority: string) => {
    // Lấy thông tin user và child từ localStorage (do App đã lưu)
    const storedUserId = localStorage.getItem('neuropath_user_id');
    const childData = localStorage.getItem('current_child');

    if (!storedUserId || !childData) {
      console.error('Missing user or child data');
      return;
    }

    const child = JSON.parse(childData);
    const startedById = storedUserId;

    // Chuẩn bị dữ liệu adaptive_flow (lưu answers, score, priority)
    const adaptiveFlow = {
      answers,
      score: finalScore,
      priority,
      totalQuestions: questions.length,
      answeredCount: Object.keys(answers).length,
      timeSpent: 300 - timeRemaining,
    };

    // Tạo assessment trong DB với status 'scheduled'
    const assessment = db.createAssessment({
      child_id: child.id,
      started_by: startedById,
      started_at: new Date().toISOString(),
      completed_at: null,
      status: 'scheduled',
      adaptive_flow: adaptiveFlow,
      device_info: null,
      environment_notes: null,
      parent_assisted: false,
      overall_risk_score: null,
      risk_level: null,
      developmental_age_estimate: null,
      report_json: null,
    });

    // Lưu assessment id vào localStorage để App sử dụng sau
    localStorage.setItem('current_assessment_id', assessment.id);

    // Gọi callback với kết quả (có thể trả về assessment)
    if (onComplete) {
      onComplete({
        ...adaptiveFlow,
        assessmentId: assessment.id,
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Thấp';
      case 'medium': return 'Trung bình';
      case 'high': return 'Cao';
      default: return 'Không xác định';
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

  // ---------- RENDER ----------
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
            <p className="score-description">Điểm sàng lọc</p>
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
                alert('Chi tiết câu trả lời đã được lưu trong cơ sở dữ liệu.');
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
        <h2>Bảng câu hỏi sàng lọc sơ bộ (M‑CHAT‑R/F – 10 câu)</h2>
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
        <div className="progress-fill" style={{ width: `${progress}%` }} />
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
          <li>Chọn câu trả lời đúng nhất với tình trạng của trẻ.</li>
          <li>Bạn có thể quay lại chỉnh sửa câu trả lời bất kỳ lúc nào.</li>
          <li>Thời gian tối đa: 5 phút.</li>
          <li>Hệ thống sẽ tự động nộp bài khi hết giờ.</li>
          <li>Sau khi hoàn thành, bạn sẽ được chuyển đến game đánh giá.</li>
        </ul>
      </div>
    </div>
  );
};

export default Screener;