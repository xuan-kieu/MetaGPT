    // src/services/reportService.ts

import { FullAssessmentResult, ScoreDetail, SkillType } from './scoringService';

// Interface cho thông tin bổ sung không nằm trong kết quả tính toán
export interface ChildProfileInfo {
  name: string;
  assessmentDate: string;
  completedGames: number;
  totalGames: number;
}

export class ReportService {

  /**
   * HÀM CHÍNH: Tạo báo cáo dạng văn bản (Text Report)
   * Khớp với mẫu ở Mục F
   */
  static generateTextReport(
    info: ChildProfileInfo,
    result: FullAssessmentResult
  ): string {
    
    // 1. Header & Thông tin chung
    let text = `PHIẾU ĐÁNH GIÁ SÀNG LỌC PHÁT TRIỂN\n`;
    text += `-----------------------------------\n`;
    text += `Thông tin trẻ: ${info.name}, ${result.childAgeMonths} tháng\n`;
    text += `Ngày đánh giá: ${info.assessmentDate}\n`;
    text += `Hoàn thành: ${info.completedGames}/${info.totalGames} game\n\n`;

    // 2. Kết quả tổng quan
    text += `KẾT QUẢ TỔNG QUAN:\n`;
    text += `Mức độ nguy cơ: ${this.translateRiskLevel(result.riskLevel)}\n`;
    text += `Điểm tổng hợp: ${result.totalRiskScore}% so với chuẩn tuổi\n\n`;

    // 3. Kết quả chi tiết theo nhóm (Lấy trực tiếp từ ScoringService, không tính lại)
    text += `KẾT QUẢ THEO NHÓM KỸ NĂNG:\n`;
    
    // Nhóm 1: Kỹ năng Lõi (Core)
    text += `1. KỸ NĂNG LÕI (CORE): ${result.domains.core.score}% (${this.getDomainStatus(result.domains.core.score)})\n`;
    text += this.formatSkillList(result.domains.core.skills);

    // Nhóm 2: Kỹ năng Xã hội (Social)
    text += `\n2. KỸ NĂNG XÃ HỘI: ${result.domains.social.score}% (${this.getDomainStatus(result.domains.social.score)})\n`;
    text += this.formatSkillList(result.domains.social.skills);

    // Nhóm 3: Kỹ năng Nhận thức (Cognitive)
    text += `\n3. KỸ NĂNG NHẬN THỨC: ${result.domains.cognitive.score}% (${this.getDomainStatus(result.domains.cognitive.score)})\n`;
    text += this.formatSkillList(result.domains.cognitive.skills);

    // 4. Chỉ số nổi bật (Logic tự động trích xuất)
    text += `\nCHỈ SỐ NỔI BẬT CẦN QUAN TÂM:\n`;
    text += this.extractNotableIndicators(result);

    // 5. Khuyến nghị & Kết luận
    text += `\nKHUYẾN NGHỊ:\n`;
    text += this.getRecommendations(result.riskLevel);
    
    text += `\n\nLƯU Ý: Đây là kết quả sàng lọc, không thay thế chẩn đoán chuyên khoa.`;

    return text;
  }

  // --- CÁC HÀM HỖ TRỢ (HELPER METHODS) ---

  private static translateName(skillId: string): string {
    const map: Record<string, string> = {
      'joint_attention': 'Chú ý chia sẻ',
      'social_imitation': 'Bắt chước',
      'non_verbal': 'Giao tiếp không lời',
      'response_to_name': 'Phản ứng với tên',
      'emotion_recognition': 'Nhận diện cảm xúc',
      'turn_taking': 'Luân phiên',
      'pretend_play': 'Chơi giả vờ',
      'categorization': 'Phân loại',
      'memory': 'Trí nhớ',
      'problem_solving': 'Giải quyết vấn đề'
    };
    return map[skillId] || skillId;
  }

