// components/Assessment/AssessmentPrep.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, Wifi, Shield, AlertCircle, Play, CheckCircle2, Loader2 } from 'lucide-react';
import cameraService from '../../services/cameraService';

interface AssessmentPrepProps {
  /** Callback được gọi khi người dùng nhấn "BẮT ĐẦU ĐÁNH GIÁ" và camera/mic đã sẵn sàng */
  onStartAssessment: () => void;
  /** Tên của trẻ (hiển thị để cá nhân hóa) */
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

  // Kiểm tra thiết bị
  const handleCheckDevices = async () => {
    setIsChecking(true);
    
    if (videoRef.current) {
      const cameraActive = await cameraService.startCamera(videoRef.current);
      let micActive = false;
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micActive = true;
        audioStream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error("❌ Mic access denied:", err);
      }

      setStatus(prev => ({
        ...prev,
        camera: cameraActive,
        mic: micActive,
        input: true,
      }));
    }
    
    setIsChecking(false);
  };

  // Bắt đầu đánh giá thật sự
  const handleStartAssessment = () => {
    if (status.camera && status.mic) {
      onStartAssessment(); // 👈 gọi callback, không điều hướng trực tiếp
    }
  };

  // Dọn dẹp camera khi component unmount
  useEffect(() => {
    return () => {
      cameraService.stopCamera();
    };
  }, []);

  const canStart = status.camera && status.mic;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-2xl rounded-3xl my-8 border border-gray-100">
      {/* HEADER */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">
          Bước 2: Chuẩn bị đánh giá
        </h2>
        <p className="text-slate-500 mt-2 font-medium">
          {childName ? `Xin chào ${childName}! ` : ''}
          Đảm bảo mọi thứ sẵn sàng để thu thập dữ liệu chính xác
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CỘT 1: CAMERA PREVIEW & CHECKLIST */}
        <div className="lg:col-span-1 space-y-6">
          <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border-4 border-slate-100 shadow-inner group">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className={`w-full h-full object-cover ${status.camera ? 'opacity-100' : 'opacity-0'}`}
            />
            {!status.camera && !isChecking && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <Camera size={48} className="mb-2 opacity-20" />
                <p className="text-xs italic">Nhấn nút bên dưới để bật camera kiểm tra</p>
              </div>
            )}
            {isChecking && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                <Loader2 className="animate-spin text-white" size={32} />
              </div>
            )}
            <div className="absolute top-3 left-3">
               <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${status.camera ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                  {status.camera ? 'Live' : 'Offline'}
               </span>
            </div>
          </div>

          <section className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-blue-600" /> Trạng thái thiết bị
            </h3>
            <div className="space-y-2">
              <StatusItem icon={<Camera size={16}/>} label="Camera" active={status.camera} />
              <StatusItem icon={<Mic size={16}/>} label="Micro" active={status.mic} />
              <StatusItem icon={<Wifi size={16}/>} label="Internet" active={status.internet} />
            </div>
            
            <button 
              onClick={handleCheckDevices}
              disabled={isChecking}
              className="w-full mt-4 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
            >
              {isChecking ? <Loader2 className="animate-spin" size={16} /> : "KIỂM TRA THIẾT BỊ"}
            </button>
          </section>
        </div>

        {/* CỘT 2: HƯỚNG DẪN & CAM KẾT */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
            <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
               Môi trường
            </h3>
            <ul className="space-y-4">
              <EnvStep text="Phòng yên tĩnh, đủ ánh sáng" />
              <EnvStep text="Trẻ ngồi cách màn hình 40-60cm" />
              <EnvStep text="Camera ở ngang tầm mắt trẻ" />
              <EnvStep text="Phụ huynh ngồi phía sau, không can thiệp" />
            </ul>
          </section>

          <section className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
            <h3 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
              <Shield size={20} /> Cam kết
            </h3>
            <div className="text-sm text-amber-800/80 leading-relaxed space-y-2">
              <p>• Công cụ sàng lọc, không thay thế chẩn đoán.</p>
              <p>• Dữ liệu được mã hóa và bảo mật tuyệt đối.</p>
              <p>• Có thể dừng bất cứ lúc nào.</p>
            </div>
          </section>
        </div>

        {/* CỘT 3: MA TRẬN DỮ LIỆU */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg h-full border border-slate-800">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-4 border-b border-slate-700">
              <h3 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={14} className="text-blue-400" /> Ma trận đa phương thức
              </h3>
            </div>
            <div className="p-2 overflow-y-auto">
              <table className="w-full text-[10px] text-slate-400">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="p-2 text-left">Nguồn</th>
                    <th className="p-2 text-left">Dữ liệu</th>
                    <th className="p-2 text-right">Freq</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <MatrixRow label="Webcam" desc="468 mặt, 21 tay, tư thế, ánh mắt" freq="30fps" />
                  <MatrixRow label="Micro" desc="MFCCs, Pitch, VAD, Emotion" freq="16kHz" />
                  <MatrixRow label="Tương tác" desc="Phản ứng, click, đường chuột" freq="Event" />
                  <MatrixRow label="Metadata" desc="Thời gian, session info" freq="Session" />
                </tbody>
              </table>
              <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
                 <p className="text-[9px] text-slate-500 italic">
                   Công nghệ: MediaPipe, OpenCV, PyTorch, Librosa
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER ACTION */}
      <div className="mt-12 flex flex-col items-center border-t border-gray-100 pt-8">
        {!canStart && (
          <p className="text-red-500 text-sm mb-4 font-medium flex items-center gap-2">
            <AlertCircle size={16} /> Vui lòng kiểm tra và cấp quyền Camera/Micro để tiếp tục
          </p>
        )}
        <button 
          onClick={handleStartAssessment}
          className={`group relative flex items-center gap-3 px-16 py-5 rounded-full font-black text-xl shadow-2xl transition-all transform hover:scale-105 ${
            canStart 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
          disabled={!canStart}
        >
          <Play size={24} fill={canStart ? "white" : "none"} /> BẮT ĐẦU ĐÁNH GIÁ
          {canStart && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

// ==================== SUB-COMPONENTS ====================
const StatusItem = ({ icon, label, active }: { icon: React.ReactNode; label: string; active: boolean }) => (
  <div className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${active ? 'bg-green-50 border-green-100' : 'bg-white border-slate-100'}`}>
    <div className="flex items-center gap-2">
      <div className={`${active ? 'text-green-600' : 'text-slate-400'}`}>{icon}</div>
      <span className={`text-xs font-bold ${active ? 'text-green-700' : 'text-slate-500'}`}>{label}</span>
    </div>
    {active ? <CheckCircle2 size={16} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>}
  </div>
);

const EnvStep = ({ text }: { text: string }) => (
  <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
    {text}
  </li>
);

const MatrixRow = ({ label, desc, freq }: { label: string; desc: string; freq: string }) => (
  <tr>
    <td className="p-2 font-bold text-slate-300">{label}</td>
    <td className="p-2 text-slate-500">{desc}</td>
    <td className="p-2 text-right font-mono text-blue-400">{freq}</td>
  </tr>
);

export default AssessmentPrep;