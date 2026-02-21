import React, { useEffect, useState } from 'react';
import { getSystemStats, SystemStats } from '../../services/adminService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const SystemStatsComponent: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getSystemStats();
        setStats(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Không thể tải thống kê');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-center py-4">Đang tải...</div>;
  if (error) return <div className="text-red-600 text-center py-4">{error}</div>;
  if (!stats) return <div className="text-center py-4">Không có dữ liệu</div>;

  const riskData = stats.assessments_by_risk.map(item => ({
    name: item.risk_level,
    value: item.count
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Thống kê hệ thống</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 uppercase">Tổng người dùng</div>
          <div className="text-3xl font-bold">{stats.total_users}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 uppercase">Tổng trẻ</div>
          <div className="text-3xl font-bold">{stats.total_children}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 uppercase">Tổng đánh giá</div>
          <div className="text-3xl font-bold">{stats.total_assessments}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Phân bố mức độ nguy cơ</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={entry => entry.name}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Hoạt động gần đây</h2>
          <div className="space-y-4">
            {stats.recent_activities && stats.recent_activities.length > 0 ? (
              stats.recent_activities.map((activity, idx) => (
                <div key={idx} className="border-b pb-2">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-gray-500">{new Date(activity.created_at).toLocaleString('vi-VN')}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Chưa có hoạt động nào</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatsComponent;