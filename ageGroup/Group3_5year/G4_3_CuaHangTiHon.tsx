import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G4_3_TinyShop: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
  childName
}) => {
  // --- CSS NÂNG CẤP ---
  const styles = `
    .shop-game-container {
      width: 100%; height: 100%; position: relative;
      background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%);
      border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; padding: 20px;
    }

    /* NHÂN VẬT NGƯỜI BÁN HÀNG & BONG BÓNG */
    .shopkeeper-area {
      display: flex; align-items: flex-end; gap: 15px; margin-bottom: 20px; padding-left: 20px;
    }
    .shopkeeper-avatar { font-size: 80px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2)); }
    
    .speech-bubble {
      background: white; border-radius: 20px; padding: 15px 25px;
      position: relative; box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      max-width: 400px; border: 3px solid #3B82F6;
      font-size: 20px; font-weight: bold; color: #1E3A8A;
    }
    .speech-bubble::after {
      content: ''; position: absolute; left: -20px; bottom: 20px;
      border-width: 10px 20px 10px 0; border-style: solid;
      border-color: transparent white transparent transparent;
    }

    .shop-content { display: flex; flex: 1; gap: 20px; overflow: hidden; }
    .shop-store {
      flex: 3; background: rgba(255, 255, 255, 0.9); border-radius: 20px;
      padding: 15px; display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 15px; overflow-y: auto; border: 4px solid #10B981;
    }
    .shop-cart {
      flex: 2; background: #fff; border-radius: 20px;
      padding: 20px; display: flex; flex-direction: column; border: 4px solid #3B82F6;
    }

    .shop-item {
      background: white; border-radius: 15px; padding: 10px; text-align: center;
      cursor: pointer; transition: all 0.2s; border: 2px solid #E5E7EB;
    }
    .shop-item.active { border-color: #3B82F6; background: #EFF6FF; transform: scale(1.02); }
    .shop-item-emoji { font-size: 40px; }

    .mic-indicator {
      display: flex; align-items: center; gap: 10px; color: #EF4444;
      font-weight: bold; font-size: 16px; margin-top: 10px;
    }
    .mic-pulse {
      width: 12px; height: 12px; background: #EF4444; border-radius: 50%;
      animation: pulse-red 1.5s infinite;
    }
    @keyframes pulse-red { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
    
    .shop-total { font-size: 22px; font-weight: bold; border-top: 2px solid #EEE; padding-top: 10px; }
  `;

  // --- DATA ---
  const shopItems = useMemo(() => [
    { id: 1, emoji: '🍎', name: 'Táo', price: 5 },
    { id: 2, emoji: '🍌', name: 'Chuối', price: 3 },
    { id: 3, emoji: '🥛', name: 'Sữa', price: 15 },
    { id: 4, emoji: '🍞', name: 'Bánh mì', price: 10 },
    { id: 5, emoji: '🥚', name: 'Trứng', price: 12 },
    { id: 6, emoji: '🍪', name: 'Bánh quy', price: 6 },
  ], []);

  // --- STATE ---
  const [cart, setCart] = useState<any[]>([]);
  const [sellerMessage, setSellerMessage] = useState("Chào con! Hôm nay con muốn mua gì cho mẹ nào? 🛒");
  const [isChildSpeaking, setIsChildSpeaking] = useState(false);
  const [speakingMetrics, setSpeakingMetrics] = useState({ startTime: 0, duration: 0, count: 0 });
  const [budget] = useState(50);

  // --- HỘI THOẠI LOGIC ---
  const askQuestion = useCallback((type: 'QUANTITY' | 'MORE' | 'SUCCESS') => {
    const questions = {
      QUANTITY: ["Con cần mua bao nhiêu món này nhỉ?", "Số lượng bao nhiêu là đủ hả con?", "Bé muốn lấy mấy cái nào?"],
      MORE: ["Con có muốn mua thêm gì nữa không?", "Giỏ hàng vẫn còn chỗ đấy, thêm gì nữa không nào?", "Còn món nào con thích nữa không?"],
      SUCCESS: ["Tuyệt quá! Đồ của con đây, cảm ơn con nhé! 🎉", "Con giỏi lắm, thanh toán xong rồi nè! ✨"]
    };
    const pool = questions[type];
    const msg = pool[Math.floor(Math.random() * pool.length)];
    setSellerMessage(msg);
    
    // Phát âm thanh giả lập người bán nói
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // --- XỬ LÝ MUA HÀNG ---
  const updateCart = (item: any, delta: number) => {
    const existing = cart.find(i => i.id === item.id);
    let newCart;
    if (existing) {
      newCart = cart.map(i => i.id === item.id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
                   .filter(i => i.quantity > 0);
    } else {
      newCart = [...cart, { ...item, quantity: 1 }];
    }
    setCart(newCart);

    // Người bán phản hồi khi có hành động
    if (delta > 0) askQuestion('QUANTITY');
    else if (newCart.length > 0) askQuestion('MORE');
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // --- THEO DÕI MICRO ---
  useEffect(() => {
    const ai = latestAIResult.current?.features;
    const speaking = ai?.isSpeaking ?? false;

    if (speaking && !isChildSpeaking) {
      setIsChildSpeaking(true);
      setSpeakingMetrics(prev => ({ ...prev, startTime: Date.now(), count: prev.count + 1 }));
    } else if (!speaking && isChildSpeaking) {
      setIsChildSpeaking(false);
      const duration = Date.now() - speakingMetrics.startTime;
      setSpeakingMetrics(prev => ({ ...prev, duration: prev.duration + duration }));
    }
  }, [latestAIResult.current?.features?.isSpeaking]);

  // --- AI TRACKING ---
  useEffect(() => {
    const record = setInterval(() => {
      const ai = latestAIResult.current?.features;
      onFeatureCapture({
        timestamp: Date.now(),
        gazeX: ai?.gazeX ?? 0.5,
        gazeY: ai?.gazeY ?? 0.5,
        attentionLevel: ai?.avgAttention ?? 0,
        smileIntensity: ai?.avgSmile ?? 0,
        frownIntensity: ai?.avgFrown ?? 0,
        poseConfidence: ai?.faceDetectionConfidence ?? 0,
        faceConfidence: ai?.faceDetectionConfidence ?? 0,
        childVocalization: ai?.isSpeaking ?? false,
        conversationTurnCount: speakingMetrics.count,
        totalSpeakingTimeMs: speakingMetrics.duration,
        isMaintainingTopic: cart.length > 0 && ai?.isSpeaking,
        
        affect: total > budget ? 'negative' : 'neutral',
        gameId: 'G4.3',
        childName
      } as BehavioralFeature); // Bây giờ ép kiểu sẽ không còn lỗi
    }, 200);
    return () => clearInterval(record);
  }, [cart, speakingMetrics, total, budget, childName, latestAIResult, onFeatureCapture]);

  return (
    <div className="shop-game-container">
      <style>{styles}</style>

      {/* KHU VỰC NGƯỜI BÁN HÀNG */}
      <div className="shopkeeper-area">
        <div className="shopkeeper-avatar">👩‍💼</div>
        <div className="speech-bubble">
          {sellerMessage}
          {isChildSpeaking && (
            <div className="mic-indicator">
              <div className="mic-pulse" /> Tớ đang nghe bé nói...
            </div>
          )}
        </div>
      </div>

      <div className="shop-content">
        {/* CỬA HÀNG */}
        <div className="shop-store">
          {shopItems.map(item => (
            <div 
              key={item.id} 
              className={`shop-item ${cart.find(i => i.id === item.id) ? 'active' : ''}`}
              onClick={() => updateCart(item, 1)}
            >
              <div className="shop-item-emoji">{item.emoji}</div>
              <div className="shop-item-name">{item.name}</div>
              <div style={{fontWeight: 'bold', color: '#10B981'}}>{item.price} xu</div>
            </div>
          ))}
        </div>

        {/* GIỎ HÀNG */}
        <div className="shop-cart">
          <h3 style={{textAlign: 'center', color: '#3B82F6'}}>🛒 Giỏ hàng của {childName || 'bé'}</h3>
          <div style={{flex: 1, overflowY: 'auto'}}>
            {cart.map(i => (
              <div key={i.id} style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee'}}>
                <span>{i.emoji} {i.name} x{i.quantity}</span>
                <div style={{display: 'flex', gap: '5px'}}>
                  <button onClick={(e) => { e.stopPropagation(); updateCart(i, -1); }} style={{width: '25px'}}>-</button>
                  <button onClick={(e) => { e.stopPropagation(); updateCart(i, 1); }} style={{width: '25px'}}>+</button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="shop-total">
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <span>Tổng:</span>
              <span style={{color: total > budget ? '#EF4444' : '#10B981'}}>{total} / {budget} xu</span>
            </div>
            <button 
              onClick={() => { askQuestion('SUCCESS'); setCart([]); }}
              style={{
                width: '100%', padding: '12px', marginTop: '10px', 
                background: total > budget ? '#9CA3AF' : '#10B981', 
                color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold'
              }}
              disabled={total > budget || total === 0}
            >
              THANH TOÁN
            </button>
          </div>
        </div>
      </div>

      <div style={{position: 'absolute', bottom: 10, right: 20, color: 'white', fontWeight: 'bold'}}>
        ⏱️ {timeElapsed}s
      </div>
    </div>
  );
};

export default G4_3_TinyShop;