import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SubGameProps, BehavioralFeature } from '../../types';

const G4_3_TinyShop: React.FC<SubGameProps> = ({ 
  latestAIResult, 
  onFeatureCapture, 
  timeElapsed,
}) => {
  // --- CSS NỘI BỘ ---
  const styles = `
    .shop-game-container {
      width: 100%;
      height: 100%;
      position: relative;
      background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      padding: 20px;
    }

    .shop-timer {
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

    .shop-title {
      text-align: center;
      color: #7C2D12;
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 15px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
      background: rgba(255, 255, 255, 0.9);
      padding: 10px 30px;
      border-radius: 20px;
    }

    .shop-content {
      display: flex;
      flex: 1;
      gap: 20px;
      margin-top: 10px;
    }

    .shop-store {
      flex: 3;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 20px;
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      overflow-y: auto;
      border: 4px solid #10B981;
    }

    .shop-cart {
      flex: 2;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 20px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      border: 4px solid #3B82F6;
    }

    .shop-item {
      background: white;
      border-radius: 15px;
      padding: 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      border: 3px solid transparent;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .shop-item:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }

    .shop-item.selected {
      border-color: #3B82F6;
      background: #EFF6FF;
    }

    .shop-item-emoji {
      font-size: 48px;
    }

    .shop-item-name {
      font-size: 18px;
      font-weight: bold;
      color: #1F2937;
    }

    .shop-item-price {
      font-size: 20px;
      font-weight: bold;
      color: #10B981;
      background: #D1FAE5;
      padding: 5px 15px;
      border-radius: 20px;
    }

    .shop-item-quantity {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 10px;
    }

    .shop-quantity-btn {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #3B82F6;
      color: white;
      border: none;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .shop-quantity-btn:hover {
      background: #2563EB;
    }

    .shop-quantity-btn:disabled {
      background: #9CA3AF;
      cursor: not-allowed;
    }

    .shop-quantity-display {
      font-size: 20px;
      font-weight: bold;
      min-width: 30px;
      text-align: center;
    }

    .shop-cart-header {
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      color: #3B82F6;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 3px solid #3B82F6;
    }

    .shop-cart-items {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .shop-cart-item {
      background: white;
      border-radius: 12px;
      padding: 15px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
      border-left: 5px solid #10B981;
    }

    .shop-cart-item-emoji {
      font-size: 32px;
    }

    .shop-cart-item-info {
      flex: 1;
      margin-left: 15px;
    }

    .shop-cart-item-name {
      font-weight: bold;
      color: #1F2937;
    }

    .shop-cart-item-price {
      color: #6B7280;
      font-size: 14px;
    }

    .shop-cart-item-total {
      font-weight: bold;
      color: #10B981;
      font-size: 18px;
    }

    .shop-cart-footer {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 3px solid #3B82F6;
    }

    .shop-total {
      display: flex;
      justify-content: space-between;
      font-size: 24px;
      font-weight: bold;
      color: #1F2937;
      margin-bottom: 20px;
    }

    .shop-total-amount {
      color: #10B981;
    }

    .shop-budget {
      background: #FEF3C7;
      padding: 12px;
      border-radius: 12px;
      text-align: center;
      font-size: 20px;
      font-weight: bold;
      color: #92400E;
      margin-bottom: 15px;
      border: 2px solid #F59E0B;
    }

    .shop-controls {
      display: flex;
      gap: 15px;
      justify-content: center;
    }

    .shop-control-btn {
      background: white;
      border: none;
      padding: 12px 25px;
      border-radius: 12px;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .shop-control-btn:hover {
      transform: translateY(-3px);
    }

    .shop-control-btn.buy {
      background: #10B981;
      color: white;
    }

    .shop-control-btn.reset {
      background: #EF4444;
      color: white;
    }

    .shop-control-btn.next {
      background: #8B5CF6;
      color: white;
    }

    .shop-feedback {
      position: absolute;
      bottom: 30px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 22px;
      font-weight: bold;
      color: #7C2D12;
      padding: 15px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 15px;
      margin: 0 40px;
      z-index: 10;
      border: 3px solid #F59E0B;
      min-height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .shop-instruction {
      text-align: center;
      font-size: 20px;
      font-weight: bold;
      color: #7C2D12;
      margin: 10px 0;
      background: rgba(255, 255, 255, 0.8);
      padding: 10px;
      border-radius: 12px;
    }

    .shop-success-animation {
      animation: success 1s ease;
    }

    @keyframes success {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    .shop-progress {
      width: 80%;
      height: 8px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      overflow: hidden;
      margin: 10px auto;
    }

    .shop-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #FCD34D, #F59E0B);
      border-radius: 10px;
      transition: width 0.5s ease;
    }

    @media (max-width: 768px) {
      .shop-content {
        flex-direction: column;
      }
      
      .shop-store {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .shop-title {
        font-size: 24px;
        padding: 8px 20px;
      }
      
      .shop-item {
        padding: 15px;
      }
      
      .shop-item-emoji {
        font-size: 36px;
      }
      
      .shop-item-name {
        font-size: 16px;
      }
      
      .shop-feedback {
        font-size: 18px;
        margin: 0 20px;
        padding: 12px;
      }
      
      .shop-instruction {
        font-size: 16px;
      }
    }
  `;

  // --- LOGIC ---
  interface ShopItem {
    id: number;
    emoji: string;
    name: string;
    price: number;
    quantity: number;
  }

  interface CartItem {
    item: ShopItem;
    quantity: number;
    total: number;
  }

  interface ShoppingChallenge {
    id: number;
    description: string;
    items: { id: number; quantity: number }[];
    budget: number;
  }

  const GAME_DURATION = 360; // Tăng thời gian vì có nhiều vòng hơn
  
  const shopItems: ShopItem[] = useMemo(() => [
    { id: 1, emoji: '🍎', name: 'Táo', price: 5, quantity: 0 },
    { id: 2, emoji: '🍌', name: 'Chuối', price: 3, quantity: 0 },
    { id: 3, emoji: '🍓', name: 'Dâu', price: 8, quantity: 0 },
    { id: 4, emoji: '🥕', name: 'Cà rốt', price: 2, quantity: 0 },
    { id: 5, emoji: '🍞', name: 'Bánh mì', price: 10, quantity: 0 },
    { id: 6, emoji: '🥛', name: 'Sữa', price: 15, quantity: 0 },
    { id: 7, emoji: '🥚', name: 'Trứng', price: 12, quantity: 0 },
    { id: 8, emoji: '🍪', name: 'Bánh quy', price: 6, quantity: 0 },
    { id: 9, emoji: '🧃', name: 'Nước trái cây', price: 7, quantity: 0 },
    { id: 10, emoji: '🍫', name: 'Sô-cô-la', price: 9, quantity: 0 },
    { id: 11, emoji: '🍬', name: 'Kẹo', price: 4, quantity: 0 },
    { id: 12, emoji: '🥪', name: 'Sandwich', price: 20, quantity: 0 }
  ], []);

  const challenges: ShoppingChallenge[] = useMemo(() => [
    {
      id: 1,
      description: 'Mua đồ cho bữa sáng: 2 trứng, 1 bánh mì, 1 sữa',
      items: [
        { id: 7, quantity: 2 },
        { id: 5, quantity: 1 },
        { id: 6, quantity: 1 }
      ],
      budget: 50
    },
    {
      id: 2,
      description: 'Mua trái cây: 3 táo, 2 chuối, 1 dâu',
      items: [
        { id: 1, quantity: 3 },
        { id: 2, quantity: 2 },
        { id: 3, quantity: 1 }
      ],
      budget: 35
    },
    {
      id: 3,
      description: 'Mua đồ ăn nhẹ: 2 bánh quy, 1 nước trái cây, 3 cà rốt',
      items: [
        { id: 8, quantity: 2 },
        { id: 9, quantity: 1 },
        { id: 4, quantity: 3 }
      ],
      budget: 30
    },
    {
      id: 4,
      description: 'Mua đồ cho bữa trưa: 2 sandwich, 1 nước trái cây',
      items: [
        { id: 12, quantity: 2 },
        { id: 9, quantity: 1 }
      ],
      budget: 50
    },
    {
      id: 5,
      description: 'Mua đồ ngọt: 1 sô-cô-la, 3 kẹo, 2 bánh quy',
      items: [
        { id: 10, quantity: 1 },
        { id: 11, quantity: 3 },
        { id: 8, quantity: 2 }
      ],
      budget: 30
    },
    {
      id: 6,
      description: 'Mua rau củ: 4 cà rốt, 2 táo, 1 chuối',
      items: [
        { id: 4, quantity: 4 },
        { id: 1, quantity: 2 },
        { id: 2, quantity: 1 }
      ],
      budget: 20
    },
    {
      id: 7,
      description: 'Mua đồ uống: 2 sữa, 2 nước trái cây',
      items: [
        { id: 6, quantity: 2 },
        { id: 9, quantity: 2 }
      ],
      budget: 45
    },
    {
      id: 8,
      description: 'Mua bữa sáng đơn giản: 1 bánh mì, 1 sữa, 1 trứng',
      items: [
        { id: 5, quantity: 1 },
        { id: 6, quantity: 1 },
        { id: 7, quantity: 1 }
      ],
      budget: 40
    },
    {
      id: 9,
      description: 'Mua nhiều trái cây: 2 táo, 2 chuối, 2 dâu',
      items: [
        { id: 1, quantity: 2 },
        { id: 2, quantity: 2 },
        { id: 3, quantity: 2 }
      ],
      budget: 35
    },
    {
      id: 10,
      description: 'Mua đồ cho tiệc nhỏ: 3 bánh quy, 2 sô-cô-la, 1 nước trái cây',
      items: [
        { id: 8, quantity: 3 },
        { id: 10, quantity: 2 },
        { id: 9, quantity: 1 }
      ],
      budget: 40
    },
    {
      id: 11,
      description: 'Mua đầy đủ dinh dưỡng: 1 sandwich, 1 sữa, 1 chuối',
      items: [
        { id: 12, quantity: 1 },
        { id: 6, quantity: 1 },
        { id: 2, quantity: 1 }
      ],
      budget: 45
    },
    {
      id: 12,
      description: 'Mua nhiều đồ ăn nhẹ: 4 bánh quy, 3 kẹo, 2 cà rốt',
      items: [
        { id: 8, quantity: 4 },
        { id: 11, quantity: 3 },
        { id: 4, quantity: 2 }
      ],
      budget: 40
    },
    {
      id: 13,
      description: 'Mua đồ cho bữa tối: 2 trứng, 1 bánh mì, 2 cà rốt',
      items: [
        { id: 7, quantity: 2 },
        { id: 5, quantity: 1 },
        { id: 4, quantity: 2 }
      ],
      budget: 40
    },
    {
      id: 14,
      description: 'Mua đồ uống nhiều: 3 nước trái cây, 1 sữa',
      items: [
        { id: 9, quantity: 3 },
        { id: 6, quantity: 1 }
      ],
      budget: 35
    },
    {
      id: 15,
      description: 'Mua đa dạng: 1 sandwich, 1 táo, 1 bánh quy, 1 nước trái cây',
      items: [
        { id: 12, quantity: 1 },
        { id: 1, quantity: 1 },
        { id: 8, quantity: 1 },
        { id: 9, quantity: 1 }
      ],
      budget: 45
    }
  ], []);

  const [items, setItems] = useState<ShopItem[]>(shopItems);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [budget, setBudget] = useState(50);
  const [currentChallenge, setCurrentChallenge] = useState<ShoppingChallenge | null>(null);
  const [feedback, setFeedback] = useState('Chào mừng đến cửa hàng tí hon! Mua gì nào? 🛒');
  const [currentRound, setCurrentRound] = useState(1);
  const [completedRounds, setCompletedRounds] = useState<number[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [allChallengesCompleted, setAllChallengesCompleted] = useState(false);
  const [availableChallenges, setAvailableChallenges] = useState<number[]>([]);
  const [score, setScore] = useState(0);

  // Khởi tạo vòng đầu tiên
  useEffect(() => {
    const initialAvailableChallenges = challenges.map(c => c.id);
    setAvailableChallenges(initialAvailableChallenges);
    selectRandomChallenge(initialAvailableChallenges);
  }, []);

  const selectRandomChallenge = (availableIds: number[]) => {
    if (availableIds.length === 0) {
      setAllChallengesCompleted(true);
      setCurrentChallenge(null);
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * availableIds.length);
    const randomChallengeId = availableIds[randomIndex];
    const challenge = challenges.find(c => c.id === randomChallengeId);
    
    if (challenge) {
      setCurrentChallenge(challenge);
      setBudget(challenge.budget);
      setFeedback(`Vòng ${currentRound}: ${challenge.description}`);
    }
  };

  const updateCart = (item: ShopItem, newQuantity: number) => {
    if (newQuantity < 0 || isPurchasing) return;
    
    // Cập nhật số lượng trong kho
    const updatedItems = items.map(i =>
      i.id === item.id ? { ...i, quantity: newQuantity } : i
    );
    setItems(updatedItems);
    
    // Cập nhật giỏ hàng
    const cartItemIndex = cart.findIndex(ci => ci.item.id === item.id);
    let updatedCart = [...cart];
    
    if (newQuantity > 0) {
      const cartItem: CartItem = {
        item,
        quantity: newQuantity,
        total: newQuantity * item.price
      };
      
      if (cartItemIndex >= 0) {
        updatedCart[cartItemIndex] = cartItem;
      } else {
        updatedCart.push(cartItem);
      }
    } else {
      if (cartItemIndex >= 0) {
        updatedCart.splice(cartItemIndex, 1);
      }
    }
    
    setCart(updatedCart);
    
    // Tính tổng tiền
    const newTotal = updatedCart.reduce((sum, ci) => sum + ci.total, 0);
    setTotal(newTotal);
    
    // Kiểm tra ngân sách
    if (newTotal > budget) {
      setFeedback('Ôi! Đã vượt quá ngân sách! Hãy điều chỉnh lại. 💸');
    } else {
      setFeedback(`Đã thêm ${item.name} vào giỏ hàng! 🛒`);
    }
  };

  const checkChallenge = (): { success: boolean; message: string } => {
    if (!currentChallenge) return { success: false, message: 'Không có thử thách nào!' };
    
    // Kiểm tra từng item trong thử thách
    for (const requiredItem of currentChallenge.items) {
      const cartItem = cart.find(ci => ci.item.id === requiredItem.id);
      if (!cartItem) {
        return { 
          success: false, 
          message: `Thiếu ${requiredItem.quantity} ${getItemName(requiredItem.id)}!` 
        };
      }
      if (cartItem.quantity !== requiredItem.quantity) {
        return { 
          success: false, 
          message: `Cần ${requiredItem.quantity} ${getItemName(requiredItem.id)}, bạn có ${cartItem.quantity}!` 
        };
      }
    }
    
    // Kiểm tra có item thừa không
    if (cart.length > currentChallenge.items.length) {
      return { 
        success: false, 
        message: 'Bạn đã mua thêm những món không cần thiết!' 
      };
    }
    
    // Kiểm tra ngân sách
    if (total > budget) {
      return { 
        success: false, 
        message: 'Vượt quá ngân sách!' 
      };
    }
    
    return { 
      success: true, 
      message: `Hoàn hảo! Bạn đã mua đúng yêu cầu và còn dư ${budget - total} xu! 🎉` 
    };
  };

  const getItemName = (id: number): string => {
    const item = shopItems.find(i => i.id === id);
    return item ? item.name : 'món đồ';
  };

  const handlePurchase = () => {
    if (isPurchasing || allChallengesCompleted) return;
    
    setIsPurchasing(true);
    const result = checkChallenge();
    
    if (result.success) {
      setShowSuccess(true);
      setFeedback(result.message);
      
      // Tính điểm: 10 điểm cơ bản + (số tiền còn lại / 5)
      const pointsEarned = 10 + Math.floor((budget - total) / 5);
      setScore(prev => prev + pointsEarned);
      
      // Đánh dấu vòng đã hoàn thành
      if (currentChallenge) {
        setCompletedRounds(prev => [...prev, currentChallenge.id]);
        
        // Loại bỏ vòng đã hoàn thành khỏi danh sách có sẵn
        const newAvailableChallenges = availableChallenges.filter(id => id !== currentChallenge.id);
        setAvailableChallenges(newAvailableChallenges);
        
        // Chuyển sang vòng tiếp theo sau 2 giây
        setTimeout(() => {
          setCurrentRound(prev => prev + 1);
          selectRandomChallenge(newAvailableChallenges);
          resetCart();
          setShowSuccess(false);
          setIsPurchasing(false);
          
          if (newAvailableChallenges.length === 0) {
            setFeedback('🎉 Chúc mừng! Bạn đã hoàn thành tất cả 15 vòng thử thách! 🏆');
          } else {
            setFeedback(`Chuẩn bị cho vòng tiếp theo... (+${pointsEarned} điểm)`);
          }
        }, 2000);
      }
    } else {
      setFeedback(result.message);
      setTimeout(() => setIsPurchasing(false), 1000);
    }
  };

  const resetCart = () => {
    setItems(shopItems.map(item => ({ ...item, quantity: 0 })));
    setCart([]);
    setTotal(0);
  };

  const skipChallenge = () => {
    if (isPurchasing || allChallengesCompleted) return;
    
    if (currentChallenge) {
      const newAvailableChallenges = availableChallenges.filter(id => id !== currentChallenge.id);
      setAvailableChallenges(newAvailableChallenges);
      setCurrentRound(prev => prev + 1);
      selectRandomChallenge(newAvailableChallenges);
      resetCart();
      setFeedback('Đã bỏ qua vòng này! Thử vòng tiếp theo nhé! ⏭️');
    }
  };

  useEffect(() => {
    const recordLoop = setInterval(() => {
      const aiData = latestAIResult.current?.features;
      
      // Xác định affect
      let affect: 'positive' | 'neutral' | 'negative' | 'surprised' = 'neutral';
      if (showSuccess) affect = 'positive';
      if (total > budget) affect = 'negative';
      if (isPurchasing) affect = 'surprised';
      
      // Tập trung vào khu vực cửa hàng
      const feature: BehavioralFeature = {
        timestamp: Date.now(),
        gazeX: aiData?.gazeX ?? 0.5,
        gazeY: aiData?.gazeY ?? 0.5,
        targetX: 30,
        targetY: 50,
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
  }, [total, budget, showSuccess, isPurchasing, onFeatureCapture, latestAIResult]);

  const progressPercentage = (completedRounds.length / 15) * 100;

  return (
    <div className="shop-game-container">
      <style>{styles}</style>

      <div className="shop-timer">
        ⏱️ {timeElapsed}s / {GAME_DURATION}s
      </div>
      
      <div className="shop-title">
        🛒 Cửa Hàng Tí Hon
      </div>

      <div className="shop-instruction">
        {allChallengesCompleted ? (
          '🎉 Chúc mừng! Bạn đã hoàn thành tất cả thử thách! 🏆'
        ) : currentChallenge ? (
          `Vòng ${currentRound}/15: ${currentChallenge.description}`
        ) : (
          'Đang tải thử thách...'
        )}
      </div>

      {!allChallengesCompleted ? (
        <>
          <div className="shop-content">
            <div className="shop-store">
              {items.map(item => (
                <div 
                  key={item.id} 
                  className={`shop-item ${item.quantity > 0 ? 'selected' : ''}`}
                >
                  <div className="shop-item-emoji">{item.emoji}</div>
                  <div className="shop-item-name">{item.name}</div>
                  <div className="shop-item-price">{item.price} xu</div>
                  <div className="shop-item-quantity">
                    <button 
                      className="shop-quantity-btn"
                      onClick={() => updateCart(item, item.quantity - 1)}
                      disabled={item.quantity === 0 || isPurchasing}
                    >
                      -
                    </button>
                    <div className="shop-quantity-display">{item.quantity}</div>
                    <button 
                      className="shop-quantity-btn"
                      onClick={() => updateCart(item, item.quantity + 1)}
                      disabled={isPurchasing}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="shop-cart">
              <div className="shop-cart-header">
                🛍️ Giỏ Hàng Của Con
              </div>
              
              <div className={`shop-budget ${showSuccess ? 'shop-success-animation' : ''}`}>
                Ngân sách: {budget} xu | Đã dùng: {total} xu | Còn lại: {budget - total} xu
              </div>
              
              <div className="shop-cart-items">
                {cart.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#6B7280', 
                    fontStyle: 'italic',
                    padding: '40px'
                  }}>
                    Giỏ hàng trống. Hãy chọn món đồ nào! 🛍️
                  </div>
                ) : (
                  cart.map(cartItem => (
                    <div key={cartItem.item.id} className="shop-cart-item">
                      <div className="shop-cart-item-emoji">{cartItem.item.emoji}</div>
                      <div className="shop-cart-item-info">
                        <div className="shop-cart-item-name">{cartItem.item.name}</div>
                        <div className="shop-cart-item-price">
                          {cartItem.item.price} xu × {cartItem.quantity}
                        </div>
                      </div>
                      <div className="shop-cart-item-total">
                        {cartItem.total} xu
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="shop-cart-footer">
                <div className="shop-total">
                  <span>Tổng cộng:</span>
                  <span className="shop-total-amount">{total} xu</span>
                </div>
                
                <div className="shop-progress">
                  <div 
                    className="shop-progress-bar" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                
                <div style={{ 
                  textAlign: 'center', 
                  color: '#6B7280',
                  marginBottom: '10px',
                  fontSize: '16px'
                }}>
                  Đã hoàn thành: {completedRounds.length}/15 vòng | Điểm: {score} ✨
                </div>
                
                <div className="shop-controls">
                  <button 
                    className="shop-control-btn reset"
                    onClick={resetCart}
                    disabled={isPurchasing}
                  >
                    <span>🔄</span> Làm lại
                  </button>
                  <button 
                    className="shop-control-btn buy"
                    onClick={handlePurchase}
                    disabled={isPurchasing || total === 0}
                  >
                    <span>{isPurchasing ? '⏳' : '💰'}</span> 
                    {isPurchasing ? 'Đang kiểm tra...' : 'Thanh toán'}
                  </button>
                  <button 
                    className="shop-control-btn next"
                    onClick={skipChallenge}
                    disabled={isPurchasing}
                  >
                    <span>⏭️</span> Bỏ qua
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          margin: '20px'
        }}>
          <div style={{ fontSize: '72px', marginBottom: '20px' }}>🏆🎉</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#7C2D12', marginBottom: '10px' }}>
            Chúc mừng bạn!
          </div>
          <div style={{ fontSize: '24px', color: '#6B7280', marginBottom: '20px' }}>
            Bạn đã hoàn thành tất cả 15 vòng thử thách mua sắm!
          </div>
          <div style={{ 
            background: '#FEF3C7', 
            padding: '20px', 
            borderRadius: '15px',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#92400E',
            marginBottom: '30px'
          }}>
            Tổng điểm: {score} ✨
          </div>
          <button 
            onClick={() => {
              const initialAvailableChallenges = challenges.map(c => c.id);
              setAvailableChallenges(initialAvailableChallenges);
              setCompletedRounds([]);
              setCurrentRound(1);
              setScore(0);
              setAllChallengesCompleted(false);
              selectRandomChallenge(initialAvailableChallenges);
              resetCart();
            }}
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
              gap: '10px'
            }}
          >
            <span>🔄</span> Chơi lại từ đầu
          </button>
        </div>
      )}

      <div className={`shop-feedback ${showSuccess ? 'shop-success-animation' : ''}`}>
        {feedback}
      </div>
    </div>
  );
};

export default G4_3_TinyShop;