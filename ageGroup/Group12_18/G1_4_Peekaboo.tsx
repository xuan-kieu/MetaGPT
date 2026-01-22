import React, { useState, useEffect, useRef } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G1_4_Peekaboo: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  childName,
  timeElapsed // Nhận prop timeElapsed từ GameEngine để hiển thị đồng hồ
}) => {
  
  // --- CSS NỘI BỘ (Viết lại theo phong cách G1_1 để đảm bảo tương thích) ---
  const styles = `
    /* Container chính: Copy cấu trúc của G1_1 để không bị vỡ layout */
    .peekaboo-game-container {
      width: 100%;
      height: 100%;       /* Bắt buộc 100% để không đẩy menu xuống */
      position: relative;
      background: linear-gradient(to bottom, #87CEEB 0%, #B0E0E6 50%, #7CFC00 50%, #228B22 100%);
      overflow: hidden;   /* Cắt bỏ phần thừa để không che menu */
      font-family: 'Comic Sans MS', sans-serif;
      user-select: none;
      /* Thêm border-radius giống G1_1 cho đồng bộ */
      border-radius: 20px; 
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    /* Đồng hồ đếm giờ (Giống G1_1) */
    .game-timer {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 16px;
      font-weight: bold;
      z-index: 50; /* Z-index cao để nổi lên trên */
    }

    /* Tiêu đề game */
    .game-title {
      position: absolute;
      top: 20px;
      left: 20px;
      color: white;
      font-size: 28px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
      background: rgba(0, 0, 0, 0.2);
      padding: 10px 20px;
      border-radius: 15px;
      backdrop-filter: blur(2px);
      z-index: 50;
    }

    /* Hướng dẫn ở dưới */
    .game-instruction {
      position: absolute;
      bottom: 20px;
      left: 0; 
      right: 0;
      text-align: center;
      color: white;
      font-size: 20px;
      font-weight: bold;
      text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
      z-index: 50;
      pointer-events: none;
    }

    /* --- CÁC STYLE CŨ CỦA GẤU VÀ BỤI CÂY --- */
    /* (Đã tinh chỉnh lại Z-Index để không bao giờ che mất UI) */
    
    @keyframes shakeHard {
      0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
      25% { transform: translate(-52%, -51%) rotate(-3deg) scale(1.02); }
      50% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
      75% { transform: translate(-49%, -49%) rotate(2deg) scale(1.02); }
      100% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
    }

    @keyframes bearBounceJump {
      0% { transform: translate(-50%, 0) scale(1); }
      40% { transform: translate(-50%, -20px) scale(0.95, 1.05); }
      80% { transform: translate(-50%, 5px) scale(1.02, 0.98); }
      100% { transform: translate(-50%, 0) scale(1); }
    }

    @keyframes earWiggle {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(5deg); }
    }
    
    @keyframes blink {
      0%, 90%, 100% { transform: scaleY(1); }
      95% { transform: scaleY(0.1); }
    }

    @keyframes floatCloud {
      0% { transform: translateX(0); }
      100% { transform: translateX(50px); }
    }

    .bush-container {
      position: absolute;
      width: 150px;
      height: 110px;
      transform: translate(-50%, -50%);
      z-index: 20; 
      filter: drop-shadow(0px 10px 5px rgba(0,0,0,0.3));
    }
    
    .bush-part { position: absolute; border-radius: 50%; }
    
    .bush-main {
      top: 10%; left: 5%; width: 90%; height: 90%;
      background: linear-gradient(to bottom right, #4CAF50, #2E7D32);
      border-radius: 60% 40% 50% 50% / 50% 50% 40% 60%;
      z-index: 2;
    }
    .bush-sub1 {
      top: 0%; left: 0%; width: 60%; height: 60%;
      background: #66BB6A; border-radius: 50%; z-index: 1;
    }
    .bush-sub2 {
      top: 15%; right: -5%; width: 55%; height: 65%;
      background: #2E7D32; border-radius: 50%; z-index: 0;
    }
    .bush-berry {
      position: absolute; width: 10px; height: 10px;
      background: #E53935; border-radius: 50%; z-index: 5;
    }

    .bear-character {
      position: absolute;
      width: 100px; height: 120px;
      z-index: 10; /* Thấp hơn bụi cây */
      transition: top 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .bear-head {
      position: absolute; top: 0; left: 50%; transform: translateX(-50%);
      width: 80px; height: 75px; background: #8D6E63; border-radius: 48%;
      z-index: 5; box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }

    .ear {
      position: absolute; top: -10px; width: 28px; height: 28px;
      background: #8D6E63; border-radius: 50%; z-index: 1; border: 2px solid #6D4C41;
    }
    .ear::after {
      content: ''; position: absolute; top: 5px; left: 5px; width: 16px; height: 16px;
      background: #FFAB91; border-radius: 50%;
    }
    .ear.left { left: -5px; transform: rotate(-15deg); }
    .ear.right { right: -5px; transform: rotate(15deg); }
    
    .bear-character.hiding .ear { animation: earWiggle 2s infinite; }

    .muzzle {
      position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
      width: 42px; height: 30px; background: #FFECB3; border-radius: 50%; z-index: 6;
    }
    .nose {
      position: absolute; top: 6px; left: 50%; transform: translateX(-50%);
      width: 16px; height: 10px; background: #3E2723; border-radius: 40%;
    }
    .eye {
      position: absolute; top: 25px; width: 10px; height: 10px;
      background: #212121; border-radius: 50%; z-index: 6; animation: blink 3s infinite;
    }
    .eye.left { left: 18px; } .eye.right { right: 18px; }

    .paw {
      position: absolute; top: 65px; width: 22px; height: 16px;
      background: #8D6E63; border-radius: 50%; z-index: 21; border: 2px solid #6D4C41;
      opacity: 0; transition: opacity 0.3s;
    }
    .bear-character.visible .paw { opacity: 1; }
    .paw.left { left: 5px; transform: rotate(-30deg); }
    .paw.right { right: 5px; transform: rotate(30deg); }

    .cloud {
      position: absolute; background: rgba(255,255,255,0.7);
      border-radius: 50px; animation: floatCloud 10s linear infinite alternate;
    }
  `;

  // --- LOGIC ---
  type GameState = 'SEARCHING' | 'SHAKING' | 'PEEKABOO';
  const [gameState, setGameState] = useState<GameState>('SEARCHING');
  const [targetBushId, setTargetBushId] = useState<number>(1);
  const [bearVisible, setBearVisible] = useState(false);
  const GAME_DURATION = 120; // 2 phút

  // Vị trí 3 bụi cây (phần trăm)
  const bushes = [
    { id: 1, x: 25, y: 70 },
    { id: 2, x: 50, y: 65 },
    { id: 3, x: 75, y: 70 }
  ];

  // Logic Game Loop
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const runGameLoop = () => {
      setGameState('SEARCHING');
      setBearVisible(false); // Gấu lặn xuống

      timeoutId = setTimeout(() => {
        // Chọn bụi cây mới
        let nextBushId;
        do { nextBushId = Math.floor(Math.random() * 3) + 1; } 
        while (nextBushId === targetBushId);
        
        setTargetBushId(nextBushId);
        setGameState('SHAKING'); // Bụi rung

        timeoutId = setTimeout(() => {
          setGameState('PEEKABOO');
          setBearVisible(true); // Gấu nhảy lên

          timeoutId = setTimeout(() => {
             runGameLoop(); // Lặp lại
          }, 2500); 
        }, 1800);
      }, 1500);
    };

    runGameLoop();
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Logic Ghi dữ liệu
  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiFeatures = latestAIResult.current?.features || {};
      const targetBush = bushes.find(b => b.id === targetBushId);
      
      let tx = 50, ty = 50;
      if (targetBush) {
         tx = targetBush.x;
         ty = bearVisible ? targetBush.y - 15 : targetBush.y;
      }

      const feature: BehavioralFeature = {
        timestamp: Date.now(),
        gazeX: typeof aiFeatures.gazeX === 'number' ? aiFeatures.gazeX : 0.5,
        gazeY: typeof aiFeatures.gazeY === 'number' ? aiFeatures.gazeY : 0.5,
        frownIntensity: 0,
        poseConfidence: typeof aiFeatures.faceDetectionConfidence === 'number' ? aiFeatures.faceDetectionConfidence : 0,
        faceConfidence: typeof aiFeatures.faceDetectionConfidence === 'number' ? aiFeatures.faceDetectionConfidence : 0,
        smileIntensity: typeof aiFeatures.avgSmile === 'number' ? aiFeatures.avgSmile : 0,
        affect: 'neutral',
        attentionLevel: typeof aiFeatures.avgAttention === 'number' ? aiFeatures.avgAttention : 0,
        targetX: tx,
        targetY: ty,
        targetSize: bearVisible ? 130 : 110,
        audioStimulus: gameState === 'PEEKABOO' ? 'peekaboo' : null,
        gameId: 'G1.4',
        childName: childName
      };
      
      onFeatureCapture(feature);
    }, 100);

    return () => clearInterval(recordLoop);
  }, [gameState, bearVisible, targetBushId, latestAIResult, onFeatureCapture, childName]);

  // Render mây
  const renderClouds = () => (
    <>
      <div className="cloud" style={{ top: '10%', left: '10%', width: '100px', height: '40px', animationDelay: '0s' }} />
      <div className="cloud" style={{ top: '15%', right: '20%', width: '120px', height: '50px', animationDelay: '2s' }} />
    </>
  );

  return (
    <div className="peekaboo-game-container">
      {/* Inject Style */}
      <style>{styles}</style>

      {/* Timer (Giống G1_1) */}
      <div className="game-timer">
        ⏱️ {timeElapsed}s / {GAME_DURATION}s
      </div>

      <div className="game-title">
        🐻 Ú Òa Kỳ Diệu
      </div>

      {renderClouds()}

      {/* Render Bụi Cây & Gấu */}
      {bushes.map((bush) => {
        const isTarget = bush.id === targetBushId;
        const isShaking = isTarget && gameState === 'SHAKING';
        const isBearHere = isTarget;
        
        // Vị trí gấu: Khi hiện thì lên cao (-100px), khi nấp thì tụt xuống (-25px)
        // Lưu ý: dùng px thay vì % cho top để kiểm soát chính xác hơn
        const bearTop = bearVisible ? '-100px' : '-25px';

        return (
          <div key={bush.id} style={{ position: 'absolute', left: `${bush.x}%`, top: `${bush.y}%` }}>
            
            {isBearHere && (
              <div 
                className={`bear-character ${!bearVisible ? 'hiding' : 'visible'}`}
                style={{
                  top: bearTop,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  animation: bearVisible && gameState === 'PEEKABOO' ? 'bearBounceJump 2s infinite' : 'none'
                }}
              >
                <div className="bear-head">
                  <div className="ear left" />
                  <div className="ear right" />
                  <div className="eye left" />
                  <div className="eye right" />
                  <div className="muzzle"><div className="nose" /></div>
                </div>
                <div className="paw left" />
                <div className="paw right" />
              </div>
            )}

            <div 
              className="bush-container"
              style={{ animation: isShaking ? 'shakeHard 0.5s infinite' : 'none' }}
            >
              <div className="bush-part bush-sub1" />
              <div className="bush-part bush-sub2" />
              <div className="bush-part bush-main" />
              <div className="bush-berry" style={{ top: '30%', left: '25%' }} />
              <div className="bush-berry" style={{ top: '50%', right: '20%' }} />
            </div>
          </div>
        );
      })}

      <div className="game-instruction">
        Quan sát xem Gấu trốn ở đâu nhé! 👀
      </div>
    </div>
  );
};

export default G1_4_Peekaboo;