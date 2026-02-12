// services/poseDetectionService.ts
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { FaceMesh, FACEMESH_TESSELATION } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

// ==================== KIỂU DỮ LIỆU ĐẦU RA ====================
export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseResult {
  landmarks: Landmark[];      // 33 điểm
  score: number;
}

export interface HandResult {
  landmarks: Landmark[];      // 21 điểm / bàn tay
  handedness: 'Left' | 'Right';
}

export interface FaceResult {
  landmarks: Landmark[];      // 468 điểm
}

export interface MediaPipeResults {
  pose: PoseResult | null;
  hands: HandResult[];
  face: FaceResult | null;
  timestamp: number;
}

// ==================== SERVICE CHÍNH ====================
class PoseDetectionService {
  private pose: Pose | null = null;
  private hands: Hands | null = null;
  private faceMesh: FaceMesh | null = null;
  private camera: Camera | null = null;
  private isInitialized = false;
  private onResultsCallback: ((results: MediaPipeResults) => void) | null = null;
  private videoElement: HTMLVideoElement | null = null;

  // Bộ đệm kết quả để đồng bộ 3 nguồn
  private lastPose: any = null;
  private lastHands: any = null;
  private lastFace: any = null;

  /**
   * Khởi tạo MediaPipe với đầy đủ Pose, Hands, FaceMesh
   * @param videoElement - Thẻ video hiển thị camera
   * @param onResults - Callback nhận kết quả tổng hợp mỗi khi có đủ 3 nguồn
   */
  async initialize(
    videoElement: HTMLVideoElement,
    onResults: (results: MediaPipeResults) => void
  ) {
    if (this.isInitialized) {
      console.warn('PoseDetectionService đã được khởi tạo');
      return;
    }

    this.videoElement = videoElement;
    this.onResultsCallback = onResults;

    try {
      // 1. POSE (33 điểm)
      this.pose = new Pose({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
      });
      this.pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      this.pose.onResults((res) => this.onPoseResults(res));

      // 2. HANDS (21 điểm/tay, hỗ trợ 2 tay)
      this.hands = new Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
      });
      this.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      this.hands.onResults((res) => this.onHandsResults(res));

      // 3. FACE MESH (468 điểm)
      this.faceMesh = new FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1675469240/${file}`,
      });
      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true, // thêm các điểm quanh môi, mắt
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      this.faceMesh.onResults((res) => this.onFaceResults(res));

      // 4. Camera utils – gửi frame đến từng solution
      this.camera = new Camera(videoElement, {
        onFrame: async () => {
          if (this.pose) await this.pose.send({ image: videoElement });
          if (this.hands) await this.hands.send({ image: videoElement });
          if (this.faceMesh) await this.faceMesh.send({ image: videoElement });
        },
        width: 640,
        height: 480,
      });

      this.isInitialized = true;
      console.log('✅ PoseDetectionService: MediaPipe ready (pose, hands, face)');
    } catch (error) {
      console.error('❌ Lỗi khởi tạo MediaPipe:', error);
      throw error;
    }
  }

  /**
   * Bắt đầu luồng camera và xử lý
   */
  async start() {
    if (!this.isInitialized || !this.camera) {
      throw new Error('Chưa khởi tạo service. Gọi initialize() trước.');
    }
    await this.camera.start();
    console.log('📷 Camera started – MediaPipe processing');
  }

  /**
   * Dừng camera và giải phóng tài nguyên
   */
  stop() {
    this.camera?.stop();
    this.dispose();
  }

  /**
   * Giải phóng hoàn toàn các solution
   */
  dispose() {
    this.pose?.close();
    this.hands?.close();
    this.faceMesh?.close();
    this.isInitialized = false;
    this.lastPose = null;
    this.lastHands = null;
    this.lastFace = null;
    console.log('🧹 PoseDetectionService disposed');
  }

  // ---------- XỬ LÝ KẾT QUẢ RIÊNG LẺ VÀ ĐỒNG BỘ ----------
  private onPoseResults(results: any) {
    this.lastPose = results;
    this.tryEmitCombined();
  }

  private onHandsResults(results: any) {
    this.lastHands = results;
    this.tryEmitCombined();
  }

  private onFaceResults(results: any) {
    this.lastFace = results;
    this.tryEmitCombined();
  }

  /**
   * Khi có đủ cả 3 nguồn, tổng hợp và gửi callback
   */
  private tryEmitCombined() {
    if (!this.lastPose || !this.lastHands || !this.lastFace) return;
    if (!this.onResultsCallback) return;

    // Pose
    const pose: PoseResult | null = this.lastPose.poseLandmarks
      ? {
          landmarks: this.lastPose.poseLandmarks.map((lm: any) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility,
          })),
          score: this.lastPose.poseLandmarks[0]?.visibility || 0.8,
        }
      : null;

    // Hands
    const hands: HandResult[] = [];
    if (this.lastHands.multiHandLandmarks && this.lastHands.multiHandedness) {
      for (let i = 0; i < this.lastHands.multiHandLandmarks.length; i++) {
        const landmarks = this.lastHands.multiHandLandmarks[i].map((lm: any) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
        }));
        const handedness = this.lastHands.multiHandedness[i]?.label || 'Unknown';
        hands.push({
          landmarks,
          handedness: handedness as 'Left' | 'Right',
        });
      }
    }

    // Face
    const face: FaceResult | null = this.lastFace.multiFaceLandmarks?.[0]
      ? {
          landmarks: this.lastFace.multiFaceLandmarks[0].map((lm: any) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
          })),
        }
      : null;

    const combined: MediaPipeResults = {
      pose,
      hands,
      face,
      timestamp: Date.now(),
    };

    this.onResultsCallback(combined);

    // Reset bộ đệm nếu muốn chỉ emit 1 lần cho mỗi bộ frame
    // Có thể tuỳ chỉnh: nếu muốn emit mỗi khi có frame mới, không reset
    // this.lastPose = null;
    // this.lastHands = null;
    // this.lastFace = null;
  }
}

// Singleton – export instance duy nhất
const poseDetectionService = new PoseDetectionService();
export default poseDetectionService;