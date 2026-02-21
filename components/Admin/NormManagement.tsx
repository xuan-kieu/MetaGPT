import React, { useEffect, useState } from 'react';
import { getNorms, createNorm, updateNorm, deleteNorm, Norm } from '../../services/adminService';

// Giả sử có các interface này (có thể import từ service hoặc định nghĩa riêng)
interface Skill {
  id: number;
  name: string;
  code: string;
  domain: string;
}

interface AgeGroup {
  id: number;
  name: string;
  min_months: number;
  max_months: number;
}

const NormManagement: React.FC = () => {
  const [norms, setNorms] = useState<Norm[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingNorm, setEditingNorm] = useState<Partial<Norm> | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Gọi đồng thời các API cần thiết
      const [normsData, skillsData, ageGroupsData] = await Promise.all([
        getNorms(),
        // Giả sử có các hàm này trong adminService
        fetch('/api/admin/skills').then(res => res.json()),
        fetch('/api/admin/age-groups').then(res => res.json())
      ]);
      setNorms(normsData);
      setSkills(skillsData);
      setAgeGroups(ageGroupsData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa chuẩn này?')) return;
    try {
      await deleteNorm(id);
      setNorms(norms.filter(n => n.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Xóa thất bại');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Partial<Norm> = {
      skill_id: parseInt(formData.get('skill_id') as string),
      age_group_id: parseInt(formData.get('age_group_id') as string),
      mean: parseFloat(formData.get('mean') as string),
      std_dev: parseFloat(formData.get('std_dev') as string),
      sample_size: parseInt(formData.get('sample_size') as string) || undefined
    };
    try {
      if (editingNorm?.id) {
        await updateNorm(editingNorm.id, data);
      } else {
        await createNorm(data);
      }
      setShowModal(false);
      setEditingNorm(null);
      fetchData(); // reload
    } catch (err: any) {
      alert(err.response?.data?.error || 'Lưu thất bại');
    }
  };

  const openEditModal = (norm: Norm) => {
    setEditingNorm(norm);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingNorm(null);
    setShowModal(true);
  };

  if (loading) return <div className="text-center py-4">Đang tải...</div>;
  if (error) return <div className="text-red-600 text-center py-4">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý chuẩn phát triển</h1>
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          + Thêm chuẩn
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kỹ năng</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhóm tuổi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mean</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Std Dev</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cỡ mẫu</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cập nhật</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {norms.map(norm => {
              const skill = skills.find(s => s.id === norm.skill_id);
              const ageGroup = ageGroups.find(ag => ag.id === norm.age_group_id);
              return (
                <tr key={norm.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{skill?.name || `ID: ${norm.skill_id}`}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ageGroup?.name || `ID: ${norm.age_group_id}`}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{norm.mean}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{norm.std_dev}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{norm.sample_size || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(norm.updated_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEditModal(norm)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                      Sửa
                    </button>
                    <button onClick={() => handleDelete(norm.id)} className="text-red-600 hover:text-red-900">
                      Xóa
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal thêm/sửa */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium mb-4">{editingNorm ? 'Sửa chuẩn' : 'Thêm chuẩn'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Kỹ năng</label>
                <select 
                  name="skill_id" 
                  defaultValue={editingNorm?.skill_id || ''} 
                  required 
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Chọn kỹ năng</option>
                  {skills.map(skill => (
                    <option key={skill.id} value={skill.id}>{skill.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nhóm tuổi</label>
                <select 
                  name="age_group_id" 
                  defaultValue={editingNorm?.age_group_id || ''} 
                  required 
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Chọn nhóm tuổi</option>
                  {ageGroups.map(ag => (
                    <option key={ag.id} value={ag.id}>{ag.name} ({ag.min_months}-{ag.max_months} tháng)</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mean (giá trị trung bình)</label>
                <input 
                  name="mean" 
                  type="number" 
                  step="0.001" 
                  defaultValue={editingNorm?.mean || ''} 
                  required 
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Std Dev (độ lệch chuẩn)</label>
                <input 
                  name="std_dev" 
                  type="number" 
                  step="0.001" 
                  defaultValue={editingNorm?.std_dev || ''} 
                  required 
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cỡ mẫu (tùy chọn)</label>
                <input 
                  name="sample_size" 
                  type="number" 
                  defaultValue={editingNorm?.sample_size || ''} 
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NormManagement;