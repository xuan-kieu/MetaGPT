// services/InferenceService.ts
import { BehavioralFeature, InferenceResult } from "../types";
import poseDetectionService from "./poseDetectionService";
import cameraService from "./cameraService";

export class InferenceService {
  private videoElement: HTMLVideoElement | null = null;
  private isProcessing = false;
  private animationFrameId: number | null = null;
  private behavioralWindow: BehavioralFeature[] = [];
  private readonly WINDOW_SIZE = 10;

  /**
   * Khởi tạo camera và pose detection
   */
  async initialize(videoElement: HTMLVideoElement): Promise<boolean> {
    try {
      this.videoElement = videoElement;
      
      // Bật camera
      const cameraStarted = await cameraService.startCamera(videoElement);
      if (!cameraStarted) {
        console.warn('Camera không khả dụng, chuyển sang chế độ mock');
        return false;
      }

      // Khởi tạo pose detection
      await poseDetectionService.initialize();
      console.log('InferenceService đã khởi tạo thành công');
      return true;
    } catch (error) {
      console.error('Khởi tạo InferenceService thất bại:', error);
      return false;
    }
  }

  /**
   * Simulates a Longitudinal Temporal Convolutional Network inference
   * Vẫn giữ nguyên API cũ nhưng tích hợp thêm pose data nếu có
   */
  async processStreamingData(window: BehavioralFeature[]): Promise<InferenceResult> {
    // Fallback nếu window quá nhỏ
    if (window.length < this.WINDOW_SIZE) {
      return { 
        score: 0, 
        confidence: 0.5, 
        features: { 
          message: 'Window size too small',
          windowSize: window.length 
        } 
      };
    }

    try {
      let poseScore = 0;
      let hasPoseData = false;

      // Lấy pose data nếu camera đã khởi tạo
      if (this.videoElement && poseDetectionService.isInitialized) {
        const pose = await poseDetectionService.estimatePose(this.videoElement);
        
        if (pose && pose.keypoints && pose.keypoints.length > 0) {
          hasPoseData = true;
          poseScore = this.calculatePoseStability(pose);
        }
      }

      // Logic cũ: temporal analysis of gaze and affect
      const gazeVariability = window.reduce((acc, curr, idx, arr) => {
        if (idx === 0) return 0;
        return acc + Math.abs(curr.gazeX - arr[idx - 1].gazeX);
      }, 0);

      // Tính base score từ behavioral features
      const baseScore = Math.min(100, (gazeVariability / window.length) * 50);

      // Kết hợp với pose score nếu có
      let finalScore = baseScore;
      if (hasPoseData) {
        // Trọng số: 60% behavioral, 40% pose
        finalScore = (baseScore * 0.6) + (poseScore * 0.4);
      }

      return {
        score: finalScore,
        confidence: hasPoseData ? 0.9 : 0.7, // Confidence cao hơn nếu có pose data
        features: {
          gazeVariability,
          windowSize: window.length,
          hasPoseData,
          poseScore: hasPoseData ? poseScore : 0,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error('Lỗi xử lý streaming data:', error);
      return {
        score: 0,
        confidence: 0.1,
        features: { 
          error: 'Processing failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Tính toán độ ổn định của pose
   */
  private calculatePoseStability(pose: any): number {
    if (!pose.keypoints || pose.keypoints.length < 10) return 0;

    // Tính confidence trung bình của keypoints
    const avgConfidence = pose.keypoints.reduce((sum: number, kp: any) => {
      return sum + (kp.score || 0);
    }, 0) / pose.keypoints.length;

    // Tính độ lệch của các keypoints quan trọng
    const importantKeypoints = [0, 1, 2, 5, 6, 11, 12, 13, 14, 23, 24, 25, 26, 27, 28];
    let stability = 1.0;

    // Kiểm tra xem các keypoints có nằm trong vùng hợp lý không
    const validKeypoints = importantKeypoints.filter(idx => {
      const kp = pose.keypoints[idx];
      return kp && kp.score > 0.3;
    }).length;

    const validityRatio = validKeypoints / importantKeypoints.length;
    
    // Kết hợp confidence và validity
    const stabilityScore = (avgConfidence * 0.6 + validityRatio * 0.4) * 100;
    return Math.min(100, stabilityScore);
  }

  /**
   * Bắt đầu xử lý real-time liên tục
   */
  startContinuousInference(
    onResult: (result: InferenceResult) => void,
    interval: number = 100 // ms giữa các lần inference
  ): void {
    if (this.isProcessing) {
      console.warn('Continuous inference đã chạy');
      return;
    }

    this.isProcessing = true;
    this.behavioralWindow = [];

    const processFrame = async () => {
      if (!this.isProcessing) return;

      try {
        // Tạo behavioral feature mới (mock - thay bằng dữ liệu thật nếu có)
        const behavioralFeature: BehavioralFeature = {
          timestamp: Date.now(),
          gazeX: Math.random(),
          gazeY: Math.random(),
          attentionLevel: Math.random(),
          affect: Math.random() > 0.5 ? 'positive' : 'neutral',
          frownIntensity: Math.random(),
          smileIntensity: Math.random()
        };

        // Thêm vào window
        this.behavioralWindow.push(behavioralFeature);
        
        // Giữ window size
        if (this.behavioralWindow.length > this.WINDOW_SIZE * 2) {
          this.behavioralWindow = this.behavioralWindow.slice(-this.WINDOW_SIZE);
        }

        // Xử lý khi có đủ data
        if (this.behavioralWindow.length >= this.WINDOW_SIZE) {
          const windowToProcess = this.behavioralWindow.slice(-this.WINDOW_SIZE);
          const result = await this.processStreamingData(windowToProcess);
          onResult(result);
        }
      } catch (error) {
        console.error('Lỗi continuous inference:', error);
      }

      // Lập lịch frame tiếp theo
      setTimeout(() => {
        if (this.isProcessing) {
          this.animationFrameId = requestAnimationFrame(processFrame);
        }
      }, interval);
    };

    // Bắt đầu vòng lặp
    this.animationFrameId = requestAnimationFrame(processFrame);
    console.log('Continuous inference đã bắt đầu');
  }

  /**
   * Dừng xử lý real-time
   */
  stopContinuousInference(): void {
    this.isProcessing = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    console.log('Continuous inference đã dừng');
  }

  /**
   * Chụp ảnh từ camera hiện tại
   */
  async captureImage(): Promise<HTMLCanvasElement | null> {
    if (!this.videoElement) {
      console.error('Video element chưa khởi tạo');
      return null;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = this.videoElement.videoWidth;
      canvas.height = this.videoElement.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Không thể lấy canvas context');
      }

      // Mirror image để hiển thị tự nhiên
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(this.videoElement, 0, 0);
      
      return canvas;
    } catch (error) {
      console.error('Lỗi chụp ảnh:', error);
      return null;
    }
  }

  /**
   * Lấy pose từ ảnh
   */
  async estimatePoseFromImage(image: HTMLImageElement | HTMLCanvasElement): Promise<any> {
    try {
      return await poseDetectionService.estimatePoseFromImage(image);
    } catch (error) {
      console.error('Lỗi estimate pose từ ảnh:', error);
      return null;
    }
  }

  /**
   * Chuyển đổi camera (trước/sau)
   */
  async switchCamera(): Promise<boolean> {
    if (!this.videoElement) {
      console.error('Video element chưa khởi tạo');
      return false;
    }

    try {
      return await cameraService.switchCamera(this.videoElement);
    } catch (error) {
      console.error('Lỗi chuyển đổi camera:', error);
      return false;
    }
  }

  /**
   * Dọn dẹp tài nguyên
   */
  dispose(): void {
    this.stopContinuousInference();
    cameraService.stopCamera();
    poseDetectionService.dispose();
    this.videoElement = null;
    this.behavioralWindow = [];
    console.log('InferenceService đã được dọn dẹp');
  }

  /**
   * Utility: Lấy thông tin trạng thái
   */
  getStatus(): {
    isInitialized: boolean;
    isProcessing: boolean;
    hasCamera: boolean;
    windowSize: number;
  } {
    return {
      isInitialized: this.videoElement !== null,
      isProcessing: this.isProcessing,
      hasCamera: cameraService.getStream() !== null,
      windowSize: this.behavioralWindow.length
    };
  }
}

// Export singleton instance
export default new InferenceService();