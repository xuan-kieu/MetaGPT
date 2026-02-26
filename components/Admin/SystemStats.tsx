import React, { useEffect, useState, useMemo } from 'react';
import { getSystemStats, SystemStats } from '../../services/adminService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const SystemStatsComponent: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getSystemStats();
        if (isMounted) {
          setStats(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError('Không thể tải thống kê hệ thống.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStats();
    return () => { isMounted = false; };
  }, []);

  // SỬ DỤNG USEMEMO: Ngăn chặn việc tính toán lại riskData trừ khi stats thay đổi
  // Điều này cực kỳ quan trọng để Recharts không bị loop render
  const riskData = useMemo(() => {
    if (!stats?.assessments_by_risk) return [];
    return stats.assessments_by_risk.map(item => ({
      name: item.risk_level || 'Không xác định',
      value: Number(item.count) || 0
    }));
  }, [stats]);

  if (loading) return <div className="text-center py-10">Đang tải...</div>;
  if (error) return <div className="text-red-600 text-center py-10">{error}</div>;
  if (!stats) return null;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Thống kê hệ thống</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <div className="text-xs font-semibold text-gray-400 uppercase">Tổng người dùng</div>
          <div className="text-3xl font-bold text-indigo-600">{stats.total_users}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <div className="text-xs font-semibold text-gray-400 uppercase">Tổng trẻ em</div>
          <div className="text-3xl font-bold text-green-600">{stats.total_children}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <div className="text-xs font-semibold text-gray-400 uppercase">Tổng đánh giá</div>
          <div className="text-3xl font-bold text-orange-600">{stats.total_assessments}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Phân bố mức độ nguy cơ</h2>
          {/* CỐ ĐỊNH CHIỀU CAO: Tránh ResponsiveContainer tính toán lại vô tận */}
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                  isAnimationActive={false} // Tắt animation để triệt tiêu nguyên nhân gây loop
                >
                  {riskData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Hoạt động mới nhất</h2>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {stats.recent_activities?.map((activity, idx) => (
              <div key={idx} className="border-b pb-2">
                <p className="text-sm text-gray-700">{activity.description}</p>
                <p className="text-xs text-gray-400">{new Date(activity.created_at).toLocaleString('vi-VN')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatsComponent;