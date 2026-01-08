export class CameraService {
  private stream: MediaStream | null = null;

  async startCamera(
    videoElement: HTMLVideoElement,
    constraints: MediaStreamConstraints = { 
      video: { 
        width: { ideal: 640 }, // Tăng ideal lên chút để detection tốt hơn
        height: { ideal: 480 },
        facingMode: 'user',
        frameRate: { ideal: 15, max: 30 }
      } 
    }
  ): Promise<boolean> {
    try {
      // Dừng stream cũ nếu có
      this.stopCamera();

      try {
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn('Constraints ban đầu thất bại, thử cấu hình tối thiểu...', err);
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      
      if (!this.stream) {
        console.warn('Camera stream không khả dụng');
        return false;
      }
      
      videoElement.srcObject = this.stream;
      
      // Promise chờ video thực sự load
      return new Promise((resolve) => {
        const onPlaying = () => {
            videoElement.removeEventListener('playing', onPlaying);
            resolve(true);
        };

        // Nếu video đã ready từ trước
        if (videoElement.readyState >= 3) {
            resolve(true);
        } else {
            videoElement.addEventListener('playing', onPlaying);
            // Backup timeout nếu sự kiện playing không bao giờ fire
            setTimeout(() => {
                if(videoElement.readyState >= 1) resolve(true);
                else resolve(false);
            }, 5000);
        }
        
        videoElement.play().catch(e => console.warn('Auto-play prevented:', e));
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
    const currentStream = this.stream;
    if (!currentStream) return false;

    const currentTrack = currentStream.getVideoTracks()[0];
    const currentConstraints = currentTrack?.getConstraints();
    const currentFacingMode = currentConstraints?.facingMode;
    
    // Toggle facing mode
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    
    return this.startCamera(videoElement, {
      video: { 
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: newFacingMode 
      }
    });
  }
}

export default new CameraService();