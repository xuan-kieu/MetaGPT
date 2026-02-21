// src/services/dataMapper.ts
import { BehavioralFeature, Emotion } from '../types';
import { AssessmentInput, SkillType } from './scoringService';

// Định nghĩa local các kiểu cần thiết thay vì import từ dbService (do dbService chưa export)
type UUID = string;

interface MetricInput {
  game_session_id: UUID;
  metric_key: string;
  metric_value: number | null;
  unit: string | null;
}

export class DataMapper {
  
  static mapSessionToInputs(features: BehavioralFeature[]): AssessmentInput[] {
    const inputs: AssessmentInput[] = [];
    const featuresByGame = this.groupByGame(features);

    for (const [gameId, gameFeatures] of Object.entries(featuresByGame)) {
      
      // ---------- Các kỹ năng chuẩn (đã có trong SkillType) ----------
      inputs.push({
        skillId: 'response_to_name',
        observedValue: this.calculateResponseTime(gameFeatures)
      });
      inputs.push({
        skillId: 'joint_attention',
        observedValue: this.countJointAttentionShifts(gameFeatures)
      });
      inputs.push({
        skillId: 'non_verbal',
        observedValue: this.calculateEyeContactPercentage(gameFeatures)
      });
      inputs.push({
        skillId: 'emotion_recognition',
        observedValue: this.calculateEmotionRecognitionScore(gameFeatures)
      });

      // ---------- Kỹ năng mới – cần được bổ sung vào định nghĩa SkillType ----------
      // 👇 Ép kiểu tạm thời để code chạy. Về lâu dài, hãy thêm các literal này vào union SkillType trong scoringService.ts
      inputs.push({
        skillId: 'imitation' as SkillType,
        observedValue: this.calculateImitationScore(gameFeatures)
      });
      inputs.push({
        skillId: 'emotional_expression' as SkillType,
        observedValue: this.calculateEmotionalExpressionScore(gameFeatures)
      });
      inputs.push({
        skillId: 'pretend_play' as SkillType,
        observedValue: this.calculatePretendPlayScore(gameFeatures)
      });
      inputs.push({
        skillId: 'gaze_stability' as SkillType,
        observedValue: this.calculateGazeStability(gameFeatures)
      });
      inputs.push({
        skillId: 'hand_eye_coordination' as SkillType,
        observedValue: this.calculateHandEyeCoordination(gameFeatures)
      });
      inputs.push({
        skillId: 'auditory_response' as SkillType,
        observedValue: this.calculateAuditoryResponseScore(gameFeatures)
      });
    }

    return inputs;
  }

  // -----------------------------------------------------------------
  //  CÁC HÀM TÍNH TOÁN (giữ nguyên logic như bản trước)
  // -----------------------------------------------------------------
  private static calculateResponseTime(features: BehavioralFeature[]): number {
    const stimulusEvents = features.filter(f => f.audioStimulus === 'name_call');
    if (stimulusEvents.length === 0) return 0;
    let totalLatency = 0, count = 0;
    for (const stimulus of stimulusEvents) {
      const response = features.find(f => 
        f.timestamp > stimulus.timestamp && f.isLookingAtTarget === true
      );
      if (response) {
        totalLatency += (response.timestamp - stimulus.timestamp) / 1000;
        count++;
      }
    }
    return count > 0 ? totalLatency / count : 10;
  }

  private static countJointAttentionShifts(features: BehavioralFeature[]): number {
    let shifts = 0, wasLooking = false;
    for (const f of features) {
      if (f.isLookingAtTarget && !wasLooking) {
        shifts++;
        wasLooking = true;
      } else if (!f.isLookingAtTarget) {
        wasLooking = false;
      }
    }
    return shifts;
  }

  private static calculateEyeContactPercentage(features: BehavioralFeature[]): number {
    if (features.length === 0) return 0;
    const gazeOnTarget = features.filter(f => f.isLookingAtTarget).length;
    return (gazeOnTarget / features.length) * 100;
  }

  private static calculateImitationScore(features: BehavioralFeature[]): number {
    if (features.length < 5) return 0;
    const hasHandData = features.some(f => (f.handLandmarks?.length || 0) > 0);
    const avgAttention = features.reduce((a, b) => a + b.attentionLevel, 0) / features.length;
    if (hasHandData && avgAttention > 0.6) return 80;
    if (avgAttention > 0.5) return 50;
    return 20;
  }

  private static calculateEmotionRecognitionScore(features: BehavioralFeature[]): number {
    const avgSmile = features.reduce((a, b) => a + b.smileIntensity, 0) / features.length;
    return avgSmile * 100;
  }

