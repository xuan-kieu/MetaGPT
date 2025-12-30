export class CameraService {
  private stream: MediaStream | null = null;

  async startCamera(
    videoElement: HTMLVideoElement,
    constraints: MediaStreamConstraints = { 
      video: { 
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user' 
      } 
    }
  ): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = this.stream;
      
      return new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play();
          resolve(true);
        };
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
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode 
      }
    });
  }
}

export default new CameraService();