// services/scoringService.ts
import { jStat } from 'jstat';

// ==================== 1. ĐỊNH NGHĨA KIỂU ====================
export type SkillType =
  | 'joint_attention'
  | 'social_imitation'
  | 'non_verbal'
  | 'response_to_name'
  | 'emotion_recognition'
  | 'turn_taking'
  | 'pretend_play'
  | 'categorization'
  | 'memory'
  | 'problem_solving'
  | 'imitation'
  | 'emotional_expression'
  | 'gaze_stability'
  | 'hand_eye_coordination'
  | 'auditory_response';

export interface AssessmentInput {
  skillId: SkillType;
  observedValue: number;
}

export interface SkillNormConfig {
  expected: number;
  isTimeBased?: boolean;
  mean: number;
  std: number;
}

export type AgeGroupConfig = Record<SkillType, SkillNormConfig>;

export interface ScoreDetail {
  raw: number;           // điểm thô (0-100+)
  zScore: number;        // điểm Z
  percentile: number;    // phần trăm (0-100)
  classification: {
    level: string;
    color: string;
    description: string;
  };
}

export interface DomainResult {
  score: number;         // điểm phần trăm (0-100+) – để hiển thị
  zScore: number;        // điểm Z trung bình có trọng số của domain – dùng tính toán
  skills: Partial<Record<SkillType, ScoreDetail>>;
}

export interface FullAssessmentResult {
  childAgeMonths: number;
  developmentalAgeMonths: number;
  totalRiskScore: number;      // ✅ Z-score tổng hợp (làm tròn 2 chữ số)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  domains: {
    core: DomainResult;
    social: DomainResult;
    cognitive: DomainResult;
  };
  report: string;
}

// ==================== 2. TRỌNG SỐ (giữ nguyên) ====================
const WEIGHTS = {
  DOMAINS: { CORE: 0.4, SOCIAL: 0.3, COGNITIVE: 0.3 },
  SKILLS: {
    joint_attention: 0.3,
    social_imitation: 0.25,
    non_verbal: 0.25,
    response_to_name: 0.2,
    emotion_recognition: 0.4,
    turn_taking: 0.3,
    pretend_play: 0.3,
    categorization: 0.3,
    memory: 0.3,
    problem_solving: 0.4,
    imitation: 0.2,
    emotional_expression: 0.2,
    gaze_stability: 0.15,
    hand_eye_coordination: 0.15,
    auditory_response: 0.2,
  },
};

// ==================== 3. CẤU HÌNH CHUẨN (NORMS) ====================
export const DEFAULT_NORMS: AgeGroupConfig = {
  // Core skills
  joint_attention: { expected: 5, mean: 60, std: 20, isTimeBased: false },
  social_imitation: { expected: 4, mean: 55, std: 18, isTimeBased: false },
  non_verbal: { expected: 70, mean: 65, std: 15, isTimeBased: false },
  response_to_name: { expected: 3, mean: 70, std: 25, isTimeBased: true },
  // Social skills
  emotion_recognition: { expected: 60, mean: 55, std: 20, isTimeBased: false },
  turn_taking: { expected: 4, mean: 50, std: 15, isTimeBased: false },
  pretend_play: { expected: 3, mean: 40, std: 20, isTimeBased: false },
  // Cognitive skills
  categorization: { expected: 5, mean: 50, std: 20, isTimeBased: false },
  memory: { expected: 4, mean: 45, std: 18, isTimeBased: false },
  problem_solving: { expected: 4, mean: 40, std: 15, isTimeBased: false },
  // Extended skills
  imitation: { expected: 4, mean: 50, std: 20, isTimeBased: false },
  emotional_expression: { expected: 60, mean: 55, std: 18, isTimeBased: false },
  gaze_stability: { expected: 70, mean: 65, std: 15, isTimeBased: false },
  hand_eye_coordination: { expected: 60, mean: 55, std: 20, isTimeBased: false },
  auditory_response: { expected: 70, mean: 65, std: 18, isTimeBased: false },
};