  private static calculateEmotionalExpressionScore(features: BehavioralFeature[]): number {
    if (features.length === 0) return 0;
    const nonNeutral = features.filter(f => f.affect !== 'neutral').length;
    return (nonNeutral / features.length) * 100;
  }

  private static calculatePretendPlayScore(features: BehavioralFeature[]): number {
    // Placeholder – sẽ cập nhật sau
    return 0;
  }

  private static calculateGazeStability(features: BehavioralFeature[]): number {
    if (features.length < 2) return 50;
    const xVals = features.map(f => f.gazeX);
    const yVals = features.map(f => f.gazeY);
    const variance = (nums: number[]) => {
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      return nums.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / nums.length;
    };
    const vx = variance(xVals);
    const vy = variance(yVals);
    const avgVariance = (vx + vy) / 2;
    const stability = Math.max(0, 100 - avgVariance * 2000);
    return Math.min(100, Math.round(stability));
  }

  private static calculateHandEyeCoordination(features: BehavioralFeature[]): number {
    const handFrames = features.filter(f => (f.handLandmarks?.length || 0) > 0);
    if (handFrames.length === 0) return 0;
    return (handFrames.length / features.length) * 100;
  }

  private static calculateAuditoryResponseScore(features: BehavioralFeature[]): number {
    const audioStimuli = features.filter(f => f.audioStimulus && f.audioStimulus !== 'none');
    if (audioStimuli.length === 0) return 0;
    let responses = 0;
    for (const stim of audioStimuli) {
      const window = features.filter(f => 
        f.timestamp > stim.timestamp && f.timestamp <= stim.timestamp + 1000
      );
      if (window.some(f => f.isLookingAtTarget === true || f.attentionLevel > 0.6)) {
        responses++;
      }
    }
    return (responses / audioStimuli.length) * 100;
  }

  private static groupByGame(features: BehavioralFeature[]): Record<string, BehavioralFeature[]> {
    const groups: Record<string, BehavioralFeature[]> = {};
    features.forEach(f => {
      const gameId = f.gameId || 'default';
      if (!groups[gameId]) groups[gameId] = [];
      groups[gameId].push(f);
    });
    return groups;
  }

  // ========== CÁC PHƯƠNG THỨC MỚI ĐƯỢC THÊM ==========
  /**
   * Nhóm các behavioral features theo gameId
   */
  static groupFeaturesByGame(features: BehavioralFeature[]): Record<string, BehavioralFeature[]> {
    return features.reduce((acc, f) => {
      const gameId = f.gameId || 'unknown';
      if (!acc[gameId]) acc[gameId] = [];
      acc[gameId].push(f);
      return acc;
    }, {} as Record<string, BehavioralFeature[]>);
  }

  /**
   * Chuyển đổi các features thành mảng metrics để lưu vào bảng game_session_metrics
   * @param gameSessionId ID của game session
   * @param features Mảng behavioral features của session đó
   * @returns Mảng các metric (chưa có id và captured_at)
   */
  static mapFeaturesToMetrics(
    gameSessionId: UUID,
    features: BehavioralFeature[]
  ): MetricInput[] {
    // Nếu không có features, trả về mảng rỗng
    if (!features.length) return [];

    const metrics: MetricInput[] = [];

    // Tính các giá trị tổng hợp từ features
    const avgAttention = features.reduce((sum, f) => sum + f.attentionLevel, 0) / features.length;
    const avgSmile = features.reduce((sum, f) => sum + f.smileIntensity, 0) / features.length;
    const gazeStability = this.calculateGazeStability(features);
    const handEyeCoordination = this.calculateHandEyeCoordination(features);
    const imitationScore = this.calculateImitationScore(features);
    const emotionRecognition = this.calculateEmotionRecognitionScore(features);

    // Thêm các metric tổng hợp
    metrics.push(
      {
        game_session_id: gameSessionId,
        metric_key: 'avg_attention',
        metric_value: avgAttention,
        unit: 'ratio',
      },
      {
        game_session_id: gameSessionId,
        metric_key: 'avg_smile',
        metric_value: avgSmile,
        unit: 'ratio',
      },
      {
        game_session_id: gameSessionId,
        metric_key: 'gaze_stability',
        metric_value: gazeStability,
        unit: 'percent',
      },
      {
        game_session_id: gameSessionId,
        metric_key: 'hand_eye_coordination',
        metric_value: handEyeCoordination,
        unit: 'percent',
      },
      {
        game_session_id: gameSessionId,
        metric_key: 'imitation_score',
        metric_value: imitationScore,
        unit: 'percent',
      },
      {
        game_session_id: gameSessionId,
        metric_key: 'emotion_recognition',
        metric_value: emotionRecognition,
        unit: 'percent',
      }
    );

    return metrics;
  }
}