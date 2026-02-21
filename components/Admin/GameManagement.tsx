import React, { useEffect, useState } from 'react';
import { getGames, createGame, updateGame, deleteGame, Game } from '../../services/adminService';

const GameManagement: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGame, setEditingGame] = useState<Partial<Game> | null>(null);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const data = await getGames();
      setGames(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể tải danh sách trò chơi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa trò chơi này?')) return;
    try {
      await deleteGame(id);
      setGames(games.filter(g => g.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Xóa thất bại');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Partial<Game> = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      instructions: formData.get('instructions') as string,
      min_age_months: parseInt(formData.get('min_age_months') as string),
      max_age_months: parseInt(formData.get('max_age_months') as string),
      target_duration_seconds: formData.get('target_duration_seconds') ? parseInt(formData.get('target_duration_seconds') as string) : undefined,
      media_url: formData.get('media_url') as string,
      is_gateway: formData.get('is_gateway') === 'true',
    };
    try {
      if (editingGame?.id) {
        await updateGame(editingGame.id, data);
      } else {
        await createGame(data);
      }
      setShowModal(false);
      setEditingGame(null);
      fetchGames();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Lưu thất bại');
    }
  };

  const openEditModal = (game: Game) => {
    setEditingGame(game);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingGame(null);
    setShowModal(true);
  };

  if (loading) return <div className="text-center py-4">Đang tải...</div>;
  if (error) return <div className="text-red-600 text-center py-4">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý trò chơi</h1>
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          + Thêm trò chơi
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Độ tuổi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian (giây)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gateway</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {games.map(game => (
              <tr key={game.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{game.code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{game.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {game.min_age_months} - {game.max_age_months} tháng
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{game.target_duration_seconds || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {game.is_gateway ? 'Có' : 'Không'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(game.created_at).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openEditModal(game)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    Sửa
                  </button>
                  <button onClick={() => handleDelete(game.id)} className="text-red-600 hover:text-red-900">
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal thêm/sửa */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium mb-4">{editingGame ? 'Sửa trò chơi' : 'Thêm trò chơi'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã trò chơi</label>
                <input 
                  name="code" 
                  defaultValue={editingGame?.code || ''} 
                  required 
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên trò chơi</label>
                <input 
                  name="name" 
                  defaultValue={editingGame?.name || ''} 
                  required 
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea 
                  name="description" 
                  defaultValue={editingGame?.description || ''} 
                  rows={2}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hướng dẫn</label>
                <textarea 
                  name="instructions" 
                  defaultValue={editingGame?.instructions || ''} 
                  rows={2}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tuổi tối thiểu (tháng)</label>
                  <input 
                    name="min_age_months" 
                    type="number" 
                    defaultValue={editingGame?.min_age_months || ''} 
                    required 
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tuổi tối đa (tháng)</label>
                  <input 
                    name="max_age_months" 
                    type="number" 
                    defaultValue={editingGame?.max_age_months || ''} 
                    required 
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian mục tiêu (giây)</label>
                <input 
                  name="target_duration_seconds" 
                  type="number" 
                  defaultValue={editingGame?.target_duration_seconds || ''} 
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Media</label>
                <input 
                  name="media_url" 
                  defaultValue={editingGame?.media_url || ''} 
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Là gateway?</label>
                <select 
                  name="is_gateway" 
                  defaultValue={editingGame?.is_gateway ? 'true' : 'false'} 
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="false">Không</option>
                  <option value="true">Có</option>
                </select>
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

export default GameManagement;