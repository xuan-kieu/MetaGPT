import React, { useMemo } from 'react';
import { ChildProfile } from '../../types';
import * as childService from '../../services/childService';

interface ManageProfilesProps {
  userId: string;
  currentChildId?: string;
  onSelect: (child: ChildProfile) => void;
  onEdit: (child: ChildProfile) => void;
  onAddNew: () => void;
  onBack: () => void;
}

const ManageProfiles: React.FC<ManageProfilesProps> = ({
  userId,
  currentChildId,
  onSelect,
  onEdit,
  onAddNew,
  onBack
}) => {
  // Lấy danh sách trẻ của user này từ DB
  const childrenList = useMemo(() => {
    const dbChildren = childService.getChildrenByParent(userId);
    return dbChildren.map(childService.mapDBChildToChildProfile);
  }, [userId]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-3xl shadow-xl mt-8 border border-slate-100">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Hồ sơ của bé</h2>
          <p className="text-slate-500 text-sm mt-1">Quản lý danh sách và thông tin các bé</p>
        </div>
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium">
          ← Quay lại
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Danh sách các bé đã tạo */}
        {childrenList.map(child => (
          <div 
            key={child.id} 
            className={`relative p-5 rounded-2xl border-2 transition-all ${
              currentChildId === child.id 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-slate-200 hover:border-indigo-300'
            }`}
          >
            {currentChildId === child.id && (
              <span className="absolute -top-3 right-4 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                ĐANG CHỌN
              </span>
            )}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm border border-slate-100">
                {child.gender === 'female' ? '👧' : child.gender === 'male' ? '👦' : '👶'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{child.name}</h3>
                <p className="text-sm text-slate-500">
                  {child.age?.years || 0} tuổi {child.age?.months || 0} tháng
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => onSelect(child)}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                disabled={currentChildId === child.id}
              >
                {currentChildId === child.id ? 'Đang chọn' : 'Chọn để đánh giá'}
              </button>
              <button 
                onClick={() => onEdit(child)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
              >
                ✏️ Sửa
              </button>
            </div>
          </div>
        ))}

        {/* Nút Thêm Bé Mới */}
        <div 
          onClick={onAddNew}
          className="p-5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-slate-50 cursor-pointer flex flex-col items-center justify-center min-h-[160px] transition-all group"
        >
          <div className="w-12 h-12 bg-slate-100 group-hover:bg-indigo-100 rounded-full flex items-center justify-center mb-3 transition-colors">
            <span className="text-2xl text-slate-400 group-hover:text-indigo-500">+</span>
          </div>
          <p className="font-bold text-slate-500 group-hover:text-indigo-600">Thêm hồ sơ bé mới</p>
        </div>
      </div>
    </div>
  );
};

export default ManageProfiles;