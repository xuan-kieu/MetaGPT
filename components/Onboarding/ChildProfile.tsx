import React, { useState, useEffect } from 'react';
import * as db from '../../services/dbService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // 👈 ĐÃ THÊM USEAUTH Ở ĐÂY
import '../../styles.css';

interface ChildProfileData {
  id?: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  birthDate: string;
  region: string;
  primaryLanguage: string;
  age?: {
    years: number;
    months: number;
  };
}

interface ChildProfileProps {
  onComplete?: (childData: ChildProfileData) => void;
  isNewUser?: boolean;
  editingData?: ChildProfileData | null;
  onCancel?: () => void;
}

const ChildProfile: React.FC<ChildProfileProps> = ({ 
  onComplete, 
  isNewUser = false, 
  editingData, 
  onCancel 
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // 👈 LẤY THÔNG TIN USER TỪ CONTEXT
  
  // State khởi tạo với giá trị mặc định
  const [profile, setProfile] = useState<ChildProfileData>({
    name: '',
    gender: 'male',
    birthDate: '',
    region: '',
    primaryLanguage: 'vi'
  });
  
  const [calculatedAge, setCalculatedAge] = useState<{years: number; months: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // QUAN TRỌNG: useEffect để đồng bộ khi editingData thay đổi
  useEffect(() => {
    if (editingData) {
      // Nếu có editingData, nạp dữ liệu vào form
      setProfile({
        id: editingData.id,
        name: editingData.name || '',
        gender: editingData.gender || 'male',
        birthDate: editingData.birthDate || '',
        region: editingData.region || '',
        primaryLanguage: editingData.primaryLanguage || 'vi'
      });
      
      // Chủ động tính lại tuổi ngay khi nạp editingData
      if (editingData.birthDate) {
        calculateAge(editingData.birthDate);
      }
    } else {
      // Nếu không có editingData, reset về mặc định
      setProfile({
        name: '',
        gender: 'male',
        birthDate: '',
        region: '',
        primaryLanguage: 'vi'
      });
      setCalculatedAge(null);
    }
  }, [editingData]);

  // Danh sách vùng miền Việt Nam
  const regions = [
    'Miền Bắc',
    'Miền Trung', 
    'Miền Nam',
    'Tây Nguyên',
    'Đồng bằng sông Hồng',
    'Đồng bằng sông Cửu Long'
  ];

  // Danh sách ngôn ngữ
  const languages = [
    { value: 'vi', label: 'Tiếng Việt' },
    { value: 'en', label: 'Tiếng Anh' },
    { value: 'km', label: 'Tiếng Khmer' },
    { value: 'other', label: 'Ngôn ngữ khác' }
  ];

  // HÀM TÍNH TUỔI CẢI TIẾN - XỬ LÝ CHUỖI NGÀY AN TOÀN
  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) {
      setCalculatedAge(null);
      return;
    }
    
    // Tách chuỗi YYYY-MM-DD an toàn
    const [bYear, bMonth, bDay] = birthDateString.split('-').map(Number);
    const today = new Date();
    const tYear = today.getFullYear();
    const tMonth = today.getMonth() + 1; // getMonth() trả về 0-11
    const tDay = today.getDate();

    let years = tYear - bYear;
    let months = tMonth - bMonth;

    if (months < 0) {
      years--;
      months += 12;
    }

    // Xử lý lệch ngày
    if (tDay < bDay) {
      months--;
      if (months < 0) {
        years--;
        months = 11;
      }
    }
    
    // Đảm bảo tuổi không âm
    if (years < 0 || (years === 0 && months < 0)) {
      setCalculatedAge(null);
    } else {
      setCalculatedAge({ years, months });
    }
  };

  // Tính tuổi tự động khi ngày sinh thay đổi
  useEffect(() => {
    if (profile.birthDate) {
      calculateAge(profile.birthDate);
    } else {
      setCalculatedAge(null);
    }
  }, [profile.birthDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!profile.name.trim()) {
      setError('Vui lòng nhập họ tên trẻ!');
      return false;
    }
    
    if (!profile.birthDate) {
      setError('Vui lòng chọn ngày sinh!');
      return false;
    }
    
    // Kiểm tra định dạng ngày hợp lệ
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(profile.birthDate)) {
      setError('Ngày sinh không đúng định dạng!');
      return false;
    }
    
    const birthDate = new Date(profile.birthDate);
    const today = new Date();
    
    // Kiểm tra ngày sinh không được lớn hơn ngày hiện tại
    if (birthDate > today) {
      setError('Ngày sinh không được lớn hơn ngày hiện tại!');
      return false;
    }
    
    // Kiểm tra tuổi âm (edge case hiếm gặp)
    if (calculatedAge && calculatedAge.years < 0) {
      setError('Ngày sinh không hợp lệ!');
      return false;
    }
    
    return true;
  };

  // ĐÃ SỬA LẠI LOGIC LƯU HỒ SƠ DÙNG CONTEXT THAY VÌ LOCALSTORAGE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // 1. Kiểm tra User từ Context thay vì localStorage
      if (!currentUser || !currentUser.id) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng tải lại trang.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const userId = currentUser.id;

      // 2. Không cần tìm lại dbUser vì nếu currentUser tồn tại thì tức là hợp lệ rồi
      if (currentUser.role !== 'parent') {
        setError('Chỉ phụ huynh mới có thể tạo hồ sơ trẻ.');
        return;
      }

      let savedDbChild;
      
      // Phân nhánh: UPDATE hoặc CREATE
      if (editingData && editingData.id) {
        // TRƯỜNG HỢP UPDATE (SỬA HỒ SƠ)
        console.log('📝 Updating child with ID:', editingData.id);
        
        savedDbChild = db.updateChild(editingData.id, {
          full_name: profile.name,
          birth_date: profile.birthDate,
          gender: profile.gender,
          region: profile.region || null,
          primary_language: profile.primaryLanguage,
        });
        
        console.log('✅ Child updated in DB:', savedDbChild);
      } else {
        // TRƯỜNG HỢP TẠO MỚI
        console.log('📝 Creating new child with data:', {
          full_name: profile.name,
          birth_date: profile.birthDate,
          gender: profile.gender,
          region: profile.region || null,
          primary_language: profile.primaryLanguage,
          parent_id: userId,
          created_by: userId,
        });

        savedDbChild = db.createChild({
          full_name: profile.name,
          birth_date: profile.birthDate,
          gender: profile.gender,
          region: profile.region || null,
          primary_language: profile.primaryLanguage,
          notes: null,
          parent_id: userId,
          created_by: userId,
        });

        console.log('✅ Child created in DB:', savedDbChild);
      }

      // Chuẩn bị dữ liệu trẻ cho UI
      const childData: ChildProfileData = {
        id: savedDbChild.id,
        name: savedDbChild.full_name,
        gender: savedDbChild.gender || 'other',
        birthDate: savedDbChild.birth_date,
        region: savedDbChild.region || '',
        primaryLanguage: savedDbChild.primary_language || 'vi',
        age: calculatedAge || undefined,
      };

      // Chỉ lưu ID, không lưu full object
      localStorage.setItem('neuropath_child_id', savedDbChild.id);
      
      // Gọi callback onComplete để component cha biết đã lưu xong
      if (onComplete) {
        onComplete(childData);
      }

    } catch (error) {
      console.error('❌ Error saving child profile:', error);
      setError('Có lỗi xảy ra khi lưu hồ sơ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Xác định tiêu đề dựa vào mode (thêm mới hay chỉnh sửa)
  const getTitle = () => {
    if (editingData) return '✏️ Chỉnh sửa hồ sơ trẻ';
    if (isNewUser) return '🎉 Chào mừng bạn đến với NeuroPath!';
    return 'Thêm hồ sơ trẻ';
  };

  const getSubtitle = () => {
    if (editingData) return 'Cập nhật thông tin chi tiết về trẻ';
    if (isNewUser) return 'Để bắt đầu, vui lòng tạo hồ sơ cho bé yêu của bạn';
    return 'Vui lòng cung cấp thông tin chi tiết về trẻ';
  };

  const getButtonText = () => {
    if (loading) return 'Đang lưu...';
    if (editingData) return '💾 Cập nhật hồ sơ';
    return '✅ Lưu hồ sơ và tiếp tục';
  };

  return (
    <div className="child-profile-container">
      <div className="profile-card">
        <h2 className="profile-title">
          {getTitle()}
        </h2>
        <p className="profile-subtitle">
          {getSubtitle()}
        </p>
        
        {error && (
          <div className="error-message" style={{
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid #fecaca'
          }}>
            ❌ {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="name">
              Họ tên trẻ *
              <span className="required-star">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={profile.name}
              onChange={handleChange}
              required
              placeholder="Nhập đầy đủ tên họ của trẻ"
              className="form-input"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="gender">
              Giới tính *
              <span className="required-star">*</span>
            </label>
            <div className="gender-options">
              <label className={`gender-option ${profile.gender === 'male' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={profile.gender === 'male'}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <span className="gender-label">👦 Nam</span>
              </label>
              <label className={`gender-option ${profile.gender === 'female' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={profile.gender === 'female'}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span className="gender-label">👧 Nữ</span>
              </label>
              <label className={`gender-option ${profile.gender === 'other' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="gender"
                  value="other"
                  checked={profile.gender === 'other'}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span className="gender-label">👶 Khác</span>
              </label>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="birthDate">
              Ngày tháng năm sinh *
              <span className="required-star">*</span>
            </label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={profile.birthDate}
              onChange={handleChange}
              required
              max={new Date().toISOString().split('T')[0]}
              className="form-input"
              disabled={loading}
            />
            {calculatedAge && (
              <div className="age-display">
                <div className="age-icon">🎂</div>
                <div className="age-details">
                  <span className="age-text">
                    <strong>Tuổi hiện tại:</strong> {calculatedAge.years} năm {calculatedAge.months} tháng
                  </span>
                  <span className="age-info">
                    ({Math.floor(calculatedAge.years * 12 + calculatedAge.months)} tháng)
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="region">
              Vùng miền *
              <span className="required-star">*</span>
            </label>
            <select
              id="region"
              name="region"
              value={profile.region}
              onChange={handleChange}
              required
              className="form-select"
              disabled={loading}
            >
              <option value="">Chọn vùng miền</option>
              {regions.map(region => (
                <option key={region} value={region}>
                  📍 {region}
                </option>
              ))}
            </select>
            <div className="select-hint">Giúp điều chỉnh nội dung phù hợp văn hóa địa phương</div>
          </div>
          
          <div className="form-group">
            <label htmlFor="primaryLanguage">
              Ngôn ngữ chính *
              <span className="required-star">*</span>
            </label>
            <select
              id="primaryLanguage"
              name="primaryLanguage"
              value={profile.primaryLanguage}
              onChange={handleChange}
              required
              className="form-select"
              disabled={loading}
            >
              {languages.map(lang => (
                <option key={lang.value} value={lang.value}>
                  🗣️ {lang.label}
                </option>
              ))}
            </select>
            <div className="select-hint">Ngôn ngữ trẻ sử dụng chủ yếu</div>
          </div>
          
          <div className="form-actions">
            <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
              <button 
                type="submit" 
                className="submit-button"
                disabled={loading}
                style={{
                  flex: onCancel ? '1' : 'none',
                  backgroundColor: loading ? '#9ca3af' : '#6366f1',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    {getButtonText()}
                  </>
                ) : (
                  getButtonText()
                )}
              </button>
              
              {/* Nút Hủy (chỉ hiển thị khi có onCancel) */}
              {onCancel && (
                <button 
                  type="button"
                  onClick={onCancel}
                  className="cancel-button"
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  ❌ Hủy
                </button>
              )}
            </div>
            
            {/* Chỉ hiển thị process steps khi không ở chế độ edit */}
            {!editingData && (
              <div className="process-steps">
                <div className="step active">1. Thêm hồ sơ trẻ</div>
                <div className="step-arrow">→</div>
                <div className="step">2. Sàng lọc sơ bộ</div>
                <div className="step-arrow">→</div>
                <div className="step">3. Game đánh giá</div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChildProfile;