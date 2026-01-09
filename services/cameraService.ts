// src/services/cameraService.ts

export class CameraService {
  private stream: MediaStream | null = null;

  async startCamera(
    videoElement: HTMLVideoElement,
    // Cấu hình mặc định linh hoạt hơn
    constraints: MediaStreamConstraints = { 
      video: { 
        width: { ideal: 640 }, // Không bắt buộc cứng
        height: { ideal: 480 },
        facingMode: 'user'     // Camera trước
      },
      audio: false
    }
  ): Promise<boolean> {
    try {
      // 1. Dừng stream cũ nếu có
      this.stopCamera();

      // 2. Thử lấy quyền camera
      console.log('📸 Requesting camera access...');
      try {
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn('⚠️ Constraints ban đầu thất bại, thử cấu hình tối thiểu...', err);
        // Fallback: Chỉ yêu cầu video bất kỳ, không quan tâm độ phân giải
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      
      if (!this.stream) {
        console.error('❌ Không lấy được stream camera');
        return false;
      }
      
      // 3. Gán stream vào video element
      videoElement.srcObject = this.stream;
      videoElement.setAttribute('playsinline', 'true'); // Quan trọng cho iOS
      
      // 4. Chờ video thực sự chạy
      return new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play()
            .then(() => {
              console.log('✅ Camera started successfully');
              resolve(true);
            })
            .catch((e) => {
              console.error('❌ Play failed:', e);
              resolve(false);
            });
        };
      });

    } catch (error) {
      console.error('❌ Camera access denied or error:', error);
      return false;
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }
}

export default new CameraService();