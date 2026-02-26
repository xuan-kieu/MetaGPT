// services/poseDetectionService.ts
import { Holistic, POSE_CONNECTIONS, HAND_CONNECTIONS, FACEMESH_TESSELATION } from '@mediapipe/holistic';


// ==================== KIỂU DỮ LIỆU ĐẦU RA (GIỮ NGUYÊN) ====================
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

// ==================== SERVICE CHÍNH VỚI HOLISTIC ====================
class PoseDetectionService {
  private holistic: Holistic | null = null;
  
  // 🔄 Thay thế this.camera bằng các biến quản lý vòng lặp thủ công
  private animationFrameId: number | null = null;
  private isDetecting: boolean = false;
  private isInitialized = false;
  
  private onResultsCallback: ((results: MediaPipeResults) => void) | null = null;
  private videoElement: HTMLVideoElement | null = null;

  /**
   * Khởi tạo MediaPipe Holistic (Tất cả trong 1)
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
      // 1. Khởi tạo duy nhất 1 mô hình Holistic
      this.holistic = new Holistic({
        locateFile: (file) => 
          `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
      });

      // 2. Cấu hình thông số 
      this.holistic.setOptions({
        modelComplexity: 1, 
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        refineFaceLandmarks: true, 
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      // 3. Lắng nghe kết quả tổng hợp
      this.holistic.onResults((res) => this.onHolisticResults(res));

      // 🔄 4. Không dùng new Camera() nữa. Chúng ta chỉ cần khởi tạo Holistic thôi.
      // Dữ liệu sẽ được gửi vào Holistic ở hàm start() bên dưới.

      this.isInitialized = true;
      console.log('✅ PoseDetectionService: MediaPipe Holistic ready');
    } catch (error) {
      console.error('❌ Lỗi khởi tạo MediaPipe Holistic:', error);
      throw error;
    }
  }

  // 🔄 Viết lại hàm start để tự bắt khung hình và gửi cho AI
  async start() {
    if (!this.isInitialized || !this.videoElement) {
      throw new Error('Chưa khởi tạo service. Gọi initialize() trước.');
    }
    
    this.isDetecting = true;
    console.log('📷 AI bắt đầu xử lý khung hình (thủ công)...');

    // Hàm đệ quy tự gọi lại chính nó mỗi khi có khung hình mới
    const processFrame = async () => {
      // Nếu đã bị gọi stop() hoặc component bị tháo gỡ thì ngắt vòng lặp
      if (!this.isDetecting || !this.videoElement || !this.holistic) {
        return;
      }

      // Chỉ gửi frame khi video đang thực sự chạy (đã được CameraService cấp luồng)
      if (this.videoElement.readyState >= 2 && !this.videoElement.paused) {
        try {
          await this.holistic.send({ image: this.videoElement });
        } catch (e) {
          console.warn('Bỏ qua lỗi khung hình bị ngắt:', e);
        }
      }

      // Yêu cầu trình duyệt gọi lại processFrame ở khung hình tiếp theo (thường là 60fps)
      // Lưu lại ID để có thể hủy nó lúc dọn dẹp
      this.animationFrameId = requestAnimationFrame(processFrame);
    };

    // Khởi động vòng lặp ngay bây giờ
    processFrame();
  }

  // 🔄 Cập nhật hàm stop()
  stop() {
    this.isDetecting = false; // Ngăn chặn vòng lặp gửi frame tiếp theo
    
    // Hủy bỏ lịch hẹn chạy frame tiếp theo (nếu có)
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    console.log('🛑 Đã dừng luồng AI gửi frame');
  }

  dispose() {
    this.stop(); // Dừng vòng lặp trước
    
    if (this.holistic) {
      this.holistic.close(); // Đóng hẳn model để giải phóng bộ nhớ (WebGL)
      this.holistic = null;
    }
    
    this.isInitialized = false;
    this.videoElement = null; // Cắt đứt hoàn toàn tham chiếu đến video
    console.log('🧹 PoseDetectionService disposed hoàn toàn');
  }

  // ---------- XỬ LÝ KẾT QUẢ TỪ HOLISTIC  ----------
  private onHolisticResults(results: any) {
    if (!this.isDetecting || !this.onResultsCallback) {
      return;
    }

    const pose: PoseResult | null = results.poseLandmarks
      ? {
          landmarks: results.poseLandmarks.map((lm: any) => ({
            x: lm.x, y: lm.y, z: lm.z, visibility: lm.visibility,
          })),
          score: results.poseLandmarks[0]?.visibility || 0.8,
        }
      : null;

    const hands: HandResult[] = [];
    if (results.leftHandLandmarks) {
      hands.push({
        landmarks: results.leftHandLandmarks.map((lm: any) => ({ x: lm.x, y: lm.y, z: lm.z })),
        handedness: 'Left',
      });
    }
    if (results.rightHandLandmarks) {
      hands.push({
        landmarks: results.rightHandLandmarks.map((lm: any) => ({ x: lm.x, y: lm.y, z: lm.z })),
        handedness: 'Right',
      });
    }

    const face: FaceResult | null = results.faceLandmarks
      ? {
          landmarks: results.faceLandmarks.map((lm: any) => ({ x: lm.x, y: lm.y, z: lm.z })),
        }
      : null;

    const combined: MediaPipeResults = {
      pose,
      hands,
      face,
      timestamp: Date.now(),
    };

    this.onResultsCallback(combined);
  }
}

const poseDetectionService = new PoseDetectionService();
export default poseDetectionService;