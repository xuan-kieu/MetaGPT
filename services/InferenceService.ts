// services/InferenceService.ts
import { BehavioralFeature, InferenceResult, Landmark, Emotion, AudioFeatures } from '../types';
import cameraService from './cameraService';
import poseDetectionService, { MediaPipeResults } from './poseDetectionService';

// ==================== AUDIO ANALYZER ====================
class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private isActive = false;

  async initialize() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.source.connect(this.analyser);
      this.isActive = true;
      return true;
    } catch {
      return false;
    }
  }

  getFeatures(): AudioFeatures | null {
    if (!this.isActive || !this.analyser) return null;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
    const volume = sum / dataArray.length;
    return {
      volume: volume / 255,
      vad: volume > 15,
    };
  }

  dispose() {
    this.source?.disconnect();
    this.audioContext?.close();
    this.mediaStream?.getTracks().forEach(t => t.stop());
    this.isActive = false;
  }
}

// ==================== HELPER: GAZE ESTIMATION ====================
function estimateGazeVector(faceLandmarks: Landmark[]): { x: number; y: number; z: number } {
  const leftIris = faceLandmarks[468] ?? faceLandmarks[33];
  const rightIris = faceLandmarks[473] ?? faceLandmarks[362];
  if (leftIris && rightIris) {
    return {
      x: (leftIris.x + rightIris.x) / 2,
      y: (leftIris.y + rightIris.y) / 2,
      z: (leftIris.z + rightIris.z) / 2,
    };
  }
  return { x: 0.5, y: 0.5, z: 0 };
}

// ==================== HELPER: EMOTION CLASSIFICATION (7 lớp) ====================
function classifyEmotion(faceLandmarks: Landmark[]): Emotion {
  if (!faceLandmarks || faceLandmarks.length < 478) return 'neutral';
  const mouthLeft = faceLandmarks[61];
  const mouthRight = faceLandmarks[291];
  const mouthTop = faceLandmarks[13];
  const mouthBottom = faceLandmarks[14];
  const leftEyebrow = faceLandmarks[65];
  const rightEyebrow = faceLandmarks[295];
  if (!mouthLeft || !mouthRight || !mouthTop || !mouthBottom) return 'neutral';

  const mouthWidth = Math.hypot(mouthRight.x - mouthLeft.x, mouthRight.y - mouthLeft.y);
  const mouthHeight = Math.hypot(mouthBottom.y - mouthTop.y, mouthBottom.x - mouthTop.x);
  const mouthAspect = mouthHeight / (mouthWidth + 0.001);
  const leftEye = faceLandmarks[33];
  const rightEye = faceLandmarks[263];
  const browRaise = leftEyebrow && leftEye ? leftEyebrow.y - leftEye.y : 0;

  if (mouthAspect > 0.5) return 'surprised';
  if (mouthAspect > 0.25 && browRaise < -0.02) return 'happy';
  if (mouthAspect < 0.15 && browRaise > 0.02) return 'sad';
  if (browRaise > 0.05 && mouthAspect < 0.2) return 'angry';
  if (browRaise > 0.04 && mouthAspect < 0.18) return 'fearful';
  if (mouthAspect < 0.12 && browRaise > 0.01) return 'disgusted';
  return 'neutral';
}

// ==================== HELPER: HEAD STABILITY ====================
function calculateHeadStability(faceLandmarks: Landmark[]): number {
  if (!faceLandmarks || faceLandmarks.length < 4) return 0.5;
  const noseTip = faceLandmarks[1];
  if (!noseTip) return 0.5;
  return 1 - Math.abs(noseTip.x - 0.5);
}

// ==================== HELPER: ATTENTION SCORE ====================
function computeAttentionScore(windowData: BehavioralFeature[]): number {
  if (windowData.length < 2) return 0.5;

  let gazeChanges = 0;
  for (let i = 1; i < windowData.length; i++) {
    const prev = windowData[i - 1];
    const curr = windowData[i];
    let dx = 0, dy = 0;
    if (curr.gaze && prev.gaze) {
      dx = curr.gaze.x - prev.gaze.x;
      dy = curr.gaze.y - prev.gaze.y;
    } else {
      dx = (curr.gazeX ?? 0.5) - (prev.gazeX ?? 0.5);
      dy = (curr.gazeY ?? 0.5) - (prev.gazeY ?? 0.5);
    }
    gazeChanges += Math.hypot(dx, dy);
  }
  const gazeStability = Math.max(0, 1 - gazeChanges / windowData.length);

  const headStability = windowData.reduce((acc, f) => acc + (f.headStability ?? 0.5), 0) / windowData.length;
  const faceConfidence = windowData.reduce((acc, f) => acc + f.faceConfidence, 0) / windowData.length;
  const speaking = windowData.reduce((acc, f) => acc + (f.audioFeatures?.vad ? 1 : 0), 0) / windowData.length;
  const speakingPenalty = 1 - speaking * 0.3;

  return (gazeStability * 0.4 + headStability * 0.3 + faceConfidence * 0.2) * speakingPenalty;
}

// ==================== INFERENCE SERVICE ====================
class InferenceService {
  private videoElement: HTMLVideoElement | null = null;
  private isProcessing = false;
  private behavioralWindow: BehavioralFeature[] = [];
  private readonly WINDOW_SIZE = 30;
  private audioAnalyzer = new AudioAnalyzer();
  private processingInterval: NodeJS.Timeout | null = null;

  async initialize(videoElement: HTMLVideoElement): Promise<boolean> {
    this.videoElement = videoElement;
    const cameraReady = await cameraService.startCamera(videoElement);
    if (!cameraReady) return false;

    try {
      await poseDetectionService.initialize(videoElement, this.onMediaPipeResults.bind(this));
    } catch {
      return false;
    }

    await this.audioAnalyzer.initialize();
    return true;
  }

  private onMediaPipeResults(results: MediaPipeResults) {
    if (!this.isProcessing) return;

    const gazeVector = results.face ? estimateGazeVector(results.face.landmarks) : undefined;
    const emotion = results.face ? classifyEmotion(results.face.landmarks) : 'neutral';
    const headStability = results.face ? calculateHeadStability(results.face.landmarks) : 0.5;

    // Tạo feature với đầy đủ các trường (bao gồm cả cũ và mới)
    const feature: BehavioralFeature = {
      timestamp: results.timestamp,

      // Các trường bắt buộc cũ
      gazeX: gazeVector?.x ?? 0.5,
      gazeY: gazeVector?.y ?? 0.5,
      frownIntensity: 0,
      poseConfidence: results.pose?.score || 0,
      faceConfidence: results.pose?.score || 0,
      smileIntensity: 0,
      affect: emotion,
      attentionLevel: 0.5, // sẽ tính sau

      // Trường mới
      faceLandmarks: results.face?.landmarks || [],
      poseLandmarks: results.pose?.landmarks || [],
      handLandmarks: results.hands.map(h => h.landmarks),
      handConfidence: results.hands.length > 0 ? 0.8 : 0,
      gaze: gazeVector,
      headStability,
      audioFeatures: this.audioAnalyzer.getFeatures() || undefined,

      // Các trường optional có thể bỏ qua
    };

    this.behavioralWindow.push(feature);
    if (this.behavioralWindow.length > this.WINDOW_SIZE) {
      this.behavioralWindow.shift();
    }
  }

  startContinuousInference(onResult: (result: InferenceResult) => void, intervalMs = 500) {
    if (this.isProcessing) return;
    this.isProcessing = true;
    poseDetectionService.start().catch(console.error);

    this.processingInterval = setInterval(async () => {
      if (this.behavioralWindow.length >= 5) {
        const result = await this.processStreamingData([...this.behavioralWindow]);
        onResult(result);
      }
    }, intervalMs);
  }

  async processStreamingData(windowData: BehavioralFeature[]): Promise<InferenceResult> {
    const latest = windowData[windowData.length - 1];
    const attentionScore = computeAttentionScore(windowData);

    const emotionCounts: Record<string, number> = {};
    windowData.forEach(f => {
      if (f.affect) emotionCounts[f.affect] = (emotionCounts[f.affect] || 0) + 1;
    });
    const dominantEmotion = (Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral') as Emotion;

    const tags: string[] = [];
    if (attentionScore > 0.7) tags.push('focused');
    else if (attentionScore < 0.3) tags.push('distracted');
    else tags.push('neutral_attention');

    if (latest.gaze && (latest.gaze.x < 0.3 || latest.gaze.x > 0.7)) tags.push('off_center_gaze');
    if (latest.handLandmarks?.length) tags.push('hand_movement');
    if (latest.audioFeatures?.vad) tags.push('speaking');

    return {
      score: Math.round(attentionScore * 100) / 10,
      confidence: latest.faceConfidence || 0.5,
      patternId: `live-${Date.now()}`,
      explanation: `Dominant emotion: ${dominantEmotion}, Attention: ${attentionScore.toFixed(2)}`,
      behavioralTags: tags,
      features: {
        gazeStability: attentionScore,
        windowSize: windowData.length,
        hasFaceData: windowData.some(f => (f.faceLandmarks?.length || 0) > 0),
        timestamp: Date.now(),
        dominantEmotion,
        avgAttention: attentionScore,
      },
    };
  }

  stopContinuousInference(): void {
    this.isProcessing = false;
    if (this.processingInterval) clearInterval(this.processingInterval);
    poseDetectionService.stop();
  }

  dispose(): void {
    this.stopContinuousInference();
    cameraService.stopCamera();
    this.audioAnalyzer.dispose();
    this.videoElement = null;
    this.behavioralWindow = [];
  }
}

export default new InferenceService();