import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { BehavioralFeature } from '../types';

export class FeatureExtractorService {
  private static instance: FeatureExtractorService;
  // Sửa type: FaceLandmarksDetector là type chung cho các detector mới
  private model: faceLandmarksDetection.FaceLandmarksDetector | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private isInitialized = false;
  private lastPredictionTime = 0;
  private readonly FPS = 15;

  private constructor() {}

  static getInstance(): FeatureExtractorService {
    if (!FeatureExtractorService.instance) {
      FeatureExtractorService.instance = new FeatureExtractorService();
    }
    return FeatureExtractorService.instance;
  }

  async initialize(videoElement: HTMLVideoElement): Promise<boolean> {
    try {
      this.videoElement = videoElement;
      
      this.canvasElement = document.createElement('canvas');
      this.canvasElement.width = 640;
      this.canvasElement.height = 480;
      
      await tf.setBackend('webgl');
      await tf.ready();
      
      // THAY ĐỔI 1: Sử dụng createDetector thay vì load
      const modelType = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig = {
        runtime: 'mediapipe', // hoặc 'mediapipe' nếu bạn cài gói backend mediapipe
        refineLandmarks: true, // Quan trọng để lấy điểm mống mắt (iris)
        maxFaces: 1,
      };

      this.model = await faceLandmarksDetection.createDetector(
        modelType,
        detectorConfig
      );
      
      this.isInitialized = true;
      console.log('Feature Extractor initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize feature extractor:', error);
      return false;
    }
  }

  async extractFeatures(): Promise<BehavioralFeature | null> {
    if (!this.isInitialized || !this.model || !this.videoElement || !this.canvasElement) {
      return null;
    }

    const now = Date.now();
    if (now - this.lastPredictionTime < 1000 / this.FPS) {
      return null;
    }

    try {
      const ctx = this.canvasElement.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(
        this.videoElement,
        0, 0,
        this.canvasElement.width,
        this.canvasElement.height
      );

      // THAY ĐỔI 2: Cú pháp estimateFaces mới
      // Tham số 1: Input (canvas/video), Tham số 2: Options
      const predictions = await this.model.estimateFaces(this.canvasElement, {
        flipHorizontal: false,
        staticImageMode: false,
      });

      if (predictions.length === 0) {
        return null;
      }

      const face = predictions[0];
      
      const features = this.calculateFeatures(face);
      
      this.lastPredictionTime = now;
      return features;
    } catch (error) {
      console.error('Feature extraction failed:', error);
      return null;
    }
  }

  private calculateFeatures(face: any): BehavioralFeature {
    // THAY ĐỔI 3: Xử lý dữ liệu Keypoints
    // API mới trả về face.keypoints dạng [{x,y,z,name}, ...].
    // Logic tính toán cũ của bạn dùng mảng [[x,y,z], ...].
    // Ta convert lại để giữ nguyên logic tính toán bên dưới.
    const keypoints = face.keypoints;
    const landmarks = keypoints.map((kp: { x: number; y: number; z?: number }) => [kp.x, kp.y, kp.z || 0]);
    
    // Logic bên dưới giữ nguyên vì 'landmarks' giờ đã đúng định dạng mảng
    const gaze = this.calculateGaze(landmarks);
    const expressions = this.calculateExpressions(landmarks);
    const headPose = this.calculateHeadPose(landmarks);
    
    // Confidence trong model mới gọi là score (nếu có) hoặc mặc định lấy 0.9
    const confidence = face.score ? face.score[0] : 0.9;

    return {
      timestamp: Date.now(),
      gazeX: gaze.x,
      gazeY: gaze.y,
      frownIntensity: expressions.frown,
      smileIntensity: expressions.smile,
      headPitch: headPose.pitch,
      headYaw: headPose.yaw,
      headRoll: headPose.roll,
      confidence: confidence,
    };
  }

  // --- Các hàm tính toán giữ nguyên logic cũ ---

  private calculateGaze(landmarks: number[][]): { x: number; y: number } {
    const LEFT_EYE = [33, 133];
    const RIGHT_EYE = [362, 263];
    const LEFT_IRIS = [468, 469, 470, 471];
    const RIGHT_IRIS = [472, 473, 474, 475];

    const leftEyeCenter = this.averagePoints(landmarks, LEFT_EYE);
    const rightEyeCenter = this.averagePoints(landmarks, RIGHT_EYE);
    const leftIrisCenter = this.averagePoints(landmarks, LEFT_IRIS);
    const rightIrisCenter = this.averagePoints(landmarks, RIGHT_IRIS);

    const leftGazeX = (leftIrisCenter[0] - leftEyeCenter[0]) * 2;
    const leftGazeY = (leftIrisCenter[1] - leftEyeCenter[1]) * 2;
    const rightGazeX = (rightIrisCenter[0] - rightEyeCenter[0]) * 2;
    const rightGazeY = (rightIrisCenter[1] - rightEyeCenter[1]) * 2;

    return {
      x: (leftGazeX + rightGazeX) / 2,
      y: (leftGazeY + rightGazeY) / 2,
    };
  }

  private calculateExpressions(landmarks: number[][]): { smile: number; frown: number } {
    const MOUTH_CORNERS = [61, 291];
    const MOUTH_TOP = [13, 14];
    const MOUTH_BOTTOM = [17, 18];
    const LEFT_EYEBROW = [70, 63, 105];
    const RIGHT_EYEBROW = [336, 296, 334];

    const mouthLeft = landmarks[MOUTH_CORNERS[0]];
    const mouthRight = landmarks[MOUTH_CORNERS[1]];
    const mouthTop = this.averagePoints(landmarks, MOUTH_TOP);
    const mouthBottom = this.averagePoints(landmarks, MOUTH_BOTTOM);

    const mouthWidth = Math.abs(mouthRight[0] - mouthLeft[0]);
    const mouthHeight = Math.abs(mouthBottom[1] - mouthTop[1]);
    
    const smileRatio = mouthWidth / (mouthHeight + 0.001);
    const smileIntensity = Math.min(1, Math.max(0, (smileRatio - 0.8) * 2));

    const leftEyebrowY = this.averagePoints(landmarks, LEFT_EYEBROW)[1];
    const rightEyebrowY = this.averagePoints(landmarks, RIGHT_EYEBROW)[1];
    const leftEyeY = landmarks[33][1];
    const rightEyeY = landmarks[263][1];

    const leftFrown = Math.max(0, leftEyeY - leftEyebrowY);
    const rightFrown = Math.max(0, rightEyeY - rightEyebrowY);
    const frownIntensity = Math.min(1, (leftFrown + rightFrown) * 3);

    return {
      smile: smileIntensity,
      frown: frownIntensity,
    };
  }

  private calculateHeadPose(landmarks: number[][]): { pitch: number; yaw: number; roll: number } {
    const NOSE_TIP = 1;
    const CHIN = 152;
    const LEFT_EYE = 33;
    const RIGHT_EYE = 263;

    const nose = landmarks[NOSE_TIP];
    const chin = landmarks[CHIN];
    const leftEye = landmarks[LEFT_EYE];
    const rightEye = landmarks[RIGHT_EYE];

    const eyeLineAngle = Math.atan2(
      rightEye[1] - leftEye[1],
      rightEye[0] - leftEye[0]
    );
    const roll = eyeLineAngle * (180 / Math.PI);

    const noseChinVector = [chin[0] - nose[0], chin[1] - nose[1]];
    const pitch = Math.atan2(noseChinVector[1], noseChinVector[0]) * (180 / Math.PI) - 90;

    const faceWidth = rightEye[0] - leftEye[0];
    const faceCenter = (leftEye[0] + rightEye[0]) / 2;
    const yaw = ((nose[0] - faceCenter) / (faceWidth / 2)) * 45;

    return {
      pitch: pitch / 90,
      yaw: yaw / 90,
      roll: roll / 90,
    };
  }

  private averagePoints(landmarks: number[][], indices: number[]): number[] {
    const sum = [0, 0, 0];
    indices.forEach(idx => {
      // Đảm bảo landmark tồn tại trước khi truy cập
      if (landmarks[idx]) {
        sum[0] += landmarks[idx][0];
        sum[1] += landmarks[idx][1];
        sum[2] += landmarks[idx][2];
      }
    });
    return [
      sum[0] / indices.length,
      sum[1] / indices.length,
      sum[2] / indices.length,
    ];
  }

  cleanup(): void {
    if (this.model) {
      this.model.dispose();
    }
    tf.disposeVariables();
    this.isInitialized = false;
  }
}