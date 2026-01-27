import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G4_2_StorySequence: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- CSS NỘI BỘ ---
  const styles = `
    .story-game-container {
      width: 100%;
      height: 100%;
      position: relative;
      background: linear-gradient(135deg, #F472B6 0%, #DB2777 100%);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }

    .story-timer {
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

    .story-title {
      text-align: center;
      color: white;
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 20px;
      text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
      background: rgba(0, 0, 0, 0.3);
      padding: 10px 30px;
      border-radius: 20px;
    }

    .story-theme {
      background: rgba(255, 255, 255, 0.95);
      padding: 15px 25px;
      border-radius: 20px;
      text-align: center;
      font-size: 22px;
      font-weight: bold;
      color: #7C3AED;
      margin: 10px 0;
      width: 90%;
      border: 4px solid #F472B6;
    }

    .story-areas {
      display: flex;
      justify-content: space-between;
      width: 95%;
      height: 60%;
      margin: 20px 0;
      gap: 20px;
    }

    .story-source {
      flex: 1;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 20px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 15px;
      overflow-y: auto;
      border: 3px dashed #F472B6;
    }

    .story-sequence {
      flex: 1;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 20px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 15px;
      overflow-y: auto;
      border: 3px solid #7C3AED;
    }

    .story-scene {
      background: white;
      border-radius: 15px;
      padding: 20px;
      cursor: move;
      user-select: none;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 15px;
      border: 2px solid transparent;
    }

    .story-scene:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }

    .story-scene.dragging {
      opacity: 0.5;
      transform: scale(0.98);
    }

    .story-scene.placed {
      background: #EDE9FE;
      border-color: #7C3AED;
    }

    .story-scene.correct {
      border-color: #10B981;
      background: #D1FAE5;
    }

    .story-scene.incorrect {
      border-color: #EF4444;
      background: #FEE2E2;
    }

    .story-scene-emoji {
      font-size: 36px;
      min-width: 60px;
      text-align: center;
    }

    .story-scene-text {
      font-size: 18px;
      color: #4B5563;
      font-weight: 500;
    }

    .story-scene-number {
      width: 30px;
      height: 30px;
      background: #7C3AED;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 16px;
    }

    .story-sequence-slot {
      min-height: 100px;
      border: 2px dashed #9CA3AF;
      border-radius: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6B7280;
      font-weight: bold;
      font-size: 18px;
      transition: all 0.3s ease;
    }

    .story-sequence-slot.highlight {
      border-color: #7C3AED;
      background: rgba(124, 58, 237, 0.1);
    }

    .story-instruction {
      background: rgba(255, 255, 255, 0.95);
      padding: 15px 30px;
      border-radius: 20px;
      text-align: center;
      font-size: 20px;
      font-weight: bold;
      color: #4B5563;
      margin: 10px 0;
      width: 90%;
    }

    .story-feedback {
      position: absolute;
      bottom: 30px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 22px;
      font-weight: bold;
      color: white;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      padding: 15px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 15px;
      margin: 0 40px;
      z-index: 10;
    }

    .story-controls {
      display: flex;
      gap: 20px;
      margin-top: 20px;
    }

    .story-control-btn {
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

    .story-control-btn:hover {
      transform: translateY(-3px);
    }

    .story-control-btn.check {
      background: #10B981;
      color: white;
    }

    .story-control-btn.reset {
      background: #EF4444;
      color: white;
    }

    .story-progress {
      width: 80%;
      height: 8px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      overflow: hidden;
      margin: 10px 0;
    }

    .story-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #FCD34D, #F59E0B);
      border-radius: 10px;
      transition: width 0.5s ease;
    }

    @media (max-width: 768px) {
      .story-areas {
        flex-direction: column;
        height: auto;
        max-height: 60vh;
      }
      
      .story-title {
        font-size: 24px;
        padding: 8px 20px;
      }
      
      .story-theme {
        font-size: 18px;
        padding: 12px 20px;
      }
      
      .story-scene {
        padding: 15px;
      }
      
      .story-scene-emoji {
        font-size: 28px;
        min-width: 50px;
      }
      
      .story-scene-text {
        font-size: 16px;
      }
      
      .story-instruction {
        font-size: 16px;
        padding: 12px 20px;
      }
      
      .story-feedback {
        font-size: 18px;
        margin: 0 20px;
        padding: 12px;
      }
    }
  `;

  // --- LOGIC ---
  interface StoryScene {
    id: number;
    emoji: string;
    text: string;
    correctOrder: number;
    placedOrder: number | null;
  }

  interface Story {
    id: number;
    title: string;
    scenes: StoryScene[];
  }

  const GAME_DURATION = 300; // Tăng thời gian vì có nhiều câu chuyện
  
  const stories: Story[] = useMemo(() => [
    {
      id: 1,
      title: "Chú Gấu Đi Tìm Mật Ong",
      scenes: [
        { id: 1, emoji: '🐻', text: 'Gấu thức dậy đói bụng', correctOrder: 1, placedOrder: null },
        { id: 2, emoji: '🍯', text: 'Gấu ngửi thấy mùi mật ong', correctOrder: 2, placedOrder: null },
        { id: 3, emoji: '🌳', text: 'Gấu leo lên cây cao', correctOrder: 3, placedOrder: null },
        { id: 4, emoji: '🐝', text: 'Gấu gặp đàn ong bảo vệ', correctOrder: 4, placedOrder: null },
        { id: 5, emoji: '🏃', text: 'Gấu chạy về nhà với mật ong', correctOrder: 5, placedOrder: null }
      ]
    },
    {
      id: 2,
      title: "Mèo Con Và Quả Bóng",
      scenes: [
        { id: 6, emoji: '🎾', text: 'Mèo con thấy quả bóng lăn', correctOrder: 1, placedOrder: null },
        { id: 7, emoji: '🐾', text: 'Mèo con chạy theo bóng', correctOrder: 2, placedOrder: null },
        { id: 8, emoji: '🏃', text: 'Bóng lăn xuống đồi', correctOrder: 3, placedOrder: null },
        { id: 9, emoji: '🌊', text: 'Bóng rơi xuống suối', correctOrder: 4, placedOrder: null },
        { id: 10, emoji: '😿', text: 'Mèo con buồn về nhà', correctOrder: 5, placedOrder: null }
      ]
    },
    {
      id: 3,
      title: "Chú Thỏ Và Củ Cà Rốt",
      scenes: [
        { id: 11, emoji: '🐰', text: 'Thỏ con thấy củ cà rốt to', correctOrder: 1, placedOrder: null },
        { id: 12, emoji: '🥕', text: 'Thỏ cố gắng nhổ cà rốt', correctOrder: 2, placedOrder: null },
        { id: 13, emoji: '🤝', text: 'Bạn sóc đến giúp đỡ', correctOrder: 3, placedOrder: null },
        { id: 14, emoji: '💪', text: 'Cùng nhau kéo mạnh', correctOrder: 4, placedOrder: null },
        { id: 15, emoji: '🎉', text: 'Cà rốt được nhổ lên, cùng ăn', correctOrder: 5, placedOrder: null }
      ]
    },
    {
      id: 4,
      title: "Chim Non Học Bay",
      scenes: [
        { id: 16, emoji: '🥚', text: 'Chim non nở từ quả trứng', correctOrder: 1, placedOrder: null },
        { id: 17, emoji: '👀', text: 'Nhìn mẹ bay trên trời', correctOrder: 2, placedOrder: null },
        { id: 18, emoji: '🪽', text: 'Tập vỗ cánh trong tổ', correctOrder: 3, placedOrder: null },
        { id: 19, emoji: '🌳', text: 'Nhảy từ cành cây xuống', correctOrder: 4, placedOrder: null },
        { id: 20, emoji: '🦅', text: 'Bay được những mét đầu tiên', correctOrder: 5, placedOrder: null }
      ]
    },
    {
      id: 5,
      title: "Bạn Nhỏ Đi Siêu Thị",
      scenes: [
        { id: 21, emoji: '📝', text: 'Mẹ viết danh sách mua sắm', correctOrder: 1, placedOrder: null },
        { id: 22, emoji: '🛒', text: 'Cùng mẹ đẩy xe hàng', correctOrder: 2, placedOrder: null },
        { id: 23, emoji: '🥦', text: 'Chọn rau củ tươi ngon', correctOrder: 3, placedOrder: null },
        { id: 24, emoji: '🍎', text: 'Lấy trái cây yêu thích', correctOrder: 4, placedOrder: null },
        { id: 25, emoji: '💵', text: 'Mẹ thanh toán ở quầy', correctOrder: 5, placedOrder: null }
      ]
    },
    {
      id: 6,
      title: "Ngày Đầu Đi Học",
      scenes: [
        { id: 26, emoji: '🎒', text: 'Chuẩn bị cặp sách mới', correctOrder: 1, placedOrder: null },
        { id: 27, emoji: '👋', text: 'Chào tạm biệt bố mẹ', correctOrder: 2, placedOrder: null },
        { id: 28, emoji: '👩‍🏫', text: 'Gặp cô giáo và bạn mới', correctOrder: 3, placedOrder: null },
        { id: 29, emoji: '✏️', text: 'Học viết chữ đầu tiên', correctOrder: 4, placedOrder: null },
        { id: 30, emoji: '😊', text: 'Vui vẻ kể chuyện về trường', correctOrder: 5, placedOrder: null }
      ]
    },
    {
      id: 7,
      title: "Chuyến Cắm Trại",
      scenes: [
        { id: 31, emoji: '🎪', text: 'Dựng lều trại trong rừng', correctOrder: 1, placedOrder: null },
        { id: 32, emoji: '🔥', text: 'Nhóm lửa trại cùng nhau', correctOrder: 2, placedOrder: null },
        { id: 33, emoji: '🌭', text: 'Nướng xúc xích trên lửa', correctOrder: 3, placedOrder: null },
        { id: 34, emoji: '🎵', text: 'Hát hò quanh đống lửa', correctOrder: 4, placedOrder: null },
        { id: 35, emoji: '⭐', text: 'Ngắm sao trời ban đêm', correctOrder: 5, placedOrder: null }
      ]
    },
    {
      id: 8,
      title: "Giúp Đỡ Ông Bà",
      scenes: [
        { id: 36, emoji: '👴👵', text: 'Đến thăm ông bà', correctOrder: 1, placedOrder: null },
        { id: 37, emoji: '🍂', text: 'Quét lá sân vườn', correctOrder: 2, placedOrder: null },
        { id: 38, emoji: '💐', text: 'Tưới nước cho hoa', correctOrder: 3, placedOrder: null },
        { id: 39, emoji: '🍪', text: 'Ông bà cho bánh ngọt', correctOrder: 4, placedOrder: null },
        { id: 40, emoji: '❤️', text: 'Ôm tạm biệt ông bà', correctOrder: 5, placedOrder: null }
      ]
    },
    {
      id: 9,
      title: "Dọn Dẹp Phòng",
      scenes: [
        { id: 41, emoji: '🧸', text: 'Nhìn thấy phòng bừa bộn', correctOrder: 1, placedOrder: null },
        { id: 42, emoji: '📚', text: 'Xếp sách vở ngăn nắp', correctOrder: 2, placedOrder: null },
        { id: 43, emoji: '🧹', text: 'Quét sạch bụi bẩn', correctOrder: 3, placedOrder: null },
        { id: 44, emoji: '🛏️', text: 'Dọn giường gọn gàng', correctOrder: 4, placedOrder: null },
        { id: 45, emoji: '✨', text: 'Phòng sạch sẽ sáng ngời', correctOrder: 5, placedOrder: null }
      ]
    }
  ], []);

  const [currentStory, setCurrentStory] = useState<Story>(stories[0]);
  const [scenes, setScenes] = useState<StoryScene[]>([]);
  const [sequence, setSequence] = useState<(StoryScene | null)[]>([null, null, null, null, null]);
  const [draggingScene, setDraggingScene] = useState<StoryScene | null>(null);
  const [feedback, setFeedback] = useState('Kéo các cảnh vào đúng thứ tự câu chuyện! 📖');
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [storiesCompleted, setStoriesCompleted] = useState<number[]>([]);

  // Khởi tạo scenes
  useEffect(() => {
    const shuffledScenes = [...currentStory.scenes].sort(() => Math.random() - 0.5);
    setScenes(shuffledScenes);
    setSequence(Array(currentStory.scenes.length).fill(null));
    setCompleted(false);
    setFeedback(`Sắp xếp câu chuyện: ${currentStory.title} 📚`);
  }, [currentStory]);

  const handleDragStart = (scene: StoryScene) => {
    setDraggingScene(scene);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const slot = document.querySelector(`.sequence-slot-${index}`);
    slot?.classList.add('highlight');
  };

  const handleDragLeave = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const slot = document.querySelector(`.sequence-slot-${index}`);
    slot?.classList.remove('highlight');
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const slot = document.querySelector(`.sequence-slot-${index}`);
    slot?.classList.remove('highlight');
    
    if (!draggingScene) return;
    
    // Kiểm tra xem scene đã được đặt chưa
    if (draggingScene.placedOrder !== null) {
      const oldSequence = [...sequence];
      oldSequence[draggingScene.placedOrder - 1] = null;
      setSequence(oldSequence);
    }
    
    // Đặt scene vào vị trí mới
    const newSequence = [...sequence];
    newSequence[index] = draggingScene;
    setSequence(newSequence);
    
    // Cập nhật placedOrder cho scene
    const updatedScenes = scenes.map(scene =>
      scene.id === draggingScene.id 
        ? { ...scene, placedOrder: index + 1 } 
        : scene
    );
    setScenes(updatedScenes);
    
    setFeedback(`Đặt "${draggingScene.text}" vào vị trí ${index + 1}`);
  };

  const checkSequence = () => {
    let correctCount = 0;
    
    sequence.forEach((scene, index) => {
      if (scene && scene.correctOrder === index + 1) {
        correctCount++;
      }
    });
    
    if (correctCount === currentStory.scenes.length) {
      setCompleted(true);
      const newScore = score + 10;
      setScore(newScore);
      
      // Đánh dấu câu chuyện đã hoàn thành
      if (!storiesCompleted.includes(currentStory.id)) {
        setStoriesCompleted(prev => [...prev, currentStory.id]);
      }
      
      setFeedback(`Hoàn hảo! Câu chuyện "${currentStory.title}" đã được sắp xếp đúng! 🎉📖 (+10 điểm)`);
      
      // Tự động chuyển câu chuyện tiếp theo sau 2 giây
      setTimeout(() => {
        if (currentStoryIndex < stories.length - 1) {
          nextStory();
        }
      }, 2000);
    } else {
      setFeedback(`Có ${correctCount}/5 cảnh đúng. Hãy thử lại! 💪`);
    }
  };

  const resetStory = () => {
    const shuffledScenes = [...currentStory.scenes].sort(() => Math.random() - 0.5);
    setScenes(shuffledScenes);
    setSequence(Array(currentStory.scenes.length).fill(null));
    setFeedback('Hãy sắp xếp lại câu chuyện! 🔄');
    setCompleted(false);
  };

  const nextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIndex);
      setCurrentStory(stories[nextIndex]);
      setFeedback(`Chuyển sang: ${stories[nextIndex].title} ⏭️`);
    } else {
      setFeedback('Chúc mừng! Bạn đã hoàn thành tất cả câu chuyện! 🏆🎉');
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      const prevIndex = currentStoryIndex - 1;
      setCurrentStoryIndex(prevIndex);
      setCurrentStory(stories[prevIndex]);
    }
  };

  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      
      // Xác định affect
      let affect: 'positive' | 'neutral' | 'negative' | 'surprised' = 'neutral';
      if (completed) affect = 'positive';
      if (feedback.includes('Hãy thử lại')) affect = 'negative';
      if (draggingScene) affect = 'surprised';
      if (feedback.includes('Chúc mừng')) affect = 'positive';
      
      // Tập trung vào khu vực sequence
      const feature: BehavioralFeature = {
        timestamp: Date.now(),
        gazeX: aiData?.gazeX ?? 0.5,
        gazeY: aiData?.gazeY ?? 0.5,
        targetX: 70,
        targetY: 50,
        targetSize: 200,
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
  }, [completed, feedback, draggingScene, onFeatureCapture, latestAIResult]);

  const progressPercentage = ((currentStoryIndex + 1) / stories.length) * 100;

  // Kiểm tra xem đã hoàn thành tất cả câu chuyện chưa
  const allStoriesCompleted = storiesCompleted.length === stories.length;

  return (
    <div className="story-game-container">
      <style>{styles}</style>

      <div className="story-timer">
        ⏱️ {timeElapsed}s / {GAME_DURATION}s
      </div>
      
      <div className="story-title">
        📚 Sắp Xếp Câu Chuyện
      </div>

      <div className="story-theme">
        {currentStory.title} 🎬
        <div style={{ fontSize: '16px', color: '#6B7280', marginTop: '5px' }}>
          Câu chuyện {currentStoryIndex + 1}/{stories.length} | 
          Hoàn thành: {storiesCompleted.length}/{stories.length} ✅
        </div>
      </div>

      <div className="story-instruction">
        {allStoriesCompleted 
          ? '🎉 Chúc mừng! Bạn đã hoàn thành tất cả câu chuyện!'
          : 'Kéo các cảnh bên trái vào đúng thứ tự câu chuyện bên phải!'
        }
      </div>

      {!allStoriesCompleted ? (
        <>
          <div className="story-areas">
            <div className="story-source">
              {scenes.map(scene => (
                <div
                  key={scene.id}
                  className={`story-scene ${scene.placedOrder !== null ? 'placed' : ''}`}
                  draggable={!completed}
                  onDragStart={() => handleDragStart(scene)}
                >
                  <div className="story-scene-emoji">{scene.emoji}</div>
                  <div className="story-scene-text">{scene.text}</div>
                  {scene.placedOrder && (
                    <div className="story-scene-number">{scene.placedOrder}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="story-sequence">
              {sequence.map((scene, index) => (
                <div
                  key={index}
                  className={`story-sequence-slot sequence-slot-${index} ${
                    scene ? 'filled' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={(e) => handleDragLeave(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  {scene ? (
                    <div className={`story-scene ${
                      completed && scene.correctOrder === index + 1 ? 'correct' : ''
                    }`}>
                      <div className="story-scene-emoji">{scene.emoji}</div>
                      <div className="story-scene-text">{scene.text}</div>
                      <div className="story-scene-number">{index + 1}</div>
                    </div>
                  ) : (
                    <span>Vị trí {index + 1} ➡️</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="story-controls">
            <button 
              className="story-control-btn" 
              onClick={prevStory}
              disabled={currentStoryIndex === 0}
              style={{ 
                background: currentStoryIndex === 0 ? '#CCC' : '#8B5CF6', 
                color: 'white',
                opacity: currentStoryIndex === 0 ? 0.6 : 1
              }}
            >
              <span>⏮️</span> Câu chuyện trước
            </button>
            
            <button 
              className="story-control-btn reset" 
              onClick={resetStory}
            >
              <span>🔄</span> Làm lại
            </button>
            
            <button 
              className="story-control-btn check" 
              onClick={checkSequence}
              disabled={completed}
            >
              <span>✅</span> Kiểm tra
            </button>
            
            <button 
              className="story-control-btn" 
              onClick={nextStory}
              disabled={currentStoryIndex === stories.length - 1}
              style={{ 
                background: currentStoryIndex === stories.length - 1 ? '#CCC' : '#10B981', 
                color: 'white',
                opacity: currentStoryIndex === stories.length - 1 ? 0.6 : 1
              }}
            >
              <span>⏭️</span> Câu chuyện tiếp
            </button>
          </div>

          <div className="story-progress">
            <div 
              className="story-progress-bar" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </>
      ) : (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#7C3AED',
          marginTop: '20px',
          width: '90%'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏆🎉</div>
          <div>Chúc mừng bạn đã hoàn thành tất cả 9 câu chuyện!</div>
          <div style={{ fontSize: '20px', color: '#6B7280', marginTop: '10px' }}>
            Điểm số: {score} | Hoàn thành: {storiesCompleted.length}/{stories.length}
          </div>
          <button 
            onClick={() => {
              setCurrentStoryIndex(0);
              setCurrentStory(stories[0]);
              setStoriesCompleted([]);
              setScore(0);
            }}
            style={{
              marginTop: '30px',
              background: '#7C3AED',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '15px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              margin: '30px auto 0'
            }}
          >
            <span>🔄</span> Chơi lại từ đầu
          </button>
        </div>
      )}

      <div className="story-feedback">
        {feedback} | Điểm: {score} ✨
      </div>
    </div>
  );
};

export default G4_2_StorySequence;