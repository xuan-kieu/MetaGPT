// services/scoringService.ts

// --- 1. CONFIG & INTERFACES ---

export type SkillType = 'joint_attention' | 'social_imitation' | 'non_verbal' | 'response_to_name' | 
                        'emotion_recognition' | 'turn_taking' | 'pretend_play' | 
                        'categorization' | 'memory' | 'problem_solving';

export interface AssessmentInput {
  skillId: SkillType;
  observedValue: number;
}

export interface AgeGroupConfig {
  [skillId: string]: {
    expected: number;
    isTimeBased?: boolean; // True nếu chỉ số là thời gian (càng nhỏ càng tốt)
    mean: number; 
    std: number;
  }
}

export interface ScoreDetail {
  raw: number;
  zScore: number;
  classification: {
    level: string;
    color: string;
    description: string;
  };
}

export interface DomainResult {
  score: number; // Điểm phần trăm (0-100+)
  skills: Partial<Record<SkillType, ScoreDetail>>;
}

export interface FullAssessmentResult {
  childAgeMonths: number;
  totalRiskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  domains: {
    core: DomainResult;
    social: DomainResult;
    cognitive: DomainResult;
  };
  report: string; // Nội dung báo cáo text đầy đủ
}

// --- 2. TRỌNG SỐ (Theo Mục C & D) ---
const WEIGHTS = {
  DOMAINS: { CORE: 0.4, SOCIAL: 0.3, COGNITIVE: 0.3 },
  SKILLS: {
    // Core
    joint_attention: 0.3, social_imitation: 0.25, non_verbal: 0.25, response_to_name: 0.2,
    // Social
    emotion_recognition: 0.4, turn_taking: 0.3, pretend_play: 0.3,
    // Cognitive
    categorization: 0.3, memory: 0.3, problem_solving: 0.4
  }
};

// --- 3. CLASS DỊCH VỤ ---

export class ScoringService {

  /**
   * Tính điểm thô (Xử lý logic ngược cho thời gian)
   */
  private static calculateRawScore(observed: number, expected: number, isTimeBased: boolean = false): number {
    if (expected === 0 || observed === 0) return 0;
    
    if (isTimeBased) {
      // Thời gian: Kỳ vọng 3s, làm 5s -> (3/5)*100 = 60 (Kém)
      return (expected / observed) * 100;
    }
    // Thông thường: Kỳ vọng 5 lần, làm 3 lần -> (3/5)*100 = 60
    return (observed / expected) * 100;
  }

  /**
   * Phân loại Z-Score (Theo thang 5 mức)
   */
  private static classifyZScore(z: number) {
    if (z > 1.5) return { level: 'Vượt trội', color: '#3b82f6', description: 'Vượt mức kỳ vọng' };
    if (z >= 0.5) return { level: 'Trên trung bình', color: '#22c55e', description: 'Phát triển tốt' };
    if (z >= -0.5) return { level: 'Trung bình', color: '#eab308', description: 'Bình thường' };
    if (z >= -1.5) return { level: 'Dưới trung bình', color: '#f97316', description: 'Có dấu hiệu chậm' };
    return { level: 'Thiếu hụt đáng kể', color: '#ef4444', description: 'Chậm phát triển rõ rệt' };
  }

