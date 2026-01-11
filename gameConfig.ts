// src/gameConfig.ts
import { GameConfig, GameTheme } from './types'; 

// 1. Export THEMES (Giữ nguyên)
export const THEMES: Record<string, GameTheme> = {
  FRUITS: {
    id: 'fruits',
    name: 'Hoa Quả',
    assets: ['🍎', '🍌', '🍇', '🍊', '🍓', '🍉', '🍑', '🍍'],
    background: '#ecfdf5'
  },
  ANIMALS: {
    id: 'animals',
    name: 'Động Vật',
    assets: ['🐶', '🐱', '🐰', '🐼', '🐨', '🐯', '🦁', '🐮'],
    background: '#fff7ed'
  },
  SHAPES: {
    id: 'shapes',
    name: 'Hình Khối',
    assets: ['⭐', '🔵', '🟥', '🔺', '🔶', '💜'],
    background: '#f0f9ff'
  },
  VEHICLES: {
    id: 'vehicles',
    name: 'Phương Tiện',
    assets: ['🚗', '🚕', '🚌', '🚓', '🚑', '🚒', '✈️', '🚀'],
    background: '#f1f5f9'
  }
};

// 2. Hàm nhận thêm specificAsset
export const getGameConfig = (age: number, themeId: string, specificAsset: string | null): GameConfig => {
  
  // Lấy theme gốc
  const originalTheme = Object.values(THEMES).find(t => t.id === themeId) || THEMES.ANIMALS;

  // Tạo một bản sao của theme để không làm hỏng dữ liệu gốc
  // Nếu có specificAsset, mảng assets chỉ chứa đúng 1 hình đó
  const themeToUse = {
    ...originalTheme,
    assets: specificAsset ? [specificAsset] : originalTheme.assets
  };

  // Cố định âm thanh theo yêu cầu
  const fixedAudio = ['ba ơi', 'mẹ ơi', 'a'];

  // Cấu hình Độ khó (Difficulty) dựa trên Tuổi
  if (age <= 4) {
    return {
      ageRange: '2-4',
      jumpInterval: 4000, 
      duration: 60,       
      targetSizeRange: [120, 180], 
      audioPrompts: fixedAudio, // SỬA: Chỉ dùng âm thanh này
      theme: themeToUse         // SỬA: Dùng theme đã lọc hình ảnh
    };
  }
  
  if (age <= 7) {
    return {
      ageRange: '5-7',
      jumpInterval: 2500, 
      duration: 60,
      targetSizeRange: [80, 140], 
      audioPrompts: fixedAudio,
      theme: themeToUse
    };
  }

  return {
    ageRange: '8+',
    jumpInterval: 1500, 
    duration: 60,
    targetSizeRange: [60, 100], 
    audioPrompts: fixedAudio,
    theme: themeToUse
  };
};