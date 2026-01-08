// ... (Giữ nguyên phần import và logic detectSimpleFace)
import { BehavioralFeature, InferenceResult } from "../types";
import cameraService from "./cameraService";

export class InferenceService {
  // ... (Giữ nguyên các thuộc tính class)
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private faceDetectionContext: CanvasRenderingContext2D | null = null;
  private isProcessing = false;
  private animationFrameId: number | null = null;
  private behavioralWindow: BehavioralFeature[] = [];
  private readonly WINDOW_SIZE = 30;

  async initialize(videoElement: HTMLVideoElement, canvasElement?: HTMLCanvasElement): Promise<boolean> {
     // ... (Giữ nguyên logic initialize như cũ)
     try {
      this.videoElement = videoElement;
      const cameraStarted = await cameraService.startCamera(videoElement);
      if (!cameraStarted) return false;

      if (canvasElement) {
        this.canvasElement = canvasElement;
        this.faceDetectionContext = canvasElement.getContext('2d', { willReadFrequently: true });
        canvasElement.width = 320;
        canvasElement.height = 240;
      }
      return true;
    } catch (error) {
      console.error('InferenceService init error:', error);
      return false;
    }
  }
  
  // ... (Giữ nguyên detectSimpleFace)
   private detectSimpleFace(video: HTMLVideoElement) {
    if (!this.faceDetectionContext || !this.canvasElement) return null;
    const ctx = this.faceDetectionContext;
    const { width, height } = this.canvasElement;
    ctx.drawImage(video, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    let skinPixels = 0;
    let totalX = 0;
    let totalY = 0;
    
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
        const pixelIndex = i / 4;
        totalX += pixelIndex % width;
        totalY += Math.floor(pixelIndex / width);
        skinPixels++;
      }
    }
    
    if (skinPixels > (width * height) * 0.05) {
      return {
        x: (totalX / skinPixels) / width,
        y: (totalY / skinPixels) / height,
        confidence: 0.7
      };
    }
    return null;
  }


  async processStreamingData(windowData: BehavioralFeature[]): Promise<InferenceResult> {
    const lastFrame = windowData[windowData.length - 1];
    const stabilityScore = this.calculateStability(windowData);
    const attentionScore = windowData.reduce((acc, val) => acc + val.attentionLevel, 0) / windowData.length;

    return {
      score: Math.round(attentionScore * 10),
      confidence: lastFrame.faceConfidence,
      patternId: `live-${Date.now()}`,
      explanation: attentionScore > 0.6 ? "High engagement detected" : "Low engagement detected",
      behavioralTags: [
        stabilityScore > 0.7 ? "stable_gaze" : "wandering_gaze",
        attentionScore > 0.6 ? "focused" : "distracted"
      ],
      features: {
        gazeStability: stabilityScore,
        windowSize: windowData.length,
        hasFaceData: lastFrame.faceConfidence > 0,
        timestamp: Date.now()
      }
    };
  }

  private calculateStability(windowData: BehavioralFeature[]): number {
     if (windowData.length < 2) return 1;
     let changes = 0;
     for(let i=1; i<windowData.length; i++) {
        changes += Math.abs(windowData[i].gazeX - windowData[i-1].gazeX);
     }
     return Math.max(0, 1 - (changes / windowData.length));
  }

  startContinuousInference(onResult: (result: InferenceResult) => void, interval: number = 200): void {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.behavioralWindow = [];

    const loop = async () => {
      if (!this.isProcessing || !this.videoElement) return;

      const face = this.detectSimpleFace(this.videoElement);
      
      // FIX: Ensure affect is strictly 'positive' | 'neutral' | 'negative'
      let currentAffect: 'positive' | 'neutral' | 'negative' = 'neutral';
      if (face) {
          // Simple mock: random chance for positive if face detected
          currentAffect = Math.random() > 0.7 ? 'positive' : 'neutral';
      }

      const feature: BehavioralFeature = {
        timestamp: Date.now(),
        gazeX: face ? face.x : 0.5 + (Math.random() * 0.1 - 0.05),
        gazeY: face ? face.y : 0.5 + (Math.random() * 0.1 - 0.05),
        attentionLevel: face ? 0.8 : 0.2,
        affect: currentAffect, // Fixed type
        smileIntensity: face ? 0.6 : 0.1,
        frownIntensity: 0.1,
        poseConfidence: face ? 0.8 : 0,
        faceConfidence: face ? face.confidence : 0
      };

      this.behavioralWindow.push(feature);
      if (this.behavioralWindow.length > this.WINDOW_SIZE) {
        this.behavioralWindow.shift();
      }

      if (this.behavioralWindow.length >= 5) {
        const result = await this.processStreamingData([...this.behavioralWindow]);
        onResult(result);
      }

      setTimeout(() => {
        if (this.isProcessing) this.animationFrameId = requestAnimationFrame(loop);
      }, interval);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  stopContinuousInference(): void {
    this.isProcessing = false;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
  }
  
  dispose(): void {
    this.stopContinuousInference();
    cameraService.stopCamera();
    this.videoElement = null;
    this.canvasElement = null;
  }
}

export default new InferenceService();