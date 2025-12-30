import * as poseDetection from '@tensorflow-models/pose-detection';
import * as mpPose from '@mediapipe/pose';
import * as tf from '@tensorflow/tfjs-core';

export class PoseDetectionService {
  private detector: poseDetection.PoseDetector | null = null;
  public isInitialized = false;

  async initialize() {
    try {
      await tf.setBackend('webgl');
      await tf.ready();

      const model = poseDetection.SupportedModels.BlazePose;
      const detectorConfig: poseDetection.BlazePoseMediaPipeModelConfig = {
        runtime: 'mediapipe',
        solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${mpPose.VERSION}`,
        modelType: 'full'
      };

      this.detector = await poseDetection.createDetector(model, detectorConfig);
      this.isInitialized = true;
      console.log('Pose Detection initialized');
    } catch (error) {
      console.error('Failed to initialize pose detection:', error);
      throw error;
    }
  }

  async estimatePose(videoElement: HTMLVideoElement) {
    if (!this.detector || !this.isInitialized) {
      await this.initialize();
    }

    try {
      const poses = await this.detector!.estimatePoses(videoElement, {
        flipHorizontal: false,
        maxPoses: 1
      });
      
      return poses[0] || null;
    } catch (error) {
      console.error('Pose estimation failed:', error);
      return null;
    }
  }

  async estimatePoseFromImage(imageElement: HTMLImageElement | HTMLCanvasElement) {
    if (!this.detector || !this.isInitialized) {
      await this.initialize();
    }

    try {
      const poses = await this.detector!.estimatePoses(imageElement, {
        flipHorizontal: false,
        maxPoses: 1
      });
      
      return poses[0] || null;
    } catch (error) {
      console.error('Pose estimation failed:', error);
      return null;
    }
  }

  dispose() {
    if (this.detector) {
      // @ts-ignore - dispose method exists but not in types
      this.detector.dispose?.();
      this.detector = null;
    }
    this.isInitialized = false;
  }
  
}

export default new PoseDetectionService();
{
    interface PoseDetectionService {
  isInitialized: boolean;
  initialize(): Promise<void>;
  estimatePose(video: HTMLVideoElement): Promise<any>;
  estimatePoseFromImage(image: HTMLImageElement | HTMLCanvasElement): Promise<any>;
  dispose(): void;
}
}