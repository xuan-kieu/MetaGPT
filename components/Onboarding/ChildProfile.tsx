import React, { useState, useEffect } from 'react';
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
  const [profile, setProfile] = useState<ChildProfileData>({
    name: '',
    gender: 'male',
    birthDate: '',
    region: '',
    primaryLanguage: 'vi'
  });
  
  const [calculatedAge, setCalculatedAge] = useState<{years: number; months: number} | null>(null);
  const [loading, setLoading] = useState(false);

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
    
    // Điều chỉnh nếu tháng hiện tại nhỏ hơn tháng sinh
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // Điều chỉnh nếu ngày hiện tại nhỏ hơn ngày sinh
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
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!profile.name.trim()) {
      alert('Vui lòng nhập họ tên trẻ!');
      return false;
    }
    
    if (!profile.birthDate) {
      alert('Vui lòng chọn ngày sinh!');
      return false;
    }
    
    // Kiểm tra ngày sinh hợp lệ
    const birthDate = new Date(profile.birthDate);
    const today = new Date();
    if (birthDate > today) {
      alert('Ngày sinh không được lớn hơn ngày hiện tại!');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Giả lập API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Lấy thông tin người dùng từ localStorage
      const userData = localStorage.getItem('neuropath_user');
      const user = userData ? JSON.parse(userData) : null;
      
      if (!user) {
        alert('Vui lòng đăng nhập trước!');
        return;
      }
      
      // Tạo ID cho trẻ
      const childId = `child_${Date.now()}`;
      
      // Chuẩn bị dữ liệu trẻ
      const childData = {
        ...profile,
        id: childId,
        age: calculatedAge,
        parentId: user.id,
        createdAt: new Date().toISOString(),
        screenerCompleted: false
      };
      
      // Lấy danh sách trẻ hiện tại hoặc tạo mới
      const existingChildren = localStorage.getItem('children_profiles');
      let children = existingChildren ? JSON.parse(existingChildren) : [];
      
      // Thêm trẻ mới vào danh sách
      children.push(childData);
      localStorage.setItem('children_profiles', JSON.stringify(children));
      
      // Lưu trẻ hiện tại đang được chọn
      localStorage.setItem('current_child', JSON.stringify(childData));
      
      // Gọi callback onComplete nếu có
      if (onComplete) {
        onComplete(childData);
      }
      
      alert('Thêm hồ sơ trẻ thành công! Tiếp theo: Làm bài sàng lọc sơ bộ.');
      
    } catch (error) {
      console.error('Error saving child profile:', error);
      alert('Có lỗi xảy ra khi lưu hồ sơ!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="child-profile-container">
      <div className="profile-card">
        <h2 className="profile-title">Thêm hồ sơ trẻ</h2>
        <p className="profile-subtitle">Vui lòng cung cấp thông tin chi tiết về trẻ</p>
        
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