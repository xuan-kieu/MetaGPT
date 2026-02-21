import React, { useMemo, useState, useEffect } from 'react';
import { InferenceResult, LongitudinalRecord } from '../types';
import * as db from '../services/dbService'; // Điều chỉnh đường dẫn nếu cần (có thể là '../dbService')

interface DashboardProps {
  childId?: string;               // Nếu có, tự động fetch dữ liệu từ DB
  records?: LongitudinalRecord[];  // Dữ liệu truyền từ ngoài (ưu tiên nếu có)
  latestAnalysis?: InferenceResult;
}

// --- Helper chuyển đổi an toàn từ Date|string sang string ---
const ensureString = (value: Date | string | null | undefined): string => {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  return value.toISOString();
};

// --- TỪ ĐIỂN DỊCH THUẬT ---
const TAG_TRANSLATIONS: Record<string, string> = {
  'GAZE_FOCUSED': 'Tập trung',
  'GAZE_NOT_FOCUSED': 'Mất tập trung',
  'GAZE_DISTRACTED': 'Xao nhãng',
  'FOCUSED': 'Tập trung',
  'NOT_FOCUSED': 'Không tập trung',
  'ENGAGEMENT_HIGH': 'Tương tác cao',
  'ENGAGEMENT_MEDIUM': 'Tương tác trung bình',
  'ENGAGEMENT_LOW': 'Tương tác thấp',
  'AFFECT_POSITIVE': 'Cảm xúc tích cực',
  'AFFECT_NEGATIVE': 'Cảm xúc tiêu cực',
  'AFFECT_NEUTRAL': 'Cảm xúc bình thường',
  'HAPPY': 'Vui vẻ',
  'SAD': 'Buồn',
  'NEUTRAL': 'Bình thường'
};

const translateTag = (tag: string): string => {
  if (!tag) return '';
  const normalizedKey = tag.toUpperCase().replace(/\s+/g, '_');
  return TAG_TRANSLATIONS[normalizedKey] || tag;
};

// --- Hàm chuyển đổi từ dữ liệu DB sang LongitudinalRecord ---
const mapAssessmentToLongitudinalRecord = (assessment: db.Assessment): LongitudinalRecord => {
  const gameSessions = db.getGameSessionsByAssessment(assessment.id);
  const features: any[] = [];

  let avgAttention = 0, avgSmile = 0, gazeStability = 0, engagement = 0;

  if (gameSessions.length > 0) {
    const metrics = db.getMetricsByGameSession(gameSessions[0].id);
    const attentionMetric = metrics.find(m => m.metric_key === 'avg_attention');
    const smileMetric = metrics.find(m => m.metric_key === 'avg_smile');
    const gazeMetric = metrics.find(m => m.metric_key === 'gaze_stability');
    const engagementMetric = metrics.find(m => m.metric_key === 'engagement');

    avgAttention = attentionMetric?.metric_value ?? 0;
    avgSmile = smileMetric?.metric_value ?? 0;
    gazeStability = gazeMetric?.metric_value ?? 0;
    engagement = engagementMetric?.metric_value ?? 0;
  }

  return {
    id: assessment.id,
    date: ensureString(assessment.completed_at || assessment.created_at), // ✅ Ép kiểu về string
    riskScore: assessment.overall_risk_score || 0,
    observations: [
      `Trạng thái: ${assessment.status}`,
      `Điểm: ${assessment.overall_risk_score || '--'}`
    ],
    features,
    metrics: {
      attention: avgAttention,
      smile: avgSmile,
      gazeStability: gazeStability,
      engagement: engagement
    }
  };
};

// --- HÀM SINH CÂU GIẢI THÍCH ---
const generateVietnameseExplanation = (analysis?: InferenceResult): string => {
  if (!analysis || !analysis.features) {
    return "Hoàn thành một phiên chơi để xem phân tích chi tiết.";
  }

  const { avgAttention, engagementLevel, avgSmile } = analysis.features;
  
  let gazeText = "";
  if (avgAttention >= 0.7) gazeText = "Ánh nhìn tập trung tốt";
  else if (avgAttention >= 0.4) gazeText = "Ánh nhìn ở mức ổn định";
  else gazeText = "Có dấu hiệu xao nhãng";

  let engageText = "";
  if (engagementLevel >= 0.7) engageText = "tương tác rất tích cực";
  else if (engagementLevel >= 0.4) engageText = "mức độ tương tác trung bình";
  else engageText = "tương tác còn hạn chế";

  let emotionText = "";
  if (avgSmile >= 0.5) emotionText = ", tâm trạng vui vẻ";
  else if (avgSmile >= 0.2) emotionText = ", biểu cảm tích cực";
  
  return `Hệ thống ghi nhận: ${gazeText} với ${engageText}${emotionText}.`;
};

// --- COMPONENT CHÍNH ---
export const ClinicianDashboard: React.FC<DashboardProps> = ({ 
  childId,
  records: propRecords = [], 
  latestAnalysis 
}) => {
  const [dbRecords, setDbRecords] = useState<LongitudinalRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!childId) return;

    const fetchData = () => {
      setLoading(true);
      try {
        const assessments = db.getAssessmentsByChild(childId);
        const mapped = assessments.map(mapAssessmentToLongitudinalRecord);
        setDbRecords(mapped);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [childId]);

  const records = useMemo(() => {
    if (propRecords.length > 0) return propRecords;
    return dbRecords;
  }, [propRecords, dbRecords]);

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

  const displayExplanation = generateVietnameseExplanation(latestAnalysis);

  const chartConfig = useMemo(() => {
    if (!records || records.length === 0) return { data: [], maxVal: 10 };

    const data = records.map((record, index) => ({
      x: index,
      y: record.riskScore, 
      date: new Date(record.date).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' })
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

  if (loading) {
    return <div className="dashboard-loading">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="dashboard-grid">
      {/* Cột Trái: Biểu đồ & Metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h3>Biểu đồ theo dõi</h3>
            <p>Biến động điểm số qua các phiên đánh giá</p>
          </div>
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
                <text x="50%" y="50%" textAnchor="middle" fill="#94a3b8">Chưa có dữ liệu</text>
              )}
            </svg>
            
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

        <div className="card">
          <div className="card-header">
            <h3>Chỉ số chi tiết</h3>
            <p>Phân tích hành vi trong phiên</p>
          </div>
          <div className="metrics-grid-container">
            <MetricItem label="Độ tập trung" value={currentMetrics.attention} icon="👁️" color="#3b82f6" />
            <MetricItem label="Cảm xúc tích cực" value={currentMetrics.smile} icon="😊" color="#10b981" />
            <MetricItem label="Ổn định ánh nhìn" value={currentMetrics.stability} icon="🎯" color="#8b5cf6" />
            <MetricItem label="Mức độ tương tác" value={currentMetrics.engagement} icon="🔥" color="#f59e0b" />
          </div>
        </div>
      </div>

      {/* Cột Phải: AI Analysis & Privacy */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h3>Phân tích AI</h3>
            <p>Xử lý bởi TensorFlow.js</p>
          </div>

          <div className="animate-in">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: 800, color: '#6366f1', lineHeight: 1 }}>{displayScore}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Điểm đánh giá</span>
            </div>
            
            <div className="ai-analysis-box">
              <p style={{ fontStyle: 'italic' }}>"{displayExplanation}"</p>
            </div>
            
            <div className="tag-container">
              {latestAnalysis?.behavioralTags.map(tag => (
                <span key={tag} className="tag">{translateTag(tag)}</span>
              ))}
              {lastRecord?.classification && (
                 <span className="tag">
                    Ánh nhìn: {translateTag(lastRecord.classification.gazePattern)}
                 </span>
              )}
            </div>
          </div>
        </div>

        <div className="card privacy-card">
          <h4>Bảo mật hoạt động</h4>
          <p>Dữ liệu được xử lý cục bộ trên thiết bị này. Không gửi dữ liệu ra bên ngoài.</p>
        </div>
      </div>
    </div>
  );
};