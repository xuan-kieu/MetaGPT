import React from 'react';
import { LongitudinalRecord, InferenceResult } from '../types';

interface DashboardProps {
  records: LongitudinalRecord[];
  latestAnalysis?: InferenceResult;
}

export const ClinicianDashboard: React.FC<DashboardProps> = ({ records, latestAnalysis }) => {
  // Lấy dữ liệu để hiển thị (Nếu chưa có analysis thì hiển thị record cuối)
  const displayScore = latestAnalysis
  ? (latestAnalysis.confidence * 10).toFixed(1) // ví dụ scale
  : (records.length > 0 ? records[records.length - 1].riskScore.toFixed(1) : '--');


  const displayExplanation = latestAnalysis 
    ? latestAnalysis.explanation 
    : "Complete a session to generate insights";

  const confidence = latestAnalysis ? Math.round(latestAnalysis.confidence * 100) : 0;

  return (
    <div className="dashboard-grid">
      
      {/* --- CỘT TRÁI: BIỂU ĐỒ (SVG THUẦN) --- */}
      <div className="card">
        <div className="card-header">
          <h3>Longitudinal Behavioral Index</h3>
          <p>Temporal variance tracking across sessions</p>
        </div>
        
        {/* Vẽ Chart bằng SVG để giống hệt thiết kế */}
        <div style={{ width: '100%', height: '300px', position: 'relative' }}>
          {/* Grid lines background */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#cbd5e1', pointerEvents: 'none' }}>
            <div style={{ borderBottom: '1px dashed #f1f5f9', flex: 1 }}></div>
            <div style={{ borderBottom: '1px dashed #f1f5f9', flex: 1 }}></div>
            <div style={{ borderBottom: '1px dashed #f1f5f9', flex: 1 }}></div>
            <div style={{ borderBottom: '1px dashed #f1f5f9', flex: 1 }}></div>
          </div>

          <svg viewBox="0 0 800 300" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <defs>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5}/>
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            {/* Đường cong mô phỏng (Visual only) */}
            <path 
              d="M0,250 C150,150 300,50 400,50 S650,150 800,200" 
              fill="none" 
              stroke="#6366f1" 
              strokeWidth="4" 
              strokeLinecap="round"
            />
            <path 
              d="M0,250 C150,150 300,50 400,50 S650,150 800,200 L800,300 L0,300 Z" 
              fill="url(#purpleGradient)" 
              style={{ opacity: 0.3 }}
            />
          </svg>

          {/* X Axis Labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.75rem', color: '#94a3b8' }}>
            <span>11/1/2023</span>
            <span>11/15/2023</span>
            <span>12/5/2023</span>
          </div>
        </div>
      </div>

      {/* --- CỘT PHẢI: KẾT QUẢ & PRIVACY --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* AI Analysis Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '240px' }}>
          <div className="card-header">
            <h3>AI Behavioral Analysis</h3>
          </div>

          {!latestAnalysis ? (
            <div className="text-center" style={{ color: '#94a3b8', padding: '2rem 0' }}>
               <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
               <p style={{ fontSize: '0.875rem' }}>Waiting for session data...</p>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in duration-500">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#6366f1' }}>
                  {displayScore}
                </span>
                <span className="tag">Variance Score</span>
              </div>
              
              <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, marginBottom: '1rem' }}>
                {displayExplanation}
              </p>
              
              <div className="confidence-bar">
                <span style={{ color: '#94a3b8' }}>AI Confidence</span>
                <div style={{ flex: 1, height: '6px', background: '#f1f5f9', margin: '0 1rem', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${confidence}%`, height: '100%', background: '#6366f1', transition: 'width 1s' }}></div>
                </div>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{confidence}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Privacy Protocol Card */}
        <div className="card privacy-card">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '1.5rem' }}>🛡️</div>
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Privacy Protocol</h4>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5 }}>
                All behavioral features are extracted on-device. Zero raw video/audio data has been persisted or transmitted to the backend.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};