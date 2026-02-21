import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChildren, Child } from '../../services/specialistService';

const SpecialistChildren: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const data = await getChildren();
        setChildren(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Không thể tải danh sách trẻ');
      } finally {
        setLoading(false);
      }
    };
    fetchChildren();
  }, []);

  const handleChildClick = (childId: string) => {
    navigate(`/specialist/children/${childId}`);
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let months = (today.getFullYear() - birth.getFullYear()) * 12;
    months -= birth.getMonth();
    months += today.getMonth();
    return months < 0 ? 0 : months;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Danh sách trẻ được phân công</h1>
      {children.length === 0 ? (
        <p className="text-gray-500">Chưa có trẻ nào được phân công cho bạn.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => {
            const ageMonths = calculateAge(child.birth_date);
            const ageText = ageMonths >= 24 
              ? `${Math.floor(ageMonths / 12)} tuổi ${ageMonths % 12} tháng` 
              : `${ageMonths} tháng`;
            
            return (
              <div
                key={child.id}
                onClick={() => handleChildClick(child.id)}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{child.full_name}</h2>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Tuổi:</span> {ageText}</p>
                  <p><span className="font-medium">Giới tính:</span> {child.gender === 'male' ? 'Nam' : child.gender === 'female' ? 'Nữ' : 'Khác'}</p>
                  {child.region && <p><span className="font-medium">Khu vực:</span> {child.region}</p>}
                </div>
                <div className="mt-4 text-indigo-600 text-sm font-medium">
                  Xem chi tiết →
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SpecialistChildren;