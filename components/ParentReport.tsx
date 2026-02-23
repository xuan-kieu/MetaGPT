import React from 'react';
import { FullAssessmentResult as ScoringResult } from '../services/scoringService';

// ============================================
// PARENT REPORT COMPONENT
// ============================================
interface ParentReportProps {
  assessmentResult: ScoringResult;
  childName: string;
  onBack: () => void;
}

const ParentReport: React.FC<ParentReportProps> = ({ 
  assessmentResult, 
  childName, 
  onBack 
}) => {
  const { totalRiskScore, riskLevel, developmentalAgeMonths, childAgeMonths } = assessmentResult;

  // Map risk level to Vietnamese text
  const riskText = {
    'LOW': 'Thấp',
    'MEDIUM': 'Trung bình',
    'HIGH': 'Cao',
    'VERY_HIGH': 'Rất cao'
  }[riskLevel] || riskLevel;

  // Map risk level to color
  const riskColor = {
    'LOW': '#22c55e',
    'MEDIUM': '#eab308',
    'HIGH': '#f97316',
    'VERY_HIGH': '#ef4444'
  }[riskLevel] || '#64748b';

  // Mock dashboard data (you can replace with actual ReportService)
  const dashboardData = {
    domainPie: {
      labels: ['Xã hội', 'Giao tiếp', 'Nhận thức', 'Vận động'],
      values: [65, 70, 55, 80],
      colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316']
    },
    skillBars: [
      { skillName: 'Chú ý', rawScore: 65, percentile: 45, status: 'ORANGE' },
      { skillName: 'Bắt chước', rawScore: 70, percentile: 55, status: 'GREEN' },
      { skillName: 'Chỉ điểm', rawScore: 40, percentile: 20, status: 'RED' },
      { skillName: 'Phản ứng với tên', rawScore: 55, percentile: 35, status: 'ORANGE' }
    ]
  };

  return (
    <div className="report-container fade-in-up">
      <div className="report-header-mobile">
        <div className="report-icon-wrapper">🎉</div>
        <h2>Hoan hô bé {childName}!</h2>
        <p>Bé đã hoàn thành buổi chơi hôm nay.</p>
      </div>

      <div style={{ 
        background: riskColor + '20', 
        borderColor: riskColor, 
        padding: '1rem', 
        borderRadius: '12px', 
        marginBottom: '1.5rem',
        border: `2px solid ${riskColor}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: '#1e293b' }}>Mức độ nguy cơ:</span>
          <span style={{ fontWeight: 800, color: riskColor, fontSize: '1.3rem' }}>{riskText}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#475569' }}>Tuổi thực: {childAgeMonths} tháng</span>
          <span style={{ fontSize: '0.9rem', color: '#475569' }}>Tuổi phát triển: {developmentalAgeMonths} tháng</span>
        </div>
        <div style={{ 
          marginTop: '0.5rem', 
          fontSize: '0.9rem', 
          background: 'white', 
          padding: '0.5rem', 
          borderRadius: '8px' 
        }}>
          <strong>Điểm Z tổng hợp:</strong> {totalRiskScore.toFixed(2)}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ textAlign: 'left', fontSize: '1rem', marginBottom: '0.5rem' }}>📊 Điểm theo nhóm kỹ năng</h3>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-around' }}>
          {dashboardData.domainPie.labels.map((label, i) => (
            <div key={i} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ 
                width: '100%', 
                background: '#f1f5f9', 
                borderRadius: '8px', 
                height: '8px', 
                marginBottom: '0.3rem' 
              }}>
                <div style={{ 
                  width: `${dashboardData.domainPie.values[i]}%`, 
                  height: '8px', 
                  backgroundColor: dashboardData.domainPie.colors[i], 
                  borderRadius: '8px' 
                }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#334155' }}>{label}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block' }}>
                {Math.round(dashboardData.domainPie.values[i])}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ 
        background: '#f8fafc', 
        padding: '1.2rem', 
        borderRadius: '16px', 
        marginBottom: '1.5rem', 
        textAlign: 'left' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ 
            background: '#6366f1', 
            color: 'white', 
            padding: '0.2rem 0.8rem', 
            borderRadius: '12px', 
            fontSize: '0.75rem', 
            fontWeight: 600 
          }}>
            🎯 KỸ NĂNG CẦN HỖ TRỢ
          </span>
        </div>
        <ul style={{ paddingLeft: '1.2rem', margin: '0.5rem 0', color: '#334155' }}>
          {dashboardData.skillBars.filter(s => s.status === 'RED').slice(0, 3).map((s, idx) => (
            <li key={idx} style={{ marginBottom: '0.3rem' }}>
              • {s.skillName}: {s.rawScore}% (xếp hạng {s.percentile}%)
            </li>
          ))}
          {dashboardData.skillBars.filter(s => s.status === 'RED').length === 0 && (
            <li>Chưa phát hiện kỹ năng yếu đặc thù</li>
          )}
        </ul>
      </div>

      <button onClick={onBack} className="report-home-btn">
        Về màn hình chính
      </button>
    </div>
  );
};

export default ParentReport;