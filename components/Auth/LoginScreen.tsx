import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from '../../types';
import ParentAuth from '../Onboarding/ParentAuth';
import { login } from '../../services/authService';
import '../../styles.css';

interface LoginScreenProps {
  onLogin: (role: UserRole, email?: string, name?: string, token?: string, userData?: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    setFormData({ email: '', password: '', name: '', confirmPassword: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ==================== LOGIN CHUNG CHO TẤT CẢ CÁC ROLE ====================
  const handleLogin = async (email: string, password: string, expectedRole: UserRole) => {
    setLoading(true);
    setError('');

    try {
      const data = await login(email, password);
      const { token, user } = data;

      if (!token || !user) {
        throw new Error('Dữ liệu trả về không hợp lệ');
      }

      // 1. CHUẨN HÓA ROLE: Chuyển role từ API về định dạng Enum của Frontend
      let uiRole: UserRole;
      const apiRole = user.role?.toLowerCase();

      if (apiRole === 'admin') uiRole = UserRole.ADMIN;
      else if (apiRole === 'specialist') uiRole = UserRole.CLINICIAN;
      else uiRole = UserRole.PARENT;

      // 2. KIỂM TRA ROLE: So khớp với vai trò mà người dùng đã chọn ở màn hình trước
      if (expectedRole !== uiRole) {
        const roleNames = {
          [UserRole.ADMIN]: 'Admin',
          [UserRole.CLINICIAN]: 'Chuyên gia',
          [UserRole.PARENT]: 'Phụ huynh'
        };
        throw new Error(`Tài khoản này không có quyền truy cập vai trò ${roleNames[expectedRole]}`);
      }

      // 3. GỌI ONLOGIN: Truyền đúng trường dữ liệu từ API (full_name)
      // Lưu ý: Đảm bảo userData chứa toàn bộ object user để dùng cho Dashboard
      onLogin(uiRole, user.email, user.full_name || user.username, token, user);
      
    } catch (err: any) {
      console.error('❌ Lỗi đăng nhập:', err);
      setError(err.message || 'Email hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  // ==================== SUBMIT CHO CLINICIAN/ADMIN ====================
  const handleClinicianSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin(formData.email, formData.password, selectedRole!);
  };

  // ==================== SUBMIT CHO PARENT ====================
  const handleParentSubmit = async (email: string, password: string) => {
    await handleLogin(email, password, UserRole.PARENT);
  };

  // ==================== XỬ LÝ PARENT AUTH SUCCESS ====================
  const handleParentAuthSuccess = (userId: string, email: string, password: string) => {
    // Gọi login thật với email và password từ form đăng ký
    handleParentSubmit(email, password);
  };

  const handleBackToRoleSelection = () => {
    setSelectedRole(null);
    setError('');
    setFormData({ email: '', password: '', name: '', confirmPassword: '' });
  };

  const handleRoleCardClick = (role: UserRole) => {
    handleRoleSelect(role);
  };

  // ==================== RENDER ====================
  if (selectedRole === UserRole.PARENT) {
    return (
      <div className="login-screen-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">NP</div>
            <h1 className="login-title">NeuroPath</h1>
            <p className="login-subtitle">Đăng nhập Phụ huynh</p>
            <button className="back-button" onClick={handleBackToRoleSelection}>
              ← Quay lại chọn vai trò
            </button>
          </div>
          
          {/* Form đăng nhập cho Parent */}
          <form onSubmit={async (e) => {
            e.preventDefault();
            await handleParentSubmit(formData.email, formData.password);
          }} className="auth-form">
            {error && (
              <div className="error-message" style={{ 
                color: '#dc2626', 
                background: '#fee2e2', 
                padding: '0.75rem', 
                borderRadius: '8px',
                marginBottom: '1rem',
                border: '1px solid #fecaca'
              }}>
                ❌ {error}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="parent-email">Email</label>
              <input
                type="email"
                id="parent-email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="nhap@email.com"
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="parent-password">Mật khẩu</label>
              <input
                type="password"
                id="parent-password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="••••••"
                disabled={loading}
              />
            </div>
            
            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
              style={{
                background: loading ? '#9ca3af' : '#6366f1',
                cursor: loading ? 'not-allowed' : 'pointer',
                padding: '0.75rem',
                fontSize: '1rem',
                fontWeight: '600',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                width: '100%'
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span className="spinner-small" style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #ffffff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}></span>
                  Đang xử lý...
                </span>
              ) : 'Đăng nhập'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/forgot-password" style={{ color: '#6366f1', fontSize: '0.9rem', textDecoration: 'none' }}>
                Quên mật khẩu?
              </Link>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Chưa có tài khoản? {' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  Đăng ký
                </button>
              </span>
            </div>
          </form>
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
              {/* Parent Card */}
              <div 
                className="role-card" 
                onClick={() => handleRoleCardClick(UserRole.PARENT)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && handleRoleCardClick(UserRole.PARENT)}
              >
                <div className="role-icon">👨‍👩‍👧‍👦</div>
                <h3>Phụ huynh</h3>
                <p>Đăng nhập để theo dõi sự phát triển của bé</p>
              </div>

              {/* Clinician Card */}
              <div 
                className="role-card" 
                onClick={() => handleRoleCardClick(UserRole.CLINICIAN)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && handleRoleCardClick(UserRole.CLINICIAN)}
              >
                <div className="role-icon">👨‍⚕️</div>
                <h3>Bác sĩ / Chuyên gia</h3>
                <p>Theo dõi và phân tích kết quả đánh giá</p>
              </div>

              {/* Admin Card */}
              <div 
                className="role-card" 
                onClick={() => handleRoleCardClick(UserRole.ADMIN)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && handleRoleCardClick(UserRole.ADMIN)}
              >
                <div className="role-icon">👑</div>
                <h3>Admin</h3>
                <p>Quản lý hệ thống, người dùng và cấu hình</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="auth-form-container">
            <div className="auth-header">
              <button className="back-button" onClick={handleBackToRoleSelection}>
                ← Quay lại chọn vai trò
              </button>
              <h2>{selectedRole === UserRole.CLINICIAN ? 'Đăng nhập Chuyên gia' : 'Đăng nhập Admin'}</h2>
            </div>
            <form onSubmit={handleClinicianSubmit} className="auth-form">
              {error && (
                <div className="error-message" style={{ 
                  color: '#dc2626', 
                  background: '#fee2e2', 
                  padding: '0.75rem', 
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  border: '1px solid #fecaca'
                }}>
                  ❌ {error}
                </div>
              )}
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="nhap@email.com"
                  disabled={loading}
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
                  placeholder="••••••"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
                style={{
                  background: loading ? '#9ca3af' : '#6366f1',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  width: '100%'
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span className="spinner-small" style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #ffffff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }}></span>
                    Đang xử lý...
                  </span>
                ) : 'Đăng nhập'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Link to="/forgot-password" style={{ color: '#6366f1', fontSize: '0.9rem', textDecoration: 'none' }}>
                  Quên mật khẩu?
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;