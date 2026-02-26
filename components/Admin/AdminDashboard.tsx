import React, { useEffect, useState } from 'react';
import api from '../../services/api'; 

// Cập nhật Interface để linh hoạt hơn
interface DashboardStats {
    total_users: number;
    total_children: number;
    total_assessments: number;
    recent_activities: any[];
  riskDistribution?: {
    low: number;
    medium: number;
    high: number;
  };
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/stats');
        
        // Log để bạn kiểm tra chính xác Backend trả về gì
        console.log("Dữ liệu nhận được:", response.data);
        
        setStats(response.data);
      } catch (err: any) {
        setError('Không thể tải dữ liệu thống kê.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // 1. Chốt chặn khi đang tải
  if (loading) return <div>Đang tải dữ liệu tổng quan...</div>;

  // 2. Chốt chặn khi có lỗi
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  // 3. Chốt chặn quan trọng: Nếu stats vẫn null thì không render tiếp
  if (!stats) return <div>Không có dữ liệu.</div>;

  return (
    <div className="admin-dashboard">
      <h1>Bảng Điều Khiển Tổng Quan</h1>

      <section>
        <h2>Con số chủ chốt</h2>
        <ul>
          <li>Tổng người dùng: {stats.total_users || 0}</li>
          <li>Tổng trẻ em: {stats.total_children || 0}</li>
          <li>Số lượt đánh giá: {stats.total_assessments || 0}</li>
        </ul>
      </section>

      <section>
        <h2>Phân bố mức độ nguy cơ</h2>
        {/* Dùng Optional Chaining ?. và giá trị mặc định || 0 để tránh lỗi 'low' undefined */}
        <ul>
          <li>Nguy cơ thấp: {stats.riskDistribution?.low || 0}</li>
          <li>Nguy cơ trung bình: {stats.riskDistribution?.medium || 0}</li>
          <li>Nguy cơ cao: {stats.riskDistribution?.high || 0}</li>
        </ul>
      </section>

      <section>
        <h2>Hoạt động gần đây</h2>
        {stats.recent_activities && stats.recent_activities.length > 0 ? (
          <ul>
            {stats.recent_activities.map((act, i) => (
              <li key={i}>{act.description}</li>
            ))}
          </ul>
        ) : (
          <p>Chưa có hoạt động.</p>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;