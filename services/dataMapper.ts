// src/services/dataMapper.ts

import { BehavioralFeature } from '../types';
import { AssessmentInput, SkillType } from './scoringService';

export class DataMapper {
  
  /**
   * HÀM CHÍNH: Chuyển đổi dữ liệu AI thô thành Input cho hệ thống tính điểm
   */
  static mapSessionToInputs(features: BehavioralFeature[]): AssessmentInput[] {
    const inputs: AssessmentInput[] = [];

    // 1. Nhóm features theo Game ID để xử lý riêng
    const featuresByGame = this.groupByGame(features);

    // 2. Tính toán từng chỉ số dựa trên logic Game
    
    // --- KỸ NĂNG LÕI ---
    inputs.push({
      skillId: 'response_to_name',
      observedValue: this.calculateResponseTime(features) // Đơn vị: Giây
    });

    inputs.push({
      skillId: 'joint_attention',
      observedValue: this.countJointAttention(features) // Đơn vị: Số lần
    });

    inputs.push({
      skillId: 'non_verbal',
      observedValue: this.calculateEyeContactPercentage(features) // Đơn vị: % thời gian
    });

    // --- KỸ NĂNG XÃ HỘI ---
    inputs.push({
      skillId: 'emotion_recognition',
      observedValue: this.calculateSmileResponse(features) // Đơn vị: Điểm (0-100)
    });

    // ... Thêm các skill khác tùy logic game

    return inputs;
  }

  // --- CÁC HÀM TÍNH TOÁN CỤ THỂ (LOGIC GAME) ---

  private static calculateResponseTime(features: BehavioralFeature[]): number {
    // Logic: Tìm thời điểm phát âm thanh 'name_call' -> Tìm thời điểm mắt nhìn vào target sau đó
    const stimulusStart = features.find(f => f.audioStimulus === 'name_call');
    if (!stimulusStart) return 0; // Không có sự kiện gọi tên

    const response = features.find(f => 
      f.timestamp > stimulusStart.timestamp && 
      f.isLookingAtTarget === true
    );

    if (response) {
      return (response.timestamp - stimulusStart.timestamp) / 1000; // Đổi ra giây
    }
    return 10; // Nếu không phản ứng, gán mặc định 10 giây (max penalty)
  }

  private static countJointAttention(features: BehavioralFeature[]): number {
    // Logic: Đếm số lần chuyển mắt từ Target -> Màn hình -> Target (Gaze Shift)
    // Đây là logic giả lập, thực tế cần thuật toán phức tạp hơn
    let shifts = 0;
    let lookingAtTarget = false;

    for (const f of features) {
      if (f.isLookingAtTarget && !lookingAtTarget) {
        shifts++;
        lookingAtTarget = true;
      } else if (!f.isLookingAtTarget) {
        lookingAtTarget = false;
      }
    }
    return shifts;
  }

  private static calculateEyeContactPercentage(features: BehavioralFeature[]): number {
    if (features.length === 0) return 0;
    const gazeCount = features.filter(f => f.isLookingAtTarget).length;
    return (gazeCount / features.length) * 100;
  }

  private static calculateSmileResponse(features: BehavioralFeature[]): number {
    if (features.length === 0) return 0;
    // Lấy cường độ cười trung bình * 100
    const totalSmile = features.reduce((sum, f) => sum + (f.smileIntensity || 0), 0);
    return (totalSmile / features.length) * 100;
  }

  private static groupByGame(features: BehavioralFeature[]) {
    // Helper nhóm dữ liệu
    const groups: Record<string, BehavioralFeature[]> = {};
    features.forEach(f => {
      const gId = f.gameId || 'unknown';
      if (!groups[gId]) groups[gId] = [];
      groups[gId].push(f);
    });
    return groups;
  }
}