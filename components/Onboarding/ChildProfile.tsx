import React, { useState, useEffect } from 'react';
import * as db from '../../services/dbService';
import { useNavigate } from 'react-router-dom';
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
}

const ChildProfile: React.FC<ChildProfileProps> = ({ onComplete }) => {
  const navigate = useNavigate();
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

  // Tính tuổi tự động khi ngày sinh thay đổi
  useEffect(() => {
    if (profile.birthDate) {
      calculateAge(profile.birthDate);
    }
  }, [profile.birthDate]);

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (today.getDate() < birth.getDate()) {
      months--;
      if (months < 0) {
        years--;
        months = 11;
      }
    }
    
    setCalculatedAge({ years, months });
  };

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
    
    const birthDate = new Date(profile.birthDate);
    const today = new Date();
    if (birthDate > today) {
      setError('Ngày sinh không được lớn hơn ngày hiện tại!');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Lấy user ID từ localStorage - thử nhiều cách
      let userId = localStorage.getItem('neuropath_user_id');
      
      // Nếu không có, thử lấy từ user object
      if (!userId) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            userId = userData.id;
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
      }

      console.log('🔍 User ID from localStorage:', userId);
      
      if (!userId) {
        setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Tìm user trong DB
      let dbUser = db.getUserById(userId);
      
      // Nếu không tìm thấy, thử tạo lại user từ thông tin trong localStorage
      if (!dbUser) {
        console.log('⚠️ User not found in DB, attempting to recreate from localStorage');
        
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            
            // Tạo lại user trong DB
            dbUser = db.createUser({
              username: userData.email?.split('@')[0] || `user_${Date.now()}`,
              password_hash: 'hashed_password_demo',
              email: userData.email,
              phone: null,
              full_name: userData.full_name || userData.name || 'User',
              role: userData.role || 'parent',
            });
            
            console.log('✅ User recreated in DB:', dbUser);
          } catch (e) {
            console.error('Error recreating user:', e);
          }
        }
      }
      
      console.log('👤 DB User found:', dbUser);
      
      if (!dbUser) {
        setError('Không tìm thấy thông tin người dùng trong cơ sở dữ liệu. Vui lòng đăng nhập lại.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Kiểm tra role của user
      if (dbUser.role !== 'parent') {
        setError('Chỉ phụ huynh mới có thể tạo hồ sơ trẻ.');
        return;
      }

      // Tạo child trong DB
      console.log('📝 Creating child with data:', {
        full_name: profile.name,
        birth_date: profile.birthDate,
        gender: profile.gender,
        region: profile.region || null,
        primary_language: profile.primaryLanguage,
        parent_id: dbUser.id,
        created_by: dbUser.id,
      });

      const newDbChild = db.createChild({
        full_name: profile.name,
        birth_date: profile.birthDate,
        gender: profile.gender,
        region: profile.region || null,
        primary_language: profile.primaryLanguage,
        notes: null,
        parent_id: dbUser.id,
        created_by: dbUser.id,
      });

      console.log('✅ Child created in DB:', newDbChild);

      // Chuẩn bị dữ liệu trẻ cho UI
      const childData: ChildProfileData = {
        id: newDbChild.id,
        name: newDbChild.full_name,
        gender: newDbChild.gender || 'other',
        birthDate: newDbChild.birth_date,
        region: newDbChild.region || '',
        primaryLanguage: newDbChild.primary_language || 'vi',
        age: calculatedAge || undefined,
      };

      // Lưu child ID vào localStorage
      localStorage.setItem('neuropath_child_id', newDbChild.id);
      localStorage.setItem('current_child', JSON.stringify(childData));

      // Gọi callback onComplete nếu có
      if (onComplete) {
        onComplete(childData);
      }

    } catch (error) {
      console.error('❌ Error saving child profile:', error);
      setError('Có lỗi xảy ra khi lưu hồ sơ: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="child-profile-container">
      <div className="profile-card">
        <h2 className="profile-title">Thêm hồ sơ trẻ</h2>
        <p className="profile-subtitle">Vui lòng cung cấp thông tin chi tiết về trẻ</p>
        
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
              placeholder="Nhập họ tên đầy đủ của trẻ"
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
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
              style={{
                backgroundColor: loading ? '#9ca3af' : '#6366f1',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Đang lưu...
                </>
              ) : (
                '✅ Lưu hồ sơ và tiếp tục'
              )}
            </button>
            
            <div className="process-steps">
              <div className="step active">1. Thêm hồ sơ trẻ</div>
              <div className="step-arrow">→</div>
              <div className="step">2. Sàng lọc sơ bộ</div>
              <div className="step-arrow">→</div>
              <div className="step">3. Game đánh giá</div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChildProfile;