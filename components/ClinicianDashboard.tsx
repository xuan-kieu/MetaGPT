import React, { useMemo } from 'react';
import { InferenceResult, LongitudinalRecord } from '../types';

interface DashboardProps {
  records: LongitudinalRecord[];
  latestAnalysis?: InferenceResult;
}

export const ClinicianDashboard: React.FC<DashboardProps> = ({ 
  records = [], 
  latestAnalysis 
}) => {
  
  const getLastRecord = () => records.length > 0 ? records[records.length - 1] : null;
  const lastRecord = getLastRecord();
  const currentMetrics = useMemo(() => {
    if (latestAnalysis && latestAnalysis.features) {
      return {
        attention: Number(latestAnalysis.features.avgAttention) || 0,
        smile: Number(latestAnalysis.features.avgSmile) || 0,
        stability: Number(latestAnalysis.features.gazeStability) || 0,
        engagement: Number(latestAnalysis.features.engagementLevel) || 0
      };
    } 
    else if (lastRecord && lastRecord.metrics) {
      return {
        attention: Number(lastRecord.metrics.attention) || 0,
        smile: Number(lastRecord.metrics.smile) || 0,
        stability: Number(lastRecord.metrics.gazeStability) || 0,
        engagement: Number(lastRecord.metrics.engagement) || 0 
      };
    }
    return { attention: 0, smile: 0, stability: 0, engagement: 0 };
  }, [latestAnalysis, lastRecord]);

  const displayScore = latestAnalysis 
    ? latestAnalysis.score.toFixed(1) 
    : (lastRecord ? lastRecord.riskScore.toFixed(1) : '--');

  const displayExplanation = latestAnalysis 
    ? latestAnalysis.explanation 
    : "Complete a session to generate insights";
  const chartConfig = useMemo(() => {
    if (!records || records.length === 0) return { data: [], maxVal: 10 };

    const data = records.map((record, index) => ({
      x: index,
      y: record.riskScore, 
      date: new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }));

    const maxVal = Math.max(...data.map(d => d.y), 10);

    return { data, maxVal };
  }, [records]);

  const MetricItem = ({ label, value, icon, color }: any) => (
    <div className="metric-item">
      <div className="metric-header">
        <span className="metric-label">{icon} {label}</span>
        <span className="metric-value">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="metric-track">
        <div 
          className="metric-fill" 
          style={{ width: `${value * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );

  return (
    <div className="dashboard-grid">
      {/* Cột Trái: Biểu đồ & Metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Chart Card */}
        <div className="card">
          <div className="card-header">
            <h3>Longitudinal Index</h3>
            <p>Temporal variance tracking across sessions</p>
          </div>
          
          {/* FIX: Thêm overflow: hidden để cắt phần thừa nếu có */}
          <div style={{ width: '100%', height: '200px', position: 'relative', overflow: 'hidden' }}>
            <svg viewBox="0 0 800 250" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5}/>
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              {chartConfig.data.length > 0 ? (
                <>
                  {/* CÔNG THỨC MỚI:
                    Y = 230 - (Giá trị / Max_Giá_Trị) * 200
                    Điều này đảm bảo điểm cao nhất luôn nằm ở đỉnh (Y=30) và thấp nhất ở đáy (Y=230)
                  */}
                  <path 
                    d={`M ${chartConfig.data.map((point, i) => 
                      `${40 + i * (720 / (Math.max(1, chartConfig.data.length - 1)))},${230 - (point.y / chartConfig.maxVal) * 200}`
                    ).join(' L ')}`}
                    fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round"
                  />
                  <path 
                    d={`M ${chartConfig.data.map((point, i) => 
                      `${40 + i * (720 / (Math.max(1, chartConfig.data.length - 1)))},${230 - (point.y / chartConfig.maxVal) * 200}`
                    ).join(' L ')} L ${40 + (chartConfig.data.length - 1) * (720 / (Math.max(1, chartConfig.data.length - 1)))},250 L 40,250 Z`}
                    fill="url(#purpleGradient)" style={{ opacity: 0.2 }}
                  />
                  {chartConfig.data.map((point, i) => (
                    <circle 
                      key={i} 
                      cx={40 + i * (720 / (Math.max(1, chartConfig.data.length - 1)))} 
                      cy={230 - (point.y / chartConfig.maxVal) * 200} 
                      r="4" 
                      fill="#6366f1" 
                      stroke="white" 
                      strokeWidth="2" 
                    />
                  ))}
                </>
              ) : (
                <text x="50%" y="50%" textAnchor="middle" fill="#94a3b8">No data available</text>
              )}
            </svg>
            
            {/* Thêm trục X (Ngày tháng) */}
            <div style={{ position: 'absolute', bottom: 0, left: 40, right: 40, display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
               {chartConfig.data.length > 0 && (
                 <>
                   <span>{chartConfig.data[0].date}</span>
                   <span>{chartConfig.data[chartConfig.data.length - 1].date}</span>
                 </>
               )}
            </div>
          </div>
        </div>

        {/* Detailed Metrics Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3>Session Metrics</h3>
            <p>Behavioral breakdown</p>
          </div>
          <div className="metrics-grid-container">
            <MetricItem label="Attention Span" value={currentMetrics.attention} icon="👁️" color="#3b82f6" />
            <MetricItem label="Positive Affect" value={currentMetrics.smile} icon="😊" color="#10b981" />
            <MetricItem label="Gaze Stability" value={currentMetrics.stability} icon="🎯" color="#8b5cf6" />
            <MetricItem label="Engagement" value={currentMetrics.engagement} icon="🔥" color="#f59e0b" />
          </div>
        </div>

      </div>

      {/* Cột Phải: AI Analysis & Privacy */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h3>AI Analysis</h3>
            <p>TensorFlow.js Inference</p>
          </div>

          <div className="animate-in">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: 800, color: '#6366f1', lineHeight: 1 }}>{displayScore}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Risk Score</span>
            </div>
            
            <div className="ai-analysis-box">
              <p>"{displayExplanation}"</p>
            </div>
            
            <div className="tag-container">
              {latestAnalysis?.behavioralTags.map(tag => (
                <span key={tag} className="tag">{tag.replace('_', ' ')}</span>
              ))}
              {lastRecord?.classification && (
                 <span className="tag">Gaze: {lastRecord.classification.gazePattern}</span>
              )}
            </div>
          </div>
        </div>

        <div className="card privacy-card">
          <h4>Privacy Active</h4>
          <p>Processing locally. No data egress.</p>
        </div>
      </div>
    </div>
  );
};