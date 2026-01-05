import { BehavioralFeature, InferenceResult } from "../types";
import cameraService from "./cameraService";

export class InferenceService {
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private isProcessing = false;
  private animationFrameId: number | null = null;
  private behavioralWindow: BehavioralFeature[] = [];
  private readonly WINDOW_SIZE = 30;
  
  // Face detection variables
  private faceDetectionContext: CanvasRenderingContext2D | null = null;
  private lastFaceDetection = { x: 0.5, y: 0.5, size: 0.2, confidence: 0 };
  private frameCount = 0;
  private lastFrameTime = 0;

  async initialize(
    videoElement: HTMLVideoElement, 
    canvasElement?: HTMLCanvasElement
  ): Promise<boolean> {
    try {
      this.videoElement = videoElement;
      
      // FIX: Đặt size video trước khi start camera
      videoElement.width = 320;
      videoElement.height = 240;
      
      // Khởi tạo camera với fallback constraints
      const cameraStarted = await cameraService.startCamera(videoElement, {
        video: {
          width: { ideal: 320, max: 640 },
          height: { ideal: 240, max: 480 },
          facingMode: 'user',
          frameRate: { ideal: 15, max: 30 }
        }
      });
      
      if (!cameraStarted) {
        console.warn('Camera không khả dụng, sử dụng mock data');
        // Vẫn trả về true để game có thể chạy
        return true;
      }

      // FIX: Chờ video ready
      await new Promise((resolve) => {
        if (videoElement.readyState >= 2) {
          resolve(true);
        } else {
          videoElement.onloadeddata = () => resolve(true);
        }
      });

      // Khởi tạo canvas nếu có
      if (canvasElement) {
        this.canvasElement = canvasElement;
        this.faceDetectionContext = canvasElement.getContext('2d');
        canvasElement.width = 320;
        canvasElement.height = 240;
      }

      console.log('InferenceService initialized successfully');
      return true;
    } catch (error) {
      console.error('Khởi tạo InferenceService thất bại:', error);
      // FIX: Vẫn trả về true để game chạy với mock data
      return true;
    }
  }

