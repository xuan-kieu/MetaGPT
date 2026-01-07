import React from 'react';
import { LongitudinalRecord, InferenceResult } from '../types';

interface DashboardProps {
  records: LongitudinalRecord[];
  latestAnalysis?: InferenceResult;
}

export const ClinicianDashboard: React.FC<DashboardProps> = ({ 
  records, 
  latestAnalysis 
}) => {
  // FIX: Sử dụng metrics thay vì riskScore (theo đúng type definition)
  const getLastRecordValue = () => {
    if (records.length === 0) return 0;
    const lastRecord = records[records.length - 1];
    const metrics = lastRecord.metrics;
    // Tính score trung bình từ các metrics
    const values = Object.values(metrics) as number[]; 
    
    const total = values.reduce((sum, val) => sum + val, 0);
    return total / values.length;
  };

  const displayScore = latestAnalysis
    ? (latestAnalysis.confidence * 100).toFixed(1) // Scale 0-100
    : (records.length > 0 ? getLastRecordValue().toFixed(1) : '--');

  const displayExplanation = latestAnalysis 
    ? latestAnalysis.explanation 
    : "Complete a session to generate insights";

  const confidence = latestAnalysis 
    ? Math.round(latestAnalysis.confidence * 100) 
    : 0;

  // FIX: Tạo dữ liệu biểu đồ thực từ records
  const generateChartData = () => {
    if (records.length === 0) return [];
    return records.map((record, index) => ({
      x: index,
      y: getRecordValue(record),
      date: new Date(record.timestamp).toLocaleDateString()
    }));
  };

  const getRecordValue = (record: LongitudinalRecord) => {
    const metrics = record.metrics;
    const values = Object.values(metrics);
    return values.length > 0 ? values.reduce((a, b) => a + b) / values.length : 0;
  };

  const chartData = generateChartData();

  return (
    <div className="dashboard-grid">
      {/* Biểu đồ với dữ liệu thực */}
      <div className="card">
        <div className="card-header">
          <h3>Longitudinal Behavioral Index</h3>
          <p>Temporal variance tracking across sessions</p>
        </div>
        
        <div style={{ width: '100%', height: '300px', position: 'relative' }}>
          {/* Grid lines */}
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            pointerEvents: 'none' 
          }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                style={{ 
                  borderBottom: '1px dashed #f1f5f9', 
                  flex: 1 
                }}
              />
            ))}
          </div>

          <svg 
            viewBox="0 0 800 300" 
            style={{ width: '100%', height: '100%', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5}/>
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            {/* Vẽ đường thực từ dữ liệu */}
            {chartData.length > 1 && (
              <>
                <path 
                  d={`M ${chartData.map((point, i) => 
                    `${40 + i * (760 / (chartData.length - 1))},${250 - point.y * 200}`
                  ).join(' L ')}`}
                  fill="none" 
                  stroke="#6366f1" 
                  strokeWidth="4" 
                  strokeLinecap="round"
                />
                {/* Area fill */}
                <path 
                  d={`M ${chartData.map((point, i) => 
                    `${40 + i * (760 / (chartData.length - 1))},${250 - point.y * 200}`
                  ).join(' L ')} L 760,300 L 40,300 Z`}
                  fill="url(#purpleGradient)" 
                  style={{ opacity: 0.3 }}
                />
                
                {/* Data points */}
                {chartData.map((point, i) => (
                  <circle
                    key={i}
                    cx={40 + i * (760 / (chartData.length - 1))}
                    cy={250 - point.y * 200}
                    r="4"
                    fill="#6366f1"
                    stroke="white"
                    strokeWidth="2"
                  />
                ))}
              </>
            )}
          </svg>

          {/* X Axis Labels */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '10px', 
            fontSize: '0.75rem', 
            color: '#94a3b8' 
          }}>
            {chartData.length > 0 && (
              <>
                <span>{chartData[0].date}</span>
                {chartData.length > 1 && (
                  <span>{chartData[Math.floor(chartData.length / 2)].date}</span>
                )}
                <span>{chartData[chartData.length - 1].date}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Phần bên phải - giữ nguyên */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* AI Analysis Card */}
        <div className="card" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          minHeight: '240px' 
        }}>
          <div className="card-header">
            <h3>AI Behavioral Analysis</h3>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#94a3b8',
              marginTop: '0.25rem' 
            }}>
              Using MediaPipe Pose + Face Landmarks
            </div>
          </div>

          {!latestAnalysis ? (
            <div className="text-center" style={{ color: '#94a3b8', padding: '2rem 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
              <p style={{ fontSize: '0.875rem' }}>Waiting for session data...</p>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in duration-500">
              <div style={{ 
                display: 'flex', 
                alignItems: 'baseline', 
                gap: '0.5rem', 
                marginBottom: '0.5rem' 
              }}>
                <span style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: 800, 
                  color: '#6366f1' 
                }}>
                  {displayScore}
                </span>
                <span className="tag">Composite Score</span>
              </div>
              
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#475569', 
                lineHeight: 1.6, 
                marginBottom: '1rem' 
              }}>
                {displayExplanation}
              </p>
              
              <div className="confidence-bar">
                <span style={{ color: '#94a3b8' }}>Model Confidence</span>
                <div style={{ 
                  flex: 1, 
                  height: '6px', 
                  background: '#f1f5f9', 
                  margin: '0 1rem', 
                  borderRadius: '3px', 
                  overflow: 'hidden' 
                }}>
                  <div style={{ 
                    width: `${confidence}%`, 
                    height: '100%', 
                    background: '#6366f1', 
                    transition: 'width 1s' 
                  }} />
                </div>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>
                  {confidence}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Privacy Protocol Card */}
        <div className="card privacy-card">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '1.5rem' }}>🛡️</div>
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                Privacy Protocol
              </h4>
              <p style={{ 
                fontSize: '0.75rem', 
                color: '#94a3b8', 
                lineHeight: 1.5 
              }}>
                All behavioral features are extracted on-device using WebAssembly. 
                Zero raw video/audio data transmitted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};