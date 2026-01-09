import { GameConfig, GameTheme } from './types'; 

// 1. Export THEMES để App.tsx có thể dùng
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

// 2. Hàm nhận thêm themeId
export const getGameConfig = (age: number, themeId: string): GameConfig => {
  
  // Lấy theme dựa trên ID người dùng chọn, mặc định là ANIMALS nếu lỗi
  const selectedTheme = Object.values(THEMES).find(t => t.id === themeId) || THEMES.ANIMALS;

  // Cấu hình Độ khó (Difficulty) dựa trên Tuổi
  if (age <= 4) {
    return {
      ageRange: '2-4',
      jumpInterval: 4000, 
      duration: 60,       
      targetSizeRange: [120, 180], 
      audioPrompts: ['A', 'Ba', 'Mẹ', 'Cá'],
      theme: selectedTheme
    };
  }
  
  if (age <= 7) {
    return {
      ageRange: '5-7',
      jumpInterval: 2500, 
      duration: 60,
      targetSizeRange: [80, 140], 
      audioPrompts: ['Quả Táo', 'Con Mèo', 'Màu Đỏ'],
      theme: selectedTheme
    };
  }

  return {
    ageRange: '8+',
    jumpInterval: 1500, 
    duration: 60,
    targetSizeRange: [60, 100], 
    audioPrompts: ['Bên trái', 'Bên phải', 'Mỉm cười'],
    theme: selectedTheme
  };
};