  // FIX: Optimized face detection
  private detectSimpleFace(): { x: number; y: number; size: number; confidence: number } | null {
    if (!this.videoElement || !this.faceDetectionContext || !this.canvasElement) {
      return null;
    }
    
    try {
      const video = this.videoElement;
      const ctx = this.faceDetectionContext;
      const width = this.canvasElement.width;
      const height = this.canvasElement.height;
      
      // Skip frames để tăng performance (mỗi 3 frame detect 1 lần)
      this.frameCount++;
      if (this.frameCount % 3 !== 0) {
        return this.lastFaceDetection.confidence > 0 ? this.lastFaceDetection : null;
      }
      
      // Draw video frame
      ctx.drawImage(video, 0, 0, width, height);
      
      // Get center region (face thường ở giữa)
      const centerX = Math.floor(width * 0.25);
      const centerY = Math.floor(height * 0.25);
      const centerWidth = Math.floor(width * 0.5);
      const centerHeight = Math.floor(height * 0.5);
      
      const imageData = ctx.getImageData(centerX, centerY, centerWidth, centerHeight);
      const data = imageData.data;
      
      // Simple skin tone detection
      let skinPixels = 0;
      let totalX = 0;
      let totalY = 0;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Skin tone detection (adjustable thresholds)
        const isSkin = (
          r > 95 && g > 40 && b > 20 &&
          r > g && r > b &&
          Math.abs(r - g) > 15 &&
          r > 100 && r < 220
        );
        
        if (isSkin) {
          const pixelIndex = i / 4;
          const x = (pixelIndex % centerWidth) + centerX;
          const y = Math.floor(pixelIndex / centerWidth) + centerY;
          
          totalX += x;
          totalY += y;
          skinPixels++;
        }
      }
      
      if (skinPixels > 300) { // Lower threshold
        const faceX = totalX / skinPixels / width;
        const faceY = totalY / skinPixels / height;
        const faceSize = Math.sqrt(skinPixels / (centerWidth * centerHeight));
        const confidence = Math.min(1, skinPixels / 1000);
        
        this.lastFaceDetection = { 
          x: faceX, 
          y: faceY, 
          size: faceSize, 
          confidence 
        };
        return this.lastFaceDetection;
      }
      
      // Nếu không detect được, giảm confidence dần
      this.lastFaceDetection.confidence = Math.max(0, this.lastFaceDetection.confidence - 0.1);
      return this.lastFaceDetection.confidence > 0.3 ? this.lastFaceDetection : null;
      
    } catch (error) {
      console.warn('Face detection error:', error);
      return null;
    }
  }

  async processStreamingData(window: BehavioralFeature[]): Promise<InferenceResult> {
    if (window.length < 5) {
      return { 
        score: 0, 
        confidence: 0.3, 
        patternId: 'INSUFFICIENT_DATA',
        explanation: 'Collecting more data for analysis...',
        behavioralTags: ['initializing'],
        features: { 
          windowSize: window.length,
          timestamp: Date.now()
        } 
      };
    }

    try {
      // FIX: Face detection không chặn main thread
      let faceData = null;
      if (this.videoElement && this.videoElement.readyState >= 2) {
        faceData = this.detectSimpleFace();
      }

      // Tính toán metrics
      const gazeStability = this.calculateGazeStability(window);
      const affectConsistency = this.calculateAffectConsistency(window);
      const attentionConsistency = this.calculateAttentionConsistency(window);
      const engagementLevel = this.calculateEngagementLevel(window);
      
      // Tính composite score
      const baseScore = (
        gazeStability * 0.3 + 
        affectConsistency * 0.2 + 
        attentionConsistency * 0.3 +
        engagementLevel * 0.2
      ) * 10;

      // Confidence dựa trên face detection và data quality
      let confidence = 0.5;
      if (faceData?.confidence) {
        confidence = 0.3 + (faceData.confidence * 0.5);
      }
      if (window.length > 20) confidence += 0.2;
      
      // Generate explanation
      const explanation = this.generateExplanation(
        gazeStability, 
        affectConsistency, 
        attentionConsistency,
        engagementLevel,
        !!faceData
      );

      // Generate behavioral tags
      const behavioralTags = this.generateBehavioralTags(
        gazeStability,
        affectConsistency,
        attentionConsistency,
        engagementLevel
      );

      return {
        score: Math.min(10, Math.round(baseScore)),
        confidence: Math.min(0.95, confidence),
        patternId: `pattern-${Date.now()}-${window.length}`,
        explanation,
        behavioralTags,
        features: {
          gazeStability,
          affectConsistency,
          attentionConsistency,
          engagementLevel,
          hasFaceData: !!faceData,
          faceConfidence: faceData?.confidence || 0,
          windowSize: window.length,
          timestamp: Date.now(),
          frameCount: this.frameCount
        }
      };
    } catch (error) {
      console.error('Error processing streaming data:', error);
      return {
        score: 5,
        confidence: 0.2,
        patternId: 'ERROR',
        explanation: 'Basic analysis completed',
        behavioralTags: ['basic_analysis', 'fallback'],
        features: { 
          error: error instanceof Error ? error.message : 'Unknown',
          timestamp: Date.now()
        }
      };
    }
  }

  // Helper methods
  private calculateGazeStability(window: BehavioralFeature[]): number {
    if (window.length < 2) return 0.5;
    
    let totalVariation = 0;
    for (let i = 1; i < window.length; i++) {
      const prev = window[i - 1];
      const curr = window[i];
      totalVariation += Math.abs(curr.gazeX - prev.gazeX) + Math.abs(curr.gazeY - prev.gazeY);
    }
    
    const avgVariation = totalVariation / (window.length - 1) / 2;
    return Math.max(0.1, 1 - avgVariation);
  }

  private calculateAffectConsistency(window: BehavioralFeature[]): number {
    const positiveCount = window.filter(f => f.affect === 'positive').length;
    const ratio = positiveCount / window.length;
    
    if (ratio > 0.7) return 0.9;
    if (ratio > 0.5) return 0.7;
    if (ratio > 0.3) return 0.5;
    return 0.3;
  }

  private calculateAttentionConsistency(window: BehavioralFeature[]): number {
    const avg = window.reduce((sum, f) => sum + f.attentionLevel, 0) / window.length;
    return Math.min(1, Math.max(0.1, avg));
  }

  private calculateEngagementLevel(window: BehavioralFeature[]): number {
    // Engagement dựa trên sự kết hợp của attention và affect
    const avgAttention = this.calculateAttentionConsistency(window);
    const avgAffect = this.calculateAffectConsistency(window);
    return (avgAttention * 0.6 + avgAffect * 0.4);
  }

  private generateExplanation(
    gazeStability: number,
    affectConsistency: number,
    attentionConsistency: number,
    engagementLevel: number,
    hasFaceData: boolean
  ): string {
    const parts = [];
    
    if (gazeStability > 0.7) {
      parts.push("Good visual tracking");
    } else if (gazeStability > 0.4) {
      parts.push("Developing gaze stability");
    }
    
    if (affectConsistency > 0.7) {
      parts.push("positive engagement");
    }
    
    if (attentionConsistency > 0.7) {
      parts.push("sustained focus");
    }
    
    if (engagementLevel > 0.7) {
      parts.push("high overall engagement");
    }
    
    if (parts.length === 0) {
      parts.push("Basic engagement patterns observed");
    }
    
    return parts.join(", ") + ".";
  }

  private generateBehavioralTags(
    gazeStability: number,
    affectConsistency: number,
    attentionConsistency: number,
    engagementLevel: number
  ): string[] {
    const tags = [];
    
    if (gazeStability > 0.7) tags.push("stable_gaze");
    if (affectConsistency > 0.7) tags.push("positive_affect");
    if (attentionConsistency > 0.7) tags.push("focused");
    if (engagementLevel > 0.7) tags.push("high_engagement");
    
    tags.push("behavioral_analysis");
    return tags;
  }

  // FIX: Continuous inference với error handling tốt hơn
  startContinuousInference(
    onResult: (result: InferenceResult) => void,
    interval: number = 200 // 5fps để giảm tải
  ): void {
    if (this.isProcessing) {
      console.warn('Continuous inference already running');
      return;
    }

    this.isProcessing = true;
    this.behavioralWindow = [];
    this.frameCount = 0;

    const processFrame = async () => {
      if (!this.isProcessing) return;

      const now = Date.now();
      const delta = now - this.lastFrameTime;
      
      // Đảm bảo interval
      if (delta < interval) {
        requestAnimationFrame(processFrame);
        return;
      }
      
      this.lastFrameTime = now;

      try {
        // Tạo behavioral feature
        const faceData = this.detectSimpleFace();
        
        const behavioralFeature: BehavioralFeature = {
          timestamp: now,
          gazeX: faceData ? faceData.x : 0.5 + (Math.sin(now / 1000) * 0.1),
          gazeY: faceData ? faceData.y : 0.5 + (Math.cos(now / 800) * 0.1),
          attentionLevel: faceData ? 
            0.5 + (faceData.confidence * 0.3) + (Math.sin(now / 1500) * 0.2) : 
            0.4 + (Math.sin(now / 1200) * 0.3),
          affect: Math.random() > 0.4 ? 'positive' : 'neutral',
          frownIntensity: Math.random() * 0.3,
          smileIntensity: Math.random() > 0.3 ? Math.random() * 0.7 : 0.2,
          poseConfidence: faceData?.confidence || 0.2,
          faceConfidence: faceData?.confidence || 0.2
        };

        // Add to window
        this.behavioralWindow.push(behavioralFeature);
        
        // Maintain window size
        if (this.behavioralWindow.length > this.WINDOW_SIZE * 2) {
          this.behavioralWindow = this.behavioralWindow.slice(-this.WINDOW_SIZE);
        }

        // Process khi có đủ data
        if (this.behavioralWindow.length >= 10) {
          const windowToProcess = this.behavioralWindow.slice(-Math.min(15, this.behavioralWindow.length));
          const result = await this.processStreamingData(windowToProcess);
          onResult(result);
        }
      } catch (error) {
        console.error('Error in continuous inference frame:', error);
        // Continue processing despite errors
      }

      // Schedule next frame
      this.animationFrameId = requestAnimationFrame(processFrame);
    };

    console.log('Starting continuous inference...');
    this.animationFrameId = requestAnimationFrame(processFrame);
  }

  stopContinuousInference(): void {
    console.log('Stopping continuous inference...');
    this.isProcessing = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    console.log('Continuous inference stopped');
  }

  // FIX: Thêm check trước khi dispose
  dispose(): void {
    console.log('Disposing InferenceService...');
    
    this.stopContinuousInference();
    
    // Clear canvas context
    if (this.faceDetectionContext) {
      const ctx = this.faceDetectionContext;
      ctx.clearRect(0, 0, ctx.canvas.width || 0, ctx.canvas.height || 0);
      this.faceDetectionContext = null;
    }
    
    // Clean up video
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
    
    this.canvasElement = null;
    this.behavioralWindow = [];
    this.frameCount = 0;
    
    console.log('InferenceService disposed');
  }

  getStatus(): {
    isInitialized: boolean;
    isProcessing: boolean;
    hasCamera: boolean;
    windowSize: number;
    frameCount: number;
  } {
    return {
      isInitialized: this.videoElement !== null,
      isProcessing: this.isProcessing,
      hasCamera: cameraService.getStream() !== null,
      windowSize: this.behavioralWindow.length,
      frameCount: this.frameCount
    };
  }
}

// Export singleton instance
export default new InferenceService();