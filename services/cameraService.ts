export class CameraService {
  private stream: MediaStream | null = null;

  async startCamera(
    videoElement: HTMLVideoElement,
    constraints: MediaStreamConstraints = { 
      video: { 
        width: { ideal: 320, max: 640 },
        height: { ideal: 240, max: 480 },
        facingMode: 'user',
        frameRate: { ideal: 15, max: 30 }
      } 
    }
  ): Promise<boolean> {
    try {
      // FIX: Thử constraints linh hoạt
      this.stream = await navigator.mediaDevices.getUserMedia(constraints)
        .catch(async () => {
          // Fallback constraints đơn giản
          return await navigator.mediaDevices.getUserMedia({
            video: true
          });
        });
      
      if (!this.stream) {
        console.warn('Camera stream không khả dụng');
        return false;
      }
      
      videoElement.srcObject = this.stream;
      
      // FIX: Chờ video ready với timeout
      return new Promise((resolve) => {
        const onReady = () => {
          videoElement.play().catch(e => console.warn('Auto-play prevented:', e));
          resolve(true);
        };
        
        if (videoElement.readyState >= 2) {
          onReady();
        } else {
          videoElement.onloadedmetadata = onReady;
          
          // Timeout sau 3 giây
          setTimeout(() => {
            videoElement.onloadedmetadata = null;
            console.warn('Camera timeout, proceeding with available stream');
            resolve(false); // Vẫn cho phép tiếp tục nhưng không có camera
          }, 3000);
        }
      });
    } catch (error) {
      console.error('Camera access failed:', error);
      return false;
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  async switchCamera(videoElement: HTMLVideoElement) {
    this.stopCamera();
    
    const currentConstraints = this.stream?.getVideoTracks()[0]?.getConstraints();
    const facingMode = currentConstraints?.facingMode === 'user' ? 'environment' : 'user';
    
    return this.startCamera(videoElement, {
      video: { 
        width: { ideal: 320, max: 640 },
        height: { ideal: 240, max: 480 },
        facingMode 
      }
    });
  }
}

export default new CameraService();