  /**
   * HÀM CHÍNH: Tính toán toàn bộ
   */
  static calculateAssessment(
    inputs: AssessmentInput[], 
    config: AgeGroupConfig,
    childAge: number
  ): FullAssessmentResult {
    
    const skillResults: Partial<Record<SkillType, ScoreDetail>> = {};

    // 1. Tính điểm từng kỹ năng nhỏ (Sub-skills)
    inputs.forEach(input => {
      const conf = config[input.skillId];
      if (!conf) return;

      const raw = this.calculateRawScore(input.observedValue, conf.expected, conf.isTimeBased);
      const zScore = (raw - conf.mean) / conf.std;

      skillResults[input.skillId] = {
        raw: raw,
        zScore: zScore,
        classification: this.classifyZScore(zScore)
      };
    });

    // Helper để lấy raw score (mặc định 0 nếu thiếu dữ liệu)
    const getS = (id: SkillType) => skillResults[id]?.raw || 0;

    // 2. Tính điểm theo Nhóm (Domains) - Áp dụng trọng số con
    const coreScore = 
      getS('joint_attention') * WEIGHTS.SKILLS.joint_attention +
      getS('social_imitation') * WEIGHTS.SKILLS.social_imitation +
      getS('non_verbal') * WEIGHTS.SKILLS.non_verbal +
      getS('response_to_name') * WEIGHTS.SKILLS.response_to_name;

    const socialScore = 
      getS('emotion_recognition') * WEIGHTS.SKILLS.emotion_recognition +
      getS('turn_taking') * WEIGHTS.SKILLS.turn_taking +
      getS('pretend_play') * WEIGHTS.SKILLS.pretend_play;

    const cognitiveScore = 
      getS('categorization') * WEIGHTS.SKILLS.categorization +
      getS('memory') * WEIGHTS.SKILLS.memory +
      getS('problem_solving') * WEIGHTS.SKILLS.problem_solving;

    // 3. Tính điểm Tổng hợp Nguy cơ (Total Risk Score) - Áp dụng trọng số lớn
    const totalScore = 
      (coreScore * WEIGHTS.DOMAINS.CORE) + 
      (socialScore * WEIGHTS.DOMAINS.SOCIAL) + 
      (cognitiveScore * WEIGHTS.DOMAINS.COGNITIVE);

    // 4. Xác định mức độ rủi ro (Theo % chuẩn)
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' = 'LOW';
    if (totalScore < 30) riskLevel = 'VERY_HIGH';
    else if (totalScore < 50) riskLevel = 'HIGH';
    else if (totalScore < 70) riskLevel = 'MEDIUM';

    // 5. Kết quả trả về
    const result: FullAssessmentResult = {
      childAgeMonths: childAge,
      totalRiskScore: Math.round(totalScore),
      riskLevel,
      domains: {
        core: { score: Math.round(coreScore), skills: this.filterSkills(skillResults, ['joint_attention', 'social_imitation', 'non_verbal', 'response_to_name']) },
        social: { score: Math.round(socialScore), skills: this.filterSkills(skillResults, ['emotion_recognition', 'turn_taking', 'pretend_play']) },
        cognitive: { score: Math.round(cognitiveScore), skills: this.filterSkills(skillResults, ['categorization', 'memory', 'problem_solving']) }
      },
      report: '' // Sẽ điền ở dưới
    };

    // Tạo báo cáo text
    result.report = this.generateReportText(result);

    return result;
  }

  // Helper lọc skills theo nhóm
  private static filterSkills(all: any, keys: string[]) {
    const subset: any = {};
    keys.forEach(k => { if(all[k]) subset[k] = all[k]; });
    return subset;
  }

  /**
   * Tạo báo cáo tự động (Mục F)
   */
  private static generateReportText(data: FullAssessmentResult): string {
    const renderSkill = (name: string, s: ScoreDetail | undefined) => {
      if (!s) return '';
      const icon = s.zScore < -1.5 ? '⚠️⚠️' : (s.zScore < -0.5 ? '⚠️' : '✅');
      return `   - ${name}: ${Math.round(s.raw)}% (${s.classification.level}) ${icon}`;
    };

    const recs = this.getRecommendations(data.riskLevel);

    return `
PHIẾU ĐÁNH GIÁ SÀNG LỌC PHÁT TRIỂN
-----------------------------------
Thông tin trẻ: ${data.childAgeMonths} tháng
Kết quả tổng hợp: ${data.totalRiskScore}% (Mức độ nguy cơ: ${this.translateRisk(data.riskLevel)})

KẾT QUẢ THEO NHÓM KỸ NĂNG:
1. KỸ NĂNG LÕI (CORE): ${data.domains.core.score}%
${renderSkill('Chú ý chia sẻ', data.domains.core.skills['joint_attention'])}
${renderSkill('Phản ứng với tên', data.domains.core.skills['response_to_name'])}
${renderSkill('Bắt chước', data.domains.core.skills['social_imitation'])}

2. KỸ NĂNG XÃ HỘI: ${data.domains.social.score}%
${renderSkill('Nhận diện cảm xúc', data.domains.social.skills['emotion_recognition'])}
${renderSkill('Luân phiên', data.domains.social.skills['turn_taking'])}

3. KỸ NĂNG NHẬN THỨC: ${data.domains.cognitive.score}%
${renderSkill('Giải quyết vấn đề', data.domains.cognitive.skills['problem_solving'])}

KHUYẾN NGHỊ:
${recs}

LƯU Ý: Đây là kết quả sàng lọc, không thay thế chẩn đoán chuyên khoa.
    `.trim();
  }

  private static translateRisk(l: string) {
    if (l === 'VERY_HIGH') return 'RẤT CAO';
    if (l === 'HIGH') return 'CAO';
    if (l === 'MEDIUM') return 'TRUNG BÌNH';
    return 'THẤP';
  }

  private static getRecommendations(level: string): string {
    if (level === 'VERY_HIGH') return "• KHẨN CẤP: Đánh giá chuyên khoa ngay.\n• Địa chỉ: Bệnh viện Nhi/Khoa Tâm bệnh.";
    if (level === 'HIGH') return "• ƯU TIÊN: Tham vấn chuyên gia tâm lý.\n• THỰC HÀNH: Tăng cường tương tác 1-1.";
    if (level === 'MEDIUM') return "• THEO DÕI: Đánh giá lại sau 1-3 tháng.\n• THỰC HÀNH: Chơi các trò chơi luân phiên.";
    return "• DUY TRÌ: Tiếp tục các hoạt động phát triển hiện tại.";
  }
}