// ==================== 4. DỊCH VỤ TÍNH ĐIỂM ====================
export class ScoringService {
  /**
   * Tính điểm thô (0-100), xử lý ngược cho chỉ số thời gian
   */
  private static calculateRawScore(
    observed: number,
    expected: number,
    isTimeBased: boolean = false
  ): number {
    if (expected <= 0 || observed <= 0) return 0;
    if (isTimeBased) {
      return (expected / observed) * 100;
    }
    return (observed / expected) * 100;
  }

  /**
   * Chuyển đổi điểm Z -> percentile dùng phân phối chuẩn tích lũy
   */
  private static zToPercentile(z: number): number {
    return Number((jStat.normal.cdf(z, 0, 1) * 100).toFixed(1));
  }

  /**
   * Phân loại mức độ dựa trên Z-Score cho từng kỹ năng (5 mức)
   */
  private static classifyZScore(z: number) {
    if (z > 1.5) return { level: 'Vượt trội', color: '#3b82f6', description: 'Vượt mức kỳ vọng' };
    if (z >= 0.5) return { level: 'Trên trung bình', color: '#22c55e', description: 'Phát triển tốt' };
    if (z >= -0.5) return { level: 'Trung bình', color: '#eab308', description: 'Bình thường' };
    if (z >= -1.5) return { level: 'Dưới trung bình', color: '#f97316', description: 'Có dấu hiệu chậm' };
    return { level: 'Thiếu hụt đáng kể', color: '#ef4444', description: 'Chậm phát triển rõ rệt' };
  }

  /**
   * Phân loại mức độ nguy cơ dựa trên Z-score tổng hợp (theo spec)
   */
  private static classifyRiskLevel(totalZ: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    if (totalZ < -2.0) return 'VERY_HIGH';
    if (totalZ < -1.0) return 'HIGH';
    if (totalZ < -0.5) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Ước tính tuổi phát triển dựa trên Z-score trung bình của các kỹ năng cốt lõi
   */
  private static estimateDevelopmentalAge(
    childAgeMonths: number,
    skillResults: Partial<Record<SkillType, ScoreDetail>>
  ): number {
    const coreSkills: SkillType[] = [
      'joint_attention',
      'social_imitation',
      'non_verbal',
      'response_to_name',
    ];
    let sumZ = 0;
    let count = 0;
    coreSkills.forEach((skill) => {
      const res = skillResults[skill];
      if (res) {
        sumZ += res.zScore;
        count++;
      }
    });
    const avgZ = count > 0 ? sumZ / count : 0;
    const ageOffset = avgZ * 3; // 1 Z ≈ 3 tháng
    return Math.max(0, Math.round(childAgeMonths + ageOffset));
  }

  /**
   * HÀM CHÍNH: Tính toán toàn bộ kết quả đánh giá
   * @param inputs – dữ liệu đầu vào từ game
   * @param config – cấu hình chuẩn (mean/std) theo độ tuổi
   * @param childAge – tuổi thực của trẻ (tháng)
   */
  static calculateAssessment(
    inputs: AssessmentInput[],
    config: AgeGroupConfig,
    childAge: number
  ): FullAssessmentResult {
    const skillResults: Partial<Record<SkillType, ScoreDetail>> = {};

    // 1. Tính điểm cho từng kỹ năng
    inputs.forEach((input) => {
      const conf = config[input.skillId];
      if (!conf) return;

      const raw = this.calculateRawScore(
        input.observedValue,
        conf.expected,
        conf.isTimeBased
      );
      const zScore = (raw - conf.mean) / conf.std;
      const percentile = this.zToPercentile(zScore);

      skillResults[input.skillId] = {
        raw,
        zScore,
        percentile,
        classification: this.classifyZScore(zScore),
      };
    });

    // Helper: lấy Z-score của skill, mặc định 0 nếu không có
    const getZ = (id: SkillType) => skillResults[id]?.zScore ?? 0;
    // Helper: lấy raw score, mặc định 0
    const getRaw = (id: SkillType) => skillResults[id]?.raw ?? 0;

    // 2. Tính điểm % và Z-score cho từng domain (có trọng số)
    // --- Core domain ---
    const coreRawScore =
      getRaw('joint_attention') * WEIGHTS.SKILLS.joint_attention +
      getRaw('social_imitation') * WEIGHTS.SKILLS.social_imitation +
      getRaw('non_verbal') * WEIGHTS.SKILLS.non_verbal +
      getRaw('response_to_name') * WEIGHTS.SKILLS.response_to_name;

    const coreZScore =
      getZ('joint_attention') * WEIGHTS.SKILLS.joint_attention +
      getZ('social_imitation') * WEIGHTS.SKILLS.social_imitation +
      getZ('non_verbal') * WEIGHTS.SKILLS.non_verbal +
      getZ('response_to_name') * WEIGHTS.SKILLS.response_to_name;

    // --- Social domain ---
    const socialRawScore =
      getRaw('emotion_recognition') * WEIGHTS.SKILLS.emotion_recognition +
      getRaw('turn_taking') * WEIGHTS.SKILLS.turn_taking +
      getRaw('pretend_play') * WEIGHTS.SKILLS.pretend_play;

    const socialZScore =
      getZ('emotion_recognition') * WEIGHTS.SKILLS.emotion_recognition +
      getZ('turn_taking') * WEIGHTS.SKILLS.turn_taking +
      getZ('pretend_play') * WEIGHTS.SKILLS.pretend_play;

    // --- Cognitive domain ---
    const cognitiveRawScore =
      getRaw('categorization') * WEIGHTS.SKILLS.categorization +
      getRaw('memory') * WEIGHTS.SKILLS.memory +
      getRaw('problem_solving') * WEIGHTS.SKILLS.problem_solving;

    const cognitiveZScore =
      getZ('categorization') * WEIGHTS.SKILLS.categorization +
      getZ('memory') * WEIGHTS.SKILLS.memory +
      getZ('problem_solving') * WEIGHTS.SKILLS.problem_solving;

    // 3. Tính Z-score tổng hợp (theo trọng số domain)
    const totalZScore =
      coreZScore * WEIGHTS.DOMAINS.CORE +
      socialZScore * WEIGHTS.DOMAINS.SOCIAL +
      cognitiveZScore * WEIGHTS.DOMAINS.COGNITIVE;

    // 4. Xác định mức độ rủi ro dựa trên Z-score tổng hợp
    const riskLevel = this.classifyRiskLevel(totalZScore);

    // 5. Tuổi phát triển
    const developmentalAgeMonths = this.estimateDevelopmentalAge(childAge, skillResults);

    // 6. Xây dựng kết quả
    const result: FullAssessmentResult = {
      childAgeMonths: childAge,
      developmentalAgeMonths,
      totalRiskScore: Number(totalZScore.toFixed(2)), // ✅ Z-score, làm tròn 2 chữ số
      riskLevel,
      domains: {
        core: {
          score: Math.round(coreRawScore),
          zScore: Number(coreZScore.toFixed(2)),
          skills: this.filterSkills(skillResults, [
            'joint_attention',
            'social_imitation',
            'non_verbal',
            'response_to_name',
          ]),
        },
        social: {
          score: Math.round(socialRawScore),
          zScore: Number(socialZScore.toFixed(2)),
          skills: this.filterSkills(skillResults, [
            'emotion_recognition',
            'turn_taking',
            'pretend_play',
          ]),
        },
        cognitive: {
          score: Math.round(cognitiveRawScore),
          zScore: Number(cognitiveZScore.toFixed(2)),
          skills: this.filterSkills(skillResults, [
            'categorization',
            'memory',
            'problem_solving',
          ]),
        },
      },
      report: '',
    };

    result.report = this.generateReportText(result);
    return result;
  }

  // ---------- Hàm phụ trợ ----------
  private static filterSkills(
    all: Partial<Record<SkillType, ScoreDetail>>,
    keys: SkillType[]
  ): Partial<Record<SkillType, ScoreDetail>> {
    const subset: Partial<Record<SkillType, ScoreDetail>> = {};
    keys.forEach((k) => {
      if (all[k]) subset[k] = all[k];
    });
    return subset;
  }

  // ---------- Tạo báo cáo tự động (cập nhật để hiển thị Z-score) ----------
  private static generateReportText(data: FullAssessmentResult): string {
    const renderSkill = (name: string, s: ScoreDetail | undefined) => {
      if (!s) return '';
      const icon = s.zScore < -1.5 ? '⚠️⚠️' : s.zScore < -0.5 ? '⚠️' : '✅';
      return `   - ${name}: ${Math.round(s.raw)}% (Z: ${s.zScore.toFixed(2)}, perc: ${s.percentile}%) ${icon}`;
    };

    const recs = this.getRecommendations(data.riskLevel);

    return `
PHIẾU ĐÁNH GIÁ SÀNG LỌC PHÁT TRIỂN
────────────────────────────────────
Thông tin trẻ: ${data.childAgeMonths} tháng
Tuổi phát triển ước tính: ${data.developmentalAgeMonths} tháng
Kết quả tổng hợp: Z = ${data.totalRiskScore} (Mức độ nguy cơ: ${this.translateRisk(data.riskLevel)})

KẾT QUẢ THEO NHÓM KỸ NĂNG:
1. KỸ NĂNG LÕI (CORE): ${data.domains.core.score}% (Z: ${data.domains.core.zScore})
${renderSkill('Chú ý chia sẻ', data.domains.core.skills['joint_attention'])}
${renderSkill('Phản ứng với tên', data.domains.core.skills['response_to_name'])}
${renderSkill('Bắt chước', data.domains.core.skills['social_imitation'])}

2. KỸ NĂNG XÃ HỘI: ${data.domains.social.score}% (Z: ${data.domains.social.zScore})
${renderSkill('Nhận diện cảm xúc', data.domains.social.skills['emotion_recognition'])}
${renderSkill('Luân phiên', data.domains.social.skills['turn_taking'])}

3. KỸ NĂNG NHẬN THỨC: ${data.domains.cognitive.score}% (Z: ${data.domains.cognitive.zScore})
${renderSkill('Giải quyết vấn đề', data.domains.cognitive.skills['problem_solving'])}

KHUYẾN NGHỊ:
${recs}

LƯU Ý: Đây là kết quả sàng lọc, không thay thế chẩn đoán chuyên khoa.
    `.trim();
  }

  private static translateRisk(level: string): string {
    if (level === 'VERY_HIGH') return 'RẤT CAO';
    if (level === 'HIGH') return 'CAO';
    if (level === 'MEDIUM') return 'TRUNG BÌNH';
    return 'THẤP';
  }

  private static getRecommendations(level: string): string {
    switch (level) {
      case 'VERY_HIGH':
        return '• KHẨN CẤP: Đánh giá chuyên khoa ngay.\n• Địa chỉ: Bệnh viện Nhi/Khoa Tâm bệnh.';
      case 'HIGH':
        return '• ƯU TIÊN: Tham vấn chuyên gia tâm lý.\n• THỰC HÀNH: Tăng cường tương tác 1-1.';
      case 'MEDIUM':
        return '• THEO DÕI: Đánh giá lại sau 1-3 tháng.\n• THỰC HÀNH: Chơi các trò chơi luân phiên.';
      default:
        return '• DUY TRÌ: Tiếp tục các hoạt động phát triển hiện tại.';
    }
  }
}