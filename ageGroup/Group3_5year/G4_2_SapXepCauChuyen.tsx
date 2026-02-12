import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G4_2_StorySequence: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- CSS NÂNG CẤP ---
  const styles = `
    .story-game-container {
      width: 100%; height: 100%; position: relative;
      background: linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%);
      border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; align-items: center; padding: 20px;
    }
    .story-title {
      font-size: 28px; font-weight: bold; color: #BE185D; margin-bottom: 15px;
      background: white; padding: 10px 30px; border-radius: 40px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }
    .story-areas {
      display: flex; gap: 30px; width: 100%; flex: 1; align-items: center; justify-content: center;
    }
    .story-scenes-pool {
      display: flex; flex-direction: column; gap: 15px; width: 250px;
    }
    .story-slots-area {
      display: flex; gap: 20px;
    }
    .scene-card {
      background: white; border-radius: 20px; padding: 15px; cursor: grab;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 4px solid white;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      transition: all 0.2s; width: 180px;
    }
    .scene-card:active { cursor: grabbing; transform: scale(0.95); }
    .scene-card.correct { border-color: #10B981; background: #ECFDF5; }
    .scene-card.placed { opacity: 0.5; cursor: default; pointer-events: none; }
    .scene-emoji { font-size: 60px; }
    .scene-text { font-size: 16px; font-weight: bold; color: #4B5563; text-align: center; }

    .slot {
      width: 180px; height: 180px; border: 4px dashed #DB2777; border-radius: 20px;
      display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.5);
      transition: background 0.3s;
    }
    .slot.drag-over { background: rgba(219, 39, 119, 0.1); }
    
    .mic-btn {
      margin-top: 20px; padding: 15px 40px; border-radius: 40px; border: none;
      background: #DB2777; color: white; font-size: 20px; font-weight: bold;
      cursor: pointer; display: flex; align-items: center; gap: 10px;
      animation: pulse 2s infinite;
    }
    .mic-active { background: #10B981; }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(219, 39, 119, 0.4); } 70% { box-shadow: 0 0 0 20px rgba(219, 39, 119, 0); } 100% { box-shadow: 0 0 0 0 rgba(219, 39, 119, 0); } }
  `;

  // --- DỮ LIỆU CÂU CHUYỆN ---
  const stories = useMemo(() => [
    {
      id: 1, title: "Rửa Tay Sạch Sẽ",
      scenes: [
        { id: 1, emoji: '🧼', text: 'Xoa xà phòng', order: 1 },
        { id: 2, emoji: '💧', text: 'Rửa dưới vòi nước', order: 2 },
        { id: 3, emoji: '✨', text: 'Tay sạch thơm tho', order: 3 }
      ]
    },
    {
      id: 2, title: "Bé Trồng Cây",
      scenes: [
        { id: 4, emoji: '🌱', text: 'Gieo hạt xuống đất', order: 1 },
        { id: 5, emoji: '🚿', text: 'Tưới nước cho cây', order: 2 },
        { id: 6, emoji: '🌳', text: 'Cây lớn thật cao', order: 3 }
      ]
    },
    {
      id: 3, title: "Chú Gấu Đi Dạo",
      scenes: [
        { id: 7, emoji: '🐻', text: 'Gấu thức dậy sớm', order: 1 },
        { id: 8, emoji: '🌲', text: 'Đi bộ trong rừng', order: 2 },
        { id: 9, emoji: '🍯', text: 'Tìm thấy tổ ong', order: 3 }
      ]
    },
    {
      id: 4, title: "Thỏ Con Học Nhảy",
      scenes: [
        { id: 10, emoji: '🐰', text: 'Khởi động đôi chân', order: 1 },
        { id: 11, emoji: '🦘', text: 'Nhảy theo kangaroo', order: 2 },
        { id: 12, emoji: '🎉', text: 'Nhảy cao vui sướng', order: 3 }
      ]
    },
    {
      id: 5, title: "Bé Đi Siêu Thị",
      scenes: [
        { id: 13, emoji: '🛒', text: 'Đẩy xe đi mua sắm', order: 1 },
        { id: 14, emoji: '🥕', text: 'Chọn rau củ tươi', order: 2 },
        { id: 15, emoji: '💰', text: 'Trả tiền tại quầy', order: 3 }
      ]
    },
    {
      id: 6, title: "Xe Lửa Chạy Nhanh",
      scenes: [
        { id: 16, emoji: '🚂', text: 'Xe lửa rời ga', order: 1 },
        { id: 17, emoji: '🌉', text: 'Chạy qua cầu vồng', order: 2 },
        { id: 18, emoji: '🏁', text: 'Về đích an toàn', order: 3 }
      ]
    },
    {
      id: 7, title: "Bé Tự Mặc Quần Áo",
      scenes: [
        { id: 19, emoji: '👕', text: 'Mặc áo vào người', order: 1 },
        { id: 20, emoji: '👖', text: 'Kéo quần lên cao', order: 2 },
        { id: 21, emoji: '👟', text: 'Đi giày thật vừa', order: 3 }
      ]
    },
    {
      id: 8, title: "Chim Non Tập Bay",
      scenes: [
        { id: 22, emoji: '🐣', text: 'Chim non ra tổ', order: 1 },
        { id: 23, emoji: '🌬️', text: 'Đập cánh tập bay', order: 2 },
        { id: 24, emoji: '🪽', text: 'Bay cao trên trời', order: 3 }
      ]
    },
    {
      id: 9, title: "Bé Đánh Răng Sạch",
      scenes: [
        { id: 25, emoji: '🪥', text: 'Lấy bàn chải nhỏ', order: 1 },
        { id: 26, emoji: '🦷', text: 'Chải răng tròn đều', order: 2 },
        { id: 27, emoji: '😁', text: 'Nụ cười sáng ngời', order: 3 }
      ]
    },
    {
      id: 10, title: "Ông Mặt Trời Thức Dậy",
      scenes: [
        { id: 28, emoji: '🌙', text: 'Mặt trăng đi ngủ', order: 1 },
        { id: 29, emoji: '🌅', text: 'Ông mặt trời dậy', order: 2 },
        { id: 30, emoji: '☀️', text: 'Tỏa nắng ấm áp', order: 3 }
      ]
    },
    {
      id: 11, title: "Xây Nhà Bằng Gỗ",
      scenes: [
        { id: 31, emoji: '🪵', text: 'Chọn khúc gỗ to', order: 1 },
        { id: 32, emoji: '🔨', text: 'Đóng đinh cẩn thận', order: 2 },
        { id: 33, emoji: '🏠', text: 'Ngôi nhà xinh xắn', order: 3 }
      ]
    },
    {
      id: 12, title: "Chú Mèo Bắt Chuột",
      scenes: [
        { id: 34, emoji: '🐭', text: 'Chuột chạy nhanh', order: 1 },
        { id: 35, emoji: '🐈', text: 'Mèo rình phía sau', order: 2 },
        { id: 36, emoji: '🏆', text: 'Bắt được khoe mẹ', order: 3 }
      ]
    },
    {
      id: 13, title: "Bé Học Vẽ Tranh",
      scenes: [
        { id: 37, emoji: '🎨', text: 'Chọn màu yêu thích', order: 1 },
        { id: 38, emoji: '🖌️', text: 'Vẽ hình tròn tròn', order: 2 },
        { id: 39, emoji: '🖼️', text: 'Bức tranh hoàn thành', order: 3 }
      ]
    },
    {
      id: 14, title: "Thuyền Buồm Ra Khơi",
      scenes: [
        { id: 40, emoji: '⛵', text: 'Thuyền rời bến cảng', order: 1 },
        { id: 41, emoji: '🌊', text: 'Vượt sóng đại dương', order: 2 },
        { id: 42, emoji: '🐟', text: 'Đánh bắt nhiều cá', order: 3 }
      ]
    },
    {
      id: 15, title: "Chong Chóng Quay Gió",
      scenes: [
        { id: 43, emoji: '🌬️', text: 'Gió thổi nhẹ nhàng', order: 1 },
        { id: 44, emoji: '🎐', text: 'Chong chóng xoay tròn', order: 2 },
        { id: 45, emoji: '🌈', text: 'Màu sắc lung linh', order: 3 }
      ]
    },
    {
      id: 16, title: "Bé Tự Dọn Đồ Chơi",
      scenes: [
        { id: 46, emoji: '🧸', text: 'Thu gom đồ chơi', order: 1 },
        { id: 47, emoji: '📦', text: 'Xếp vào hộp gọn', order: 2 },
        { id: 48, emoji: '🧹', text: 'Phòng sạch ngăn nắp', order: 3 }
      ]
    },
    {
      id: 17, title: "Bướm Xinh Bay Lượn",
      scenes: [
        { id: 49, emoji: '🐛', text: 'Sâu nhả tơ vàng', order: 1 },
        { id: 50, emoji: '🦋', text: 'Hóa thành bướm xinh', order: 2 },
        { id: 51, emoji: '🌸', text: 'Bay lượn vườn hoa', order: 3 }
      ]
    },
    {
      id: 18, title: "Bé Đi Ngủ Đúng Giờ",
      scenes: [
        { id: 52, emoji: '🛁', text: 'Tắm rửa sạch sẽ', order: 1 },
        { id: 53, emoji: '📖', text: 'Nghe kể chuyện hay', order: 2 },
        { id: 54, emoji: '🌙', text: 'Chìm vào giấc mơ', order: 3 }
      ]
    },
    {
      id: 19, title: "Máy Bay Cất Cánh",
      scenes: [
        { id: 55, emoji: '🛫', text: 'Máy bay chạy đà', order: 1 },
        { id: 56, emoji: '✈️', text: 'Bay lên bầu trời', order: 2 },
        { id: 57, emoji: '☁️', text: 'Lượn giữa mây trắng', order: 3 }
      ]
    },
    {
      id: 20, title: "Bé Chơi Xếp Hình",
      scenes: [
        { id: 58, emoji: '🧩', text: 'Chọn miếng ghép đúng', order: 1 },
        { id: 59, emoji: '🏰', text: 'Xếp thành lâu đài', order: 2 },
        { id: 60, emoji: '👑', text: 'Công chúa tươi cười', order: 3 }
      ]
    },
    {
      id: 21, title: "Voi Con Tắm Sông",
      scenes: [
        { id: 61, emoji: '🐘', text: 'Voi xuống dòng sông', order: 1 },
        { id: 62, emoji: '💦', text: 'Vòi phun nước mát', order: 2 },
        { id: 63, emoji: '🛁', text: 'Sạch sẽ thơm tho', order: 3 }
      ]
    },
    {
      id: 22, title: "Bé Nhận Quà Sinh Nhật",
      scenes: [
        { id: 64, emoji: '🎂', text: 'Bánh sinh nhật đẹp', order: 1 },
        { id: 65, emoji: '🎁', text: 'Mở quà bất ngờ', order: 2 },
        { id: 66, emoji: '🤗', text: 'Ôm ba mẹ vui', order: 3 }
      ]
    }
  ], []);

  const [currentStoryIdx, setCurrentStoryIdx] = useState(0);
  const [sequence, setSequence] = useState<(any | null)[]>([null, null, null]);
  const [isRecording, setIsRecording] = useState(false);
  const [completed, setCompleted] = useState(false);

  const currentStory = stories[currentStoryIdx];
  const shuffledScenes = useMemo(() => [...currentStory.scenes].sort(() => Math.random() - 0.5), [currentStoryIdx]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'vi-VN';
      msg.rate = 0.9;
      window.speechSynthesis.speak(msg);
    }
  };

  const handleDropLogic = (sceneId: number, slotIdx: number) => {
    const scene = currentStory.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    const newSequence = [...sequence];
    newSequence[slotIdx] = scene;
    setSequence(newSequence);

    // Kiểm tra hoàn thành khi đủ 3 ô
    if (newSequence.every(s => s !== null)) {
      const isCorrect = newSequence.every((s, i) => s.order === i + 1);
      if (isCorrect) {
        setCompleted(true);
        speak("Giỏi quá! Bây giờ con hãy nhấn nút Mic và kể lại câu chuyện cho tớ nghe nhé!");
      } else {
        speak("Hình như sai thứ tự rồi, con thử lại xem.");
      }
    }
  };

  // --- AI TRACKING ---
  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      onFeatureCapture({
        timestamp: Date.now(),
        gazeX: aiData?.gazeX ?? 0.5,
        gazeY: aiData?.gazeY ?? 0.5,
        isSpeaking: aiData?.isSpeaking ?? false,
        isStoryTelling: isRecording && (aiData?.isSpeaking ?? false),
        completedSequence: completed,
        attentionLevel: aiData?.avgAttention ?? 0.5,
        affect: completed ? 'positive' : 'neutral'
      } as any);
    }, 200);
    return () => clearInterval(recordLoop);
  }, [onFeatureCapture, latestAIResult, isRecording, completed]);

  return (
    <div className="story-game-container">
      <style>{styles}</style>
      <div className="story-title">{currentStory.title}</div>

      <div className="story-areas">
        <div className="story-scenes-pool">
          {shuffledScenes.map(scene => (
            <div 
              key={scene.id} 
              className={`scene-card ${sequence.some(s => s?.id === scene.id) ? 'placed' : ''}`}
              draggable={!completed && !sequence.some(s => s?.id === scene.id)}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", scene.id.toString());
              }}
            >
              <div className="scene-emoji">{scene.emoji}</div>
              <div className="scene-text">{scene.text}</div>
            </div>
          ))}
        </div>

        <div className="story-slots-area">
          {sequence.map((item, idx) => (
            <div 
              key={idx} 
              className="slot"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const idStr = e.dataTransfer.getData("text/plain");
                if (idStr) {
                  handleDropLogic(parseInt(idStr), idx);
                }
              }}
            >
              {item ? (
                <div className={`scene-card ${completed ? 'correct' : ''}`}>
                  <div className="scene-emoji">{item.emoji}</div>
                  <div className="scene-text">{item.text}</div>
                </div>
              ) : <span>{idx + 1}</span>}
            </div>
          ))}
        </div>
      </div>

      {completed && (
        <button 
          className={`mic-btn ${isRecording ? 'mic-active' : ''}`}
          onClick={() => {
            setIsRecording(!isRecording);
            if (!isRecording) speak("Tớ đang nghe đây, con kể đi!");
          }}
        >
          {isRecording ? "🔴 Tớ đang nghe..." : "🎤 Nhấn để kể chuyện"}
        </button>
      )}

      {completed && !isRecording && (
        <button 
          style={{marginTop: '15px', background: 'none', border: 'none', color: '#DB2777', cursor: 'pointer', textDecoration: 'underline', fontSize: '18px'}}
          onClick={() => {
            setSequence([null, null, null]);
            setCompleted(false);
            setCurrentStoryIdx((prev) => (prev + 1) % stories.length);
          }}
        >
          Sang chuyện tiếp theo ⏭️
        </button>
      )}  
    </div>
  );
};

export default G4_2_StorySequence;