// components/Assessment/AssessmentPrep.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, Wifi, Shield, AlertCircle, Play, CheckCircle2, Loader2, User } from 'lucide-react';

interface AssessmentPrepProps {
  onStartAssessment: () => void;
  childName?: string;
}

interface DeviceStatus {
  camera: boolean;
  mic: boolean;
  input: boolean;
  internet: boolean;
}

const AssessmentPrep: React.FC<AssessmentPrepProps> = ({ onStartAssessment, childName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<DeviceStatus>({
    camera: false,
    mic: false,
    input: false,
    internet: navigator.onLine,
  });
  const [isMounted, setIsMounted] = useState(true);

  // Hàm dọn dẹp an toàn
  const cleanupMedia = () => {
    if (videoRef.current) {
      try {
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
          });
        }
        videoRef.current.srcObject = null;
        videoRef.current.load(); // Reset video element
      } catch (err) {
        console.log("Cleanup error (safe to ignore):", err);
      }
    }
  };

  // Kiểm tra thiết bị với cách tiếp cận đơn giản hơn
  const handleCheckDevices = async () => {
    setIsChecking(true);
    
    // Dọn dẹp trước khi kiểm tra mới
    cleanupMedia();

    try {
      // Thử lấy cả camera và mic
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current && isMounted) {
        videoRef.current.srcObject = stream;
        
        // Đợi video sẵn sàng
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadeddata = () => {
              videoRef.current?.play()
                .then(resolve)
                .catch(console.warn);
            };
          }
        });

        setStatus({
          camera: true,
          mic: true,
          input: true,
          internet: navigator.onLine,
        });
      }
    } catch (err) {
      console.log("Không thể lấy cả camera và mic:", err);
      
      // Thử chỉ lấy camera
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        if (videoRef.current && isMounted) {
          videoRef.current.srcObject = videoStream;
          
          await new Promise((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadeddata = () => {
                videoRef.current?.play()
                  .then(resolve)
                  .catch(console.warn);
              };
            }
          });

          setStatus({
            camera: true,
            mic: false,
            input: true,
            internet: navigator.onLine,
          });
        }
      } catch (videoErr) {
        console.error("Không thể lấy camera:", videoErr);
        if (isMounted) {
          setStatus({
            camera: false,
            mic: false,
            input: false,
            internet: navigator.onLine,
          });
        }
      }
    } finally {
      if (isMounted) {
        setIsChecking(false);
      }
    }
  };

  // Bắt đầu đánh giá
  const handleStartAssessment = () => {
    if (status.camera && status.mic) {
      onStartAssessment();
    }
  };

  // Xử lý unmount an toàn
  useEffect(() => {
    setIsMounted(true);
    
    return () => {
      setIsMounted(false);
      // Dùng setTimeout để tránh xung đột với React cleanup
      setTimeout(cleanupMedia, 0);
    };
  }, []);

  const canStart = status.camera && status.mic;

  return (
    <div className="assessment-container">
      <style>{`
        /* CSS giữ nguyên như cũ */
        .assessment-container {
          --primary: #4f46e5;
          --primary-dark: #1e1b4b;
          --success: #22c55e;
          --warning: #f59e0b;
          --danger: #ef4444;
          max-width: 1200px;
          margin: 2rem auto;
          padding: 2rem;
          background: #fff;
          border-radius: 2rem;
          box-shadow: 0 20px 50px rgba(0,0,0,0.1);
          font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
        }

        .header-banner {
          background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%);
          margin: -2rem -2rem 2rem -2rem;
          padding: 2rem 2rem;
          border-radius: 2rem 2rem 0 0;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .user-badge-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          padding: 0.75rem 1.5rem 0.75rem 1.5rem;
          border-radius: 60px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .role-tag {
          font-size: 10px;
          background: var(--warning);
          color: var(--primary-dark);
          padding: 2px 8px;
          border-radius: 20px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .prep-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.9fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .prep-card {
          background: white;
          border-radius: 1.5rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #eef2f6;
          transition: all 0.2s ease;
        }

        .status-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .status-item-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: #f8fafc;
          border-radius: 1rem;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .status-item-box.active {
          background: #f0fdf4;
          border-color: var(--success);
          color: #166534;
        }

        .video-preview-container {
          position: relative;
          aspect-ratio: 16/9;
          background: var(--primary-dark);
          border-radius: 1rem;
          overflow: hidden;
          margin: 1.5rem 0;
          border: 3px solid #e2e8f0;
        }

        .video-element {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .btn-check {
          width: 100%;
          padding: 1rem;
          background: white;
          border: 2px solid var(--primary);
          color: var(--primary);
          border-radius: 0.75rem;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-check:hover:not(:disabled) {
          background: #eef2ff;
        }

        .btn-check:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-start {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1.5rem 4rem;
          border-radius: 60px;
          font-weight: 800;
          font-size: 1.5rem;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .btn-start.enabled {
          background: var(--primary);
          color: white;
        }

        .btn-start.enabled:hover {
          background: var(--primary-dark);
          transform: scale(1.05);
        }

        .btn-start.disabled {
          background: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .matrix-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .matrix-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 8px;
          font-size: 0.75rem;
          min-width: 280px;
        }

        .matrix-table th {
          text-align: left;
          color: #1e293b;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
        }

        .matrix-table td {
          padding: 0.5rem;
          border-bottom: 1px dashed #e2e8f0;
        }

        .freq-tag {
          background: var(--primary-dark);
          color: #e0e7ff;
          padding: 0.25rem 0.5rem;
          border-radius: 20px;
          font-family: monospace;
          font-size: 0.7rem;
          white-space: nowrap;
        }

        .freq-tag.green {
          background: #059669;
          color: #d1fae5;
        }

        @media (max-width: 1024px) {
          .prep-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .header-banner {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .btn-start {
            width: 100%;
            padding: 1rem;
            font-size: 1.25rem;
          }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }

        .pulse-dot {
          position: absolute;
          top: -5px;
          right: -5px;
          width: 12px;
          height: 12px;
          background: var(--primary);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>

      {/* HEADER BANNER */}
      <header className="header-banner">
        <div>
          <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800 }}>Bệnh lý thần kinh</h1>
          <p style={{ opacity: 0.8, margin: '5px 0 0 0', fontSize: '1rem' }}>Hệ thống phân tích đa phương thức AI</p>
        </div>
        <div className="user-badge-card">
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>Xin chào,</p>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1rem' }}>{childName || "Trần Ngọc 5001"}</p>
            <span className="role-tag">Phụ huynh</span>
          </div>
          <div style={{ width: 45, height: 45, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={24} />
          </div>
        </div>
      </header>

      <div className="prep-grid">
        {/* CỘT 1: THIẾT BỊ */}
        <div className="prep-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', color: '#1e293b', margin: '0 0 1rem 0' }}>
            <Camera size={18} color="#4f46e5" /> Trạng thái thiết bị
          </h3>
          
          <div className="status-list">
            <StatusItem 
              icon={<Camera size={16} />} 
              label="Máy ảnh" 
              active={status.camera} 
            />
            <StatusItem 
              icon={<Mic size={16} />} 
              label="Micro" 
              active={status.mic} 
            />
            <StatusItem 
              icon={<Wifi size={16} />} 
              label="Internet" 
              active={status.internet} 
            />
          </div>

          <div className="video-preview-container">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className="video-element"
            />
            {!status.camera && !isChecking && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <Camera size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>Nhấn nút bên dưới để bật camera</p>
              </div>
            )}
            {isChecking && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)' }}>
                <Loader2 className="animate-spin" color="#4f46e5" size={32} />
              </div>
            )}
          </div>

          <button 
            onClick={handleCheckDevices} 
            disabled={isChecking} 
            className="btn-check"
          >
            {isChecking ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                ĐANG KIỂM TRA...
              </>
            ) : "KIỂM TRA THIẾT BỊ"}
          </button>
        </div>

        {/* CỘT 2: HƯỚNG DẪN & CAM KẾT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <section className="prep-card" style={{ background: '#f0fdf4', borderColor: '#dcfce7' }}>
            <h3 style={{ color: '#166534', margin: '0 0 1rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} /> Môi trường
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <EnvStep text="Phòng yên tĩnh, đủ ánh sáng" />
              <EnvStep text="Trẻ ngồi cách màn hình 40-60cm" />
              <EnvStep text="Camera ngang tầm mắt trẻ" />
              <EnvStep text="Phụ huynh ngồi phía sau, không can thiệp" />
            </ul>
          </section>

          <section className="prep-card" style={{ background: '#eff6ff', borderColor: '#dbeafe' }}>
            <h3 style={{ color: '#1e40af', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
              <Shield size={18} /> Cam kết
            </h3>
            <div style={{ fontSize: '0.875rem', color: '#1e3a8a', lineHeight: '1.6' }}>
              <p style={{ margin: '0.3rem 0' }}>• Công cụ sàng lọc, không thay thế chẩn đoán.</p>
              <p style={{ margin: '0.3rem 0' }}>• Dữ liệu được mã hóa và bảo mật tuyệt đối.</p>
              <p style={{ margin: '0.3rem 0' }}>• Có thể dừng bất cứ lúc nào.</p>
            </div>
          </section>
        </div>

        {/* CỘT 3: MA TRẬN */}
        <div className="prep-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.2rem', background: '#1e1b4b', color: 'white' }}>
            <h3 style={{ margin: 0, fontSize: '0.875rem', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={14} color="#818cf8" /> Ma trận đa phương thức
            </h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div className="matrix-wrapper">
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th>Nguồn</th>
                    <th>Dữ liệu</th>
                    <th style={{ textAlign: 'right' }}>Freq</th>
                  </tr>
                </thead>
                <tbody>
                  <MatrixRow label="Thị giác" desc="468 mặt, 21 tay, tư thế" freq="30fps" />
                  <MatrixRow label="Micro" desc="MFCCs, Pitch, VAD" freq="16kHz" isGreen />
                  <MatrixRow label="Tương tác" desc="Click & chuột, phản ứng" freq="Event" />
                  <MatrixRow label="Metadata" desc="Thời gian, session" freq="Session" isGreen />
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.75rem' }}>
              <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0, fontStyle: 'italic' }}>
                Công nghệ: MediaPipe, PyTorch, OpenCV, Librosa
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER ACTION */}
      <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
        {!canStart && (
          <p style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} /> Vui lòng cấp quyền Camera/Micro để tiếp tục
          </p>
        )}
        <button 
          onClick={handleStartAssessment} 
          disabled={!canStart} 
          className={`btn-start ${canStart ? 'enabled' : 'disabled'}`}
        >
          <Play size={24} fill={canStart ? "white" : "none"} /> 
          BẮT ĐẦU ĐÁNH GIÁ
          {canStart && <span className="pulse-dot" />}
        </button>
      </div>
    </div>
  );
};

// Sub-components
const StatusItem = ({ icon, label, active }: { icon: React.ReactNode; label: string; active: boolean }) => (
  <div className={`status-item-box ${active ? 'active' : ''}`}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {icon} 
      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{label}</span>
    </div>
    {active ? 
      <CheckCircle2 size={16} color="#22c55e" /> : 
      <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #cbd5e1' }} />
    }
  </div>
);

const EnvStep = ({ text }: { text: string }) => (
  <li style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.75rem', 
    fontSize: '0.875rem', 
    marginBottom: '0.75rem', 
    fontWeight: 500,
    color: '#334155'
  }}>
    <div style={{ 
      width: '0.5rem', 
      height: '0.5rem', 
      borderRadius: '50%', 
      background: '#10b981',
      boxShadow: '0 0 0 2px rgba(16,185,129,0.2)'
    }} /> 
    {text}
  </li>
);

const MatrixRow = ({ label, desc, freq, isGreen }: { label: string; desc: string; freq: string; isGreen?: boolean }) => (
  <tr>
    <td style={{ fontWeight: 600, color: '#1e293b' }}>{label}</td>
    <td style={{ color: '#64748b' }}>{desc}</td>
    <td style={{ textAlign: 'right' }}>
      <span className={`freq-tag ${isGreen ? 'green' : ''}`}>{freq}</span>
    </td>
  </tr>
);

export default AssessmentPrep;