  private static formatSkillList(skills: Partial<Record<SkillType, ScoreDetail>>): string {
    let output = '';
    for (const [key, detail] of Object.entries(skills)) {
      if (!detail) continue;
      
      const skillName = this.translateName(key);
      const icon = detail.zScore < -1.0 ? '⚠️' : (detail.zScore >= 0 ? '✅' : ''); // Logic icon đơn giản
      
      output += `   - ${skillName}: ${Math.round(detail.raw)}% ${icon}\n`;
    }
    return output;
  }

  private static getDomainStatus(score: number): string {
    if (score >= 80) return 'TỐT';
    if (score >= 50) return 'ỔN';
    return 'CẦN THEO DÕI';
  }

  private static translateRiskLevel(level: string): string {
    const map: Record<string, string> = {
      'VERY_HIGH': 'RẤT CAO 🔴',
      'HIGH': 'CAO 🟠',
      'MEDIUM': 'TRUNG BÌNH 🟡',
      'LOW': 'THẤP 🟢'
    };
    return map[level] || level;
  }

  private static extractNotableIndicators(result: FullAssessmentResult): string {
    let notes = '';
    
    // Gom tất cả skill lại để tìm cái nào thấp nhất
    const allSkills = { 
      ...result.domains.core.skills, 
      ...result.domains.social.skills, 
      ...result.domains.cognitive.skills 
    };

    // Tìm các skill có Z-score thấp (dưới -1.0)
    const problems = Object.entries(allSkills)
      .filter(([_, val]) => val && val.zScore < -1.0)
      .sort((a, b) => (a[1]!.zScore - b[1]!.zScore)); // Sắp xếp từ thấp nhất lên

    if (problems.length === 0) {
      return '   • Chưa ghi nhận dấu hiệu bất thường rõ rệt.\n';
    }

    // Lấy top 3 vấn đề
    problems.slice(0, 3).forEach(([key, val]) => {
      const name = this.translateName(key);
      const score = Math.round(val!.raw);
      
      // Custom message cho từng loại lỗi phổ biến
      if (key === 'response_to_name') {
        notes += `   • Phản ứng chậm hoặc không phản ứng khi được gọi tên (Điểm: ${score}%)\n`;
      } else if (key === 'joint_attention') {
        notes += `   • Hạn chế chia sẻ sự chú ý, ít chỉ trỏ (Điểm: ${score}%)\n`;
      } else if (key === 'non_verbal') {
        notes += `   • Hạn chế giao tiếp mắt (Điểm: ${score}%)\n`;
      } else {
        notes += `   • ${name} còn hạn chế so với tuổi (Điểm: ${score}%)\n`;
      }
    });

    return notes;
  }

  private static getRecommendations(level: string): string {
    if (level === 'VERY_HIGH') {
      return `   • ƯU TIÊN: Đưa trẻ đi khám chuyên khoa Tâm lý/Thần kinh nhi ngay lập tức.\n   • THỰC HÀNH: Can thiệp tích cực 1-1 mọi lúc mọi nơi.\n   • ĐỊA CHỈ: Bệnh viện Nhi Trung ương, Khoa Tâm bệnh.`;
    }
    if (level === 'HIGH') {
      return `   • ƯU TIÊN: Tham vấn chuyên gia tâm lý để lên kế hoạch can thiệp.\n   • THỰC HÀNH: Tăng cường tương tác mắt và gọi tên.\n   • THEO DÕI: Đánh giá lại sau 1 tháng.`;
    }
    if (level === 'MEDIUM') {
      return `   • THỰC HÀNH: Chơi các trò chơi luân phiên (chi chi chành chành, ú òa).\n   • THEO DÕI: Quan sát thêm và đánh giá lại sau 3 tháng.`;
    }
    return `   • DUY TRÌ: Tiếp tục các hoạt động vui chơi và giáo dục hiện tại.\n   • THEO DÕI: Khám sức khỏe định kỳ.`;
  }
}