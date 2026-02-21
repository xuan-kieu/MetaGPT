import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChildDetail, Child, Assessment } from '../../services/specialistService';

const ChildDetail: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const [child, setChild] = useState<Child | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      if (!childId) return;
      try {
        const data = await getChildDetail(childId);
        setChild(data.child);
        setAssessments(data.assessments);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Không thể tải thông tin trẻ');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [childId]);

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let months = (today.getFullYear() - birth.getFullYear()) * 12;
    months -= birth.getMonth();
    months += today.getMonth();
    return months < 0 ? 0 : months;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getRiskLevelColor = (level?: string) => {
    switch (level) {
      case 'RẤT CAO': return 'text-red-600 bg-red-100';
      case 'CAO': return 'text-orange-600 bg-orange-100';
      case 'TRUNG BÌNH': return 'text-yellow-600 bg-yellow-100';
      case 'THẤP': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">{error || 'Không tìm thấy thông tin trẻ'}</p>
        <button
          onClick={() => navigate('/specialist')}
          className="mt-4 text-indigo-600 hover:text-indigo-800"
        >
          ← Quay lại danh sách
        </button>
      </div>
    );
  }

  const ageMonths = calculateAge(child.birth_date);
  const ageText = ageMonths >= 24 
    ? `${Math.floor(ageMonths / 12)} tuổi ${ageMonths % 12} tháng` 
    : `${ageMonths} tháng`;

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/specialist')}
        className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center"
      >
        ← Quay lại danh sách
      </button>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-2xl font-bold leading-6 text-gray-900">
            {child.full_name}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Thông tin chi tiết và lịch sử đánh giá
          </p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Ngày sinh</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(child.birth_date)} ({ageText})
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Giới tính</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {child.gender === 'male' ? 'Nam' : child.gender === 'female' ? 'Nữ' : 'Khác'}
              </dd>
            </div>
            {child.region && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Khu vực</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{child.region}</dd>
              </div>
            )}
            {child.primary_language && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Ngôn ngữ chính</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{child.primary_language}</dd>
              </div>
            )}
            {child.notes && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Ghi chú</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{child.notes}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="mt-8">
        <h4 className="text-xl font-bold text-gray-900 mb-4">Lịch sử đánh giá</h4>
        {assessments.length === 0 ? (
          <p className="text-gray-500">Trẻ chưa có đánh giá nào.</p>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {assessments.map((assessment) => (
                <li key={assessment.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          Đánh giá ngày {formatDate(assessment.started_at)}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskLevelColor(assessment.risk_level)}`}>
                            {assessment.risk_level || 'Chưa xác định'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            Trạng thái: {assessment.status === 'completed' ? 'Hoàn thành' : assessment.status}
                          </p>
                          {assessment.overall_risk_score && (
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              Điểm nguy cơ: {assessment.overall_risk_score}
                            </p>
                          )}
                        </div>
                        {assessment.developmental_age_estimate && (
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            Tuổi phát triển: {assessment.developmental_age_estimate} tháng
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/assessment/${assessment.id}`)}
                      className="ml-4 text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Xem chi tiết →
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChildDetail;