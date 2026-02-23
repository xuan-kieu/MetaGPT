// ============================================
// CẤU HÌNH CHƯƠNG TRÌNH ĐÁNH GIÁ
// ============================================

export type AgeGroupInfo = {
    id: string;
    label: string;
    description: string;
    targetTime: string;
    numericAge: number;
    previewList: string[];
  };
  
  export const PROGRAM_INFO: Record<string, AgeGroupInfo> = {
    GROUP_A: { 
      id: 'GROUP_A', 
      label: 'Nhóm 12-18 tháng', 
      description: 'Vận động tinh & Tương tác sớm', 
      targetTime: '10 phút', 
      numericAge: 15, 
      previewList: ['Gateway: Bong Bóng Bay', 'Vỗ Tay', 'Quay Lại', 'Ú Òa', 'Đồ Chơi'] 
    },
    GROUP_B: { 
      id: 'GROUP_B', 
      label: 'Nhóm 18-24 tháng', 
      description: 'Ngôn ngữ & Bắt chước', 
      targetTime: '15 phút', 
      numericAge: 20, 
      previewList: ['Gateway: Chỉ Tay', 'Xếp Tháp', 'Tiếng Kêu', 'Cho Ăn', 'Tìm Bóng'] 
    },
    GROUP_C: { 
      id: 'GROUP_C', 
      label: 'Nhóm 2-3 tuổi', 
      description: 'Nhận thức & Cảm xúc', 
      targetTime: '18 phút', 
      numericAge: 30, 
      previewList: ['Gateway: Về Đúng Nhà', 'Cảm Xúc', 'Đến Lượt', 'Ghép Cặp', 'Mê Cung'] 
    },
    GROUP_D: { 
      id: 'GROUP_D', 
      label: 'Nhóm 3-5 tuổi', 
      description: 'Tư duy logic & Xã hội', 
      targetTime: '20 phút', 
      numericAge: 48, 
      previewList: ['Gateway: Vì Sao Thế', 'Kể Chuyện', 'Cửa Hàng', 'Chỉ Dẫn', 'Quy Tắc'] 
    }
  };