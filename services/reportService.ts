import {
  FullAssessmentResult,
  ScoreDetail,
  SkillType,
} from './scoringService';
import {
  ClinicalReport,
  ReportDomainAnalysis,
  Emotion,
} from '../types';

// -------------------------------------------------------------
// 1. INTERFACE CHO DỮ LIỆU DASHBOARD
// -------------------------------------------------------------
export interface DashboardData {
  // Biểu đồ tròn: phân bố mức độ kỹ năng theo nhóm
  domainPie: {
    labels: string[];
    values: number[];
    colors: string[];
  };
  // Biểu đồ thanh: điểm từng kỹ năng
  skillBars: {
    skillName: string;
    rawScore: number;
    percentile: number;
    status: 'GREEN' | 'ORANGE' | 'RED';
  }[];
  // Tổng quan
  summary: {
    riskLevel: string;
    totalScore: number;
    developmentalAge: number;
    chronologicalAge: number;
  };
}

// -------------------------------------------------------------
// 2. THÔNG TIN TRẺ CHO BÁO CÁO
// -------------------------------------------------------------
export interface ChildProfileInfo {
  name: string;
  assessmentDate: string;
  completedGames: number;
  totalGames: number;
  gender?: 'male' | 'female' | 'other';
  birthDate?: string;
}

// -------------------------------------------------------------
// 3. DỊCH VỤ BÁO CÁO CHÍNH
// -------------------------------------------------------------
export class ReportService {
  // ==================== BÁO CÁO JSON (THEO SPEC) ====================
  static generateJSONReport(
    info: ChildProfileInfo,
    result: FullAssessmentResult
  ): ClinicalReport {
    const childAgeMonths = result.childAgeMonths;
    const genderMap = {
      male: 'Nam',
      female: 'Nữ',
      other: 'Khác',
    };

    // 1. Domain analysis – chuyển đổi từ kết quả scoring
    const domainAnalysis: ReportDomainAnalysis[] = [
      this.buildDomainAnalysis(
        'Kỹ năng lõi (Core)',
        result.domains.core,
        ['joint_attention', 'social_imitation', 'non_verbal', 'response_to_name']
      ),
      this.buildDomainAnalysis(
        'Kỹ năng xã hội (Social)',
        result.domains.social,
        ['emotion_recognition', 'turn_taking', 'pretend_play']
      ),
      this.buildDomainAnalysis(
        'Kỹ năng nhận thức (Cognitive)',
        result.domains.cognitive,
        ['categorization', 'memory', 'problem_solving']
      ),
    ];

    // 2. Xác định điểm mạnh / điểm yếu
    const { strengths, concerns } = this.extractStrengthsAndConcerns(result);

    // 3. Tính độ chênh lệch phát triển
    const developmentalDiscrepancy = `${result.developmentalAgeMonths - result.childAgeMonths} tháng (${result.developmentalAgeMonths > result.childAgeMonths ? 'vượt' : 'chậm'} ${Math.abs(result.developmentalAgeMonths - result.childAgeMonths)} tháng)`;

    // 4. Behavioral patterns – từ kết quả phân tích
    const behavioralPatterns = this.inferBehavioralPatterns(result);

    // 5. Recommendations chi tiết – dựa trên điểm yếu cụ thể
    const recommendations = this.generateDetailedRecommendations(result, concerns);

    // 6. Tạo báo cáo hoàn chỉnh
    const report: ClinicalReport = {
      report_id: `RPT-${Date.now()}-${info.name.replace(/\s/g, '')}`,
      child_info: {
        name: info.name,
        age_months: childAgeMonths,
        assessment_date: info.assessmentDate,
        gender: info.gender ? genderMap[info.gender] : undefined,
      },
      executive_summary: {
        overall_risk: this.translateRiskLevel(result.riskLevel),
        key_strengths: strengths,
        key_concerns: concerns,
        developmental_discrepancy: developmentalDiscrepancy,
      },
      domain_analysis: domainAnalysis,
      behavioral_patterns: behavioralPatterns,
      recommendations: recommendations,
      disclaimer:
        'Đây là kết quả sàng lọc sử dụng công cụ M‑CHAT‑R/F kết hợp phân tích hành vi bằng AI, không thay thế chẩn đoán chuyên khoa. Vui lòng tham khảo ý kiến bác sĩ hoặc chuyên gia tâm lý để có đánh giá chính thức.',
    };

    return report;
  }

  // ==================== DỮ LIỆU DASHBOARD (BIỂU ĐỒ) ====================
  static getDashboardData(
    result: FullAssessmentResult
  ): DashboardData {
    // 1. Biểu đồ tròn – phân bố điểm các nhóm kỹ năng
    const domainPie = {
      labels: ['Kỹ năng lõi', 'Kỹ năng xã hội', 'Kỹ năng nhận thức'],
      values: [
        result.domains.core.score,
        result.domains.social.score,
        result.domains.cognitive.score,
      ],
      colors: ['#3b82f6', '#22c55e', '#eab308'],
    };

    // 2. Biểu đồ thanh – chi tiết từng kỹ năng
    const allSkills = {
      ...result.domains.core.skills,
      ...result.domains.social.skills,
      ...result.domains.cognitive.skills,
    };

    const skillBars = Object.entries(allSkills)
      .map(([key, detail]) => {
        if (!detail) return null;
        let status: 'GREEN' | 'ORANGE' | 'RED' = 'GREEN';
        if (detail.percentile < 15) status = 'RED';
        else if (detail.percentile < 30) status = 'ORANGE';
        return {
          skillName: this.translateSkillName(key as SkillType),
          rawScore: Math.round(detail.raw),
          percentile: detail.percentile,
          status,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.percentile - b.percentile);

    // 3. Tổng quan
    const summary = {
      riskLevel: this.translateRiskLevel(result.riskLevel),
      totalScore: result.totalRiskScore,
      developmentalAge: result.developmentalAgeMonths,
      chronologicalAge: result.childAgeMonths,
    };

    return { domainPie, skillBars, summary };
  }

  // ==================== BÁO CÁO VĂN BẢN (GIỮ NGUYÊN VÀ NÂNG CẤP) ====================
  static generateTextReport(
    info: ChildProfileInfo,
    result: FullAssessmentResult
  ): string {
    let text = `PHIẾU ĐÁNH GIÁ SÀNG LỌC PHÁT TRIỂN\n`;
    text += `────────────────────────────────────\n`;
    text += `Thông tin trẻ: ${info.name}, ${result.childAgeMonths} tháng\n`;
    text += `Ngày đánh giá: ${info.assessmentDate}\n`;
    text += `Hoàn thành: ${info.completedGames}/${info.totalGames} game\n\n`;

    text += `KẾT QUẢ TỔNG QUAN:\n`;
    text += `• Mức độ nguy cơ: ${this.translateRiskLevel(result.riskLevel)}\n`;
    text += `• Điểm tổng hợp: ${result.totalRiskScore}% so với chuẩn tuổi\n`;
    text += `• Tuổi phát triển ước tính: ${result.developmentalAgeMonths} tháng (chênh lệch ${result.developmentalAgeMonths - result.childAgeMonths > 0 ? '+' : ''}${result.developmentalAgeMonths - result.childAgeMonths} tháng)\n\n`;

    text += `KẾT QUẢ THEO NHÓM KỸ NĂNG:\n`;
    text += this.formatDomainBlock('1. KỸ NĂNG LÕI', result.domains.core);
    text += this.formatDomainBlock('2. KỸ NĂNG XÃ HỘI', result.domains.social);
    text += this.formatDomainBlock('3. KỸ NĂNG NHẬN THỨC', result.domains.cognitive);

    text += `\nCHỈ SỐ NỔI BẬT CẦN QUAN TÂM:\n`;
    text += this.extractNotableIndicators(result);

    text += `\nKHUYẾN NGHỊ CAN THIỆP:\n`;
    const recommendations = this.generateDetailedRecommendationsText(result);
    text += recommendations;

    text += `\n\nLƯU Ý: Đây là kết quả sàng lọc, không thay thế chẩn đoán chuyên khoa.`;
    return text;
  }

  // ==================== CÁC HÀM HỖ TRỢ ====================

  private static buildDomainAnalysis(
    domainName: string,
    domain: { score: number; skills: Partial<Record<SkillType, ScoreDetail>> },
    skillKeys: SkillType[]
  ): ReportDomainAnalysis {
    const indicators = skillKeys
      .map((skill) => {
        const detail = domain.skills[skill];
        if (!detail) return null;
        let status: 'RED' | 'ORANGE' | 'GREEN' = 'GREEN';
        if (detail.percentile < 15) status = 'RED';
        else if (detail.percentile < 30) status = 'ORANGE';

        return {
          skill: this.translateSkillName(skill),
          status,
          details: `${Math.round(detail.raw)}% (perc: ${detail.percentile}%)`,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const ageEquivalent = this.estimateAgeEquivalent(domain.score);

    return {
      domain: domainName,
      score: Math.round(domain.score),
      percentile: this.calculateDomainPercentile(domain.score),
      age_equivalent: ageEquivalent,
      indicators,
    };
  }

  private static estimateAgeEquivalent(score: number): string {
    if (score >= 90) return '> 36 tháng';
    if (score >= 70) return '30-36 tháng';
    if (score >= 50) return '24-30 tháng';
    if (score >= 30) return '18-24 tháng';
    return '< 18 tháng';
  }

  private static calculateDomainPercentile(score: number): number {
    const z = (score - 50) / 20;
    const p = this.normalCdf(z);
    return Math.round(p * 100);
  }

  private static normalCdf(z: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp((-z * z) / 2);
    let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (z > 0) p = 1 - p;
    return p;
  }

  private static extractStrengthsAndConcerns(
    result: FullAssessmentResult
  ): { strengths: string[]; concerns: string[] } {
    const allSkills = {
      ...result.domains.core.skills,
      ...result.domains.social.skills,
      ...result.domains.cognitive.skills,
    };

    const strengths: string[] = [];
    const concerns: string[] = [];

    Object.entries(allSkills).forEach(([key, detail]) => {
      if (!detail) return;
      const name = this.translateSkillName(key as SkillType);
      if (detail.percentile >= 70) {
        strengths.push(`${name} (tốt: ${detail.percentile}%)`);
      } else if (detail.percentile < 15) {
        concerns.push(`${name} (cần hỗ trợ: ${Math.round(detail.raw)}%)`);
      }
    });

    if (strengths.length === 0) strengths.push('Chưa ghi nhận điểm mạnh nổi bật');
    if (concerns.length === 0) concerns.push('Không phát hiện khó khăn rõ rệt');

    return { strengths, concerns };
  }

  private static inferBehavioralPatterns(result: FullAssessmentResult): {
    attention_pattern: string;
    social_engagement: string;
    sensory_profile: string;
    gaze_stability_note?: string;
  } {
    const gazeSkill = result.domains.core.skills['gaze_stability'];
    const gazeNote = gazeSkill
      ? `Độ ổn định ánh mắt: ${Math.round(gazeSkill.raw)}% (${gazeSkill.classification.level})`
      : undefined;

    let attention = '';
    let social = '';
    let sensory = '';

    if (result.riskLevel === 'VERY_HIGH' || result.riskLevel === 'HIGH') {
      attention = 'Giảm chú ý kéo dài, khó duy trì tập trung';
      social = 'Hạn chế tương tác xã hội, ít chủ động giao tiếp';
      sensory = 'Có dấu hiệu nhạy cảm hoặc phản ứng bất thường với kích thích';
    } else if (result.riskLevel === 'MEDIUM') {
      attention = 'Có lúc mất tập trung, nhưng có thể điều chỉnh được';
      social = 'Tương tác xã hội còn rụt rè, cần hỗ trợ';
      sensory = 'Phản ứng cảm giác trong giới hạn bình thường';
    } else {
      attention = 'Khả năng tập trung phù hợp lứa tuổi';
      social = 'Tương tác xã hội tích cực';
      sensory = 'Không ghi nhận bất thường về cảm giác';
    }

    return {
      attention_pattern: attention,
      social_engagement: social,
      sensory_profile: sensory,
      gaze_stability_note: gazeNote,
    };
  }

  private static generateDetailedRecommendations(
    result: FullAssessmentResult,
    concerns: string[]
  ): {
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    actions: string[];
    resources: Array<{ type: string; name: string; contact?: string }>;
  } {
    let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (result.riskLevel === 'VERY_HIGH' || result.riskLevel === 'HIGH') priority = 'HIGH';
    else if (result.riskLevel === 'MEDIUM') priority = 'MEDIUM';

    const actions: string[] = [];
    const resources: Array<{ type: string; name: string; contact?: string }> = [];

    if (priority === 'HIGH') {
      actions.push('Đưa trẻ đi khám chuyên khoa tâm lý / thần kinh nhi ngay lập tức');
      actions.push('Can thiệp sớm với chương trình cá nhân hóa');
      resources.push({
        type: 'hospital',
        name: 'Bệnh viện Nhi Trung ương - Khoa Tâm bệnh',
        contact: '024.6273.8542',
      });
    } else if (priority === 'MEDIUM') {
      actions.push('Tham vấn chuyên gia tâm lý giáo dục');
      actions.push('Tăng cường các hoạt động tương tác xã hội tại nhà');
    } else {
      actions.push('Tiếp tục theo dõi và khuyến khích phát triển kỹ năng');
    }

    const weakSkills = this.getWeakSkills(result);
    weakSkills.forEach(({ skill, name }) => {
      const rec = this.getInterventionForSkill(skill);
      if (rec) actions.push(rec);
    });

    const uniqueActions = [...new Set(actions)];

    return {
      priority,
      actions: uniqueActions,
      resources,
    };
  }

  public static generateDetailedRecommendationsText(
    result: FullAssessmentResult
  ): string {
    const weakSkills = this.getWeakSkills(result);
    let text = '';

    if (result.riskLevel === 'VERY_HIGH') {
      text += '   🔴 MỨC ĐỘ NGUY CƠ RẤT CAO – CẦN CAN THIỆP KHẨN CẤP\n';
      text += '   • Đưa trẻ đến cơ sở y tế chuyên khoa để được đánh giá toàn diện.\n';
    } else if (result.riskLevel === 'HIGH') {
      text += '   🟠 MỨC ĐỘ NGUY CƠ CAO – CẦN CAN THIỆP SỚM\n';
      text += '   • Tham vấn chuyên gia tâm lý và xây dựng kế hoạch can thiệp cá nhân.\n';
    }

    if (weakSkills.length > 0) {
      text += '   🎯 CÁC KỸ NĂNG CẦN HỖ TRỢ:\n';
      weakSkills.forEach(({ name }) => {
        const rec = this.getInterventionForSkillShort(name);
        text += `      - ${name}: ${rec}\n`;
      });
    } else {
      text += '   ✅ KHÔNG PHÁT HIỆN KỸ NĂNG YẾU ĐẶC THÙ\n';
    }

    text += '\n   📌 HOẠT ĐỘNG GỢI Ý:\n';
    if (result.riskLevel === 'LOW') {
      text += '      • Duy trì các trò chơi vận động và tương tác hàng ngày.\n';
    } else {
      text += '      • Chơi trò chơi luân phiên (ú òa, chi chi chành chành).\n';
      text += '      • Đọc sách tranh và gọi tên nhân vật, đồ vật.\n';
    }

    return text;
  }

  private static getWeakSkills(
    result: FullAssessmentResult
  ): { skill: SkillType; name: string }[] {
    const allSkills = {
      ...result.domains.core.skills,
      ...result.domains.social.skills,
      ...result.domains.cognitive.skills,
    };

    const weak: { skill: SkillType; name: string }[] = [];
    Object.entries(allSkills).forEach(([key, detail]) => {
      if (detail && detail.percentile < 15) {
        weak.push({
          skill: key as SkillType,
          name: this.translateSkillName(key as SkillType),
        });
      }
    });

    return weak;
  }

  private static getInterventionForSkill(skill: SkillType): string | null {
    const map: Partial<Record<SkillType, string>> = {
      joint_attention: 'Chỉ tay và gọi tên đồ vật, chơi trò "nhìn theo tay chỉ".',
      social_imitation: 'Làm mẫu các động tác đơn giản và khuyến khích trẻ bắt chước.',
      non_verbal: 'Giao tiếp mắt khi nói chuyện, dùng nét mặt và cử chỉ.',
      response_to_name: 'Gọi tên trẻ ở khoảng cách gần, kết hợp phần thưởng xã hội.',
      emotion_recognition: 'Dùng thẻ cảm xúc, hỏi "Bạn ấy đang vui hay buồn?".',
      turn_taking: 'Chơi các trò chơi có lượt (xếp tháp, lăn bóng).',
      pretend_play: 'Cho trẻ búp bê, đồ chơi nấu ăn và hướng dẫn giả vờ.',
      gaze_stability: 'Bài tập nhìn theo đồ vật chuyển động chậm.',
      hand_eye_coordination: 'Xâu hạt, xếp khối, vẽ nguệch ngoạc.',
      auditory_response: 'Phát âm thanh nhẹ và quan sát phản ứng, trò chuyện với trẻ.',
    };
    return map[skill] || null;
  }

  private static getInterventionForSkillShort(skillName: string): string {
    const map: Record<string, string> = {
      'Chú ý chia sẻ': 'Tập chỉ tay và nhìn theo',
      'Bắt chước': 'Làm mẫu và khuyến khích trẻ làm theo',
      'Giao tiếp không lời': 'Tăng giao tiếp mắt, dùng cử chỉ',
      'Phản ứng với tên': 'Gọi tên thường xuyên, khen khi trẻ đáp ứng',
      'Nhận diện cảm xúc': 'Sử dụng tranh ảnh và biểu cảm khuôn mặt',
      'Luân phiên': 'Chơi các trò chơi đến lượt',
      'Chơi giả vờ': 'Cho trẻ chơi đồ hàng, búp bê',
      'Độ ổn định ánh mắt': 'Bài tập nhìn theo vật chuyển động',
      'Phối hợp tay-mắt': 'Xếp hình, xâu hạt',
      'Phản ứng âm thanh': 'Gọi tên, phát nhạc nhẹ',
    };
    return map[skillName] || 'Tăng cường tương tác và khen thưởng';
  }

  private static formatDomainBlock(
    title: string,
    domain: { score: number; skills: Partial<Record<SkillType, ScoreDetail>> }
  ): string {
    let block = `${title}: ${Math.round(domain.score)}% (${this.getDomainStatus(domain.score)})\n`;
    Object.entries(domain.skills).forEach(([key, detail]) => {
      if (!detail) return;
      const name = this.translateSkillName(key as SkillType);
      const icon = detail.percentile < 15 ? '⚠️' : detail.percentile >= 50 ? '✅' : '';
      block += `   - ${name}: ${Math.round(detail.raw)}% (perc: ${detail.percentile}%) ${icon}\n`;
    });
    return block;
  }

  private static translateSkillName(skillId: SkillType): string {
    const map: Record<SkillType, string> = {
      joint_attention: 'Chú ý chia sẻ',
      social_imitation: 'Bắt chước',
      non_verbal: 'Giao tiếp không lời',
      response_to_name: 'Phản ứng với tên',
      emotion_recognition: 'Nhận diện cảm xúc',
      turn_taking: 'Luân phiên',
      pretend_play: 'Chơi giả vờ',
      categorization: 'Phân loại',
      memory: 'Trí nhớ',
      problem_solving: 'Giải quyết vấn đề',
      imitation: 'Bắt chước (mở rộng)',
      emotional_expression: 'Biểu lộ cảm xúc',
      gaze_stability: 'Độ ổn định ánh mắt',
      hand_eye_coordination: 'Phối hợp tay-mắt',
      auditory_response: 'Phản ứng âm thanh',
    };
    return map[skillId] || skillId;
  }

  private static getDomainStatus(score: number): string {
    if (score >= 80) return 'TỐT';
    if (score >= 50) return 'ỔN';
    return 'CẦN THEO DÕI';
  }

  private static translateRiskLevel(level: string): string {
    const map: Record<string, string> = {
      VERY_HIGH: 'RẤT CAO',
      HIGH: 'CAO',
      MEDIUM: 'TRUNG BÌNH',
      LOW: 'THẤP',
    };
    return map[level] || level;
  }

  private static extractNotableIndicators(result: FullAssessmentResult): string {
    const weakSkills = this.getWeakSkills(result);
    if (weakSkills.length === 0) {
      return '   • Chưa ghi nhận dấu hiệu bất thường rõ rệt.\n';
    }

    let notes = '';
    weakSkills.slice(0, 3).forEach(({ skill, name }) => {
      const detail = this.findSkillDetail(result, skill);
      const score = detail ? Math.round(detail.raw) : 0;
      if (skill === 'response_to_name') {
        notes += `   • Phản ứng chậm hoặc không phản ứng khi được gọi tên (Điểm: ${score}%)\n`;
      } else if (skill === 'joint_attention') {
        notes += `   • Hạn chế chia sẻ sự chú ý, ít chỉ trỏ (Điểm: ${score}%)\n`;
      } else if (skill === 'non_verbal') {
        notes += `   • Hạn chế giao tiếp mắt (Điểm: ${score}%)\n`;
      } else {
        notes += `   • ${name} còn hạn chế so với tuổi (Điểm: ${score}%)\n`;
      }
    });
    return notes;
  }

  private static findSkillDetail(
    result: FullAssessmentResult,
    skill: SkillType
  ): ScoreDetail | undefined {
    return (
      result.domains.core.skills[skill] ||
      result.domains.social.skills[skill] ||
      result.domains.cognitive.skills[skill]
    );
  }
}