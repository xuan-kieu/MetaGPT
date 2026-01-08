// Hiện tại đang là Mock Service thay thế cho MediaPipe nặng nề
export class SimplePoseService {
  private isInitialized = false;
  
  async initialize() {
    console.log('SimplePoseService: Initialized (Lightweight Mode)');
    this.isInitialized = true;
    return true;
  }

  // Giả lập trả về keypoints
  async estimatePose(videoElement: HTMLVideoElement) {
    if (!this.isInitialized) await this.initialize();

    // TODO: Sau này thay thế bằng tfjs-models/pose-detection (MoveNet Lightning)
    // Hiện tại trả về dữ liệu giả lập để flow không bị crash
    return {
      keypoints: Array.from({ length: 33 }, (_, i) => ({
        x: 0.5 + (Math.random() * 0.05), // Random jitter nhẹ
        y: 0.5 + (Math.random() * 0.05),
        name: `point_${i}`,
        score: 0.8
      })),
      score: 0.8,
      timestamp: Date.now()
    };
  }

  dispose() {
    this.isInitialized = false;
  }
}

const instance = new SimplePoseService();
export default instance;