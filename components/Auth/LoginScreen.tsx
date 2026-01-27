import React, { useState } from 'react';
import { UserRole } from '../../types';
import ParentAuth from '../Onboarding/ParentAuth';
import '../../styles.css';

interface LoginScreenProps {
  onLogin: (role: UserRole, email?: string, name?: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClinicianSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    
    try {
      // Giả lập API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Tạo user clinician
      const userData = {
        id: `clinician_${Date.now()}`,
        email: formData.email || 'clinician@example.com',
        name: formData.name || 'Bác sĩ Demo',
        role: UserRole.CLINICIAN
      };

      localStorage.setItem('neuropath_user', JSON.stringify(userData));
      onLogin(UserRole.CLINICIAN, formData.email, formData.name);
      
    } catch (error) {
      console.error('Login error:', error);
      alert('Đăng nhập thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    // Login nhanh cho demo
    const userData = {
      id: `user_${Date.now()}`,
      email: role === UserRole.PARENT ? 'parent@example.com' : 'clinician@example.com',
      name: role === UserRole.PARENT ? 'Phụ huynh Demo' : 'Bác sĩ Demo',
      role
    };

    localStorage.setItem('neuropath_user', JSON.stringify(userData));
    onLogin(role);
  };

  // Nếu chọn vai trò phụ huynh, hiển thị ParentAuth component
  if (selectedRole === UserRole.PARENT) {
    return (
      <div className="login-screen-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">NP</div>
            <h1 className="login-title">NeuroPath</h1>
            <p className="login-subtitle">Đăng nhập/Đăng ký Phụ huynh</p>
            <button 
              className="back-button"
              onClick={() => setSelectedRole(null)}
            >
              ← Quay lại chọn vai trò
            </button>
          </div>
          
          <ParentAuth 
            onAuthSuccess={(userId) => {
              // Lấy thông tin user từ localStorage
              const userData = localStorage.getItem('parent_user');
              if (userData) {
                const user = JSON.parse(userData);
                onLogin(UserRole.PARENT, user.email, user.name);
              } else {
                onLogin(UserRole.PARENT);
              }
            }} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">NP</div>
          <h1 className="login-title">NeuroPath</h1>
          <p className="login-subtitle">Hệ thống đánh giá phát triển thần kinh</p>
        </div>

        {!selectedRole ? (
          <div className="role-selection">
            <h2 className="role-title">Chọn vai trò của bạn</h2>
            <div className="role-cards">
              <div 
                className="role-card"
                onClick={() => handleRoleSelect(UserRole.PARENT)}
              >
                <div className="role-icon">👨‍👩‍👧‍👦</div>
                <h3>Phụ huynh</h3>
                <p>Đăng ký tài khoản, thêm hồ sơ trẻ và làm bài sàng lọc</p>
                <button 
                  className="quick-login-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickLogin(UserRole.PARENT);
                  }}
                >
                  Demo nhanh
                </button>
              </div>
              
              <div 
                className={`role-card ${selectedRole === UserRole.CLINICIAN ? 'selected' : ''}`}
                onClick={() => handleRoleSelect(UserRole.CLINICIAN)}
              >
                <div className="role-icon">👨‍⚕️</div>
                <h3>Bác sĩ / Chuyên gia</h3>
                <p>Theo dõi và phân tích kết quả đánh giá</p>
                <button 
                  className="quick-login-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickLogin(UserRole.CLINICIAN);
                  }}
                >
                  Demo nhanh
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="auth-form-container">
            <div className="auth-header">
              <button 
                className="back-button"
                onClick={() => setSelectedRole(null)}
              >
                ← Quay lại chọn vai trò
              </button>
              <h2>Đăng nhập Chuyên gia</h2>
            </div>
            
            <form onSubmit={handleClinicianSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="bacsy@example.com"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Mật khẩu</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Ít nhất 6 ký tự"
                />
              </div>
              
              <button 
                type="submit" 
                className="login-submit-btn"
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>
            
            <div className="demo-note">
              <p>💡 <strong>Lưu ý demo:</strong> Bạn có thể sử dụng "Demo nhanh" hoặc nhập bất kỳ email/mật khẩu nào</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;