import React, { useState } from 'react';
import { UserRole } from '../../types';
import ParentAuth from '../Onboarding/ParentAuth';
import { useNavigate } from 'react-router-dom';
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

  // ==================== HANDLE ROLE SELECT ====================
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    setFormData({ email: '', password: '', name: '', confirmPassword: '' });
  };

  // ==================== HANDLE INPUT CHANGE ====================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ==================== ĐĂNG NHẬP THẬT - CÓ KIỂM TRA MẬT KHẨU ====================
  const handleClinicianSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('🔐 Bắt đầu đăng nhập với email:', formData.email);
      
      // Gọi API login
      const data = await login(formData.email, formData.password);
      
      console.log('✅ Đăng nhập thành công:', data);

      const { token, user } = data;

      // Kiểm tra dữ liệu trả về
      if (!token || !user) {
        throw new Error('Dữ liệu trả về không hợp lệ');
      }

      // Kiểm tra role có phù hợp không
      if (selectedRole === UserRole.CLINICIAN && user.role !== 'specialist') {
        throw new Error('Tài khoản không phải là chuyên gia');
      }
      if (selectedRole === UserRole.ADMIN && user.role !== 'admin') {
        throw new Error('Tài khoản không phải là admin');
      }

      // Lưu token và user vào localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('neuropath_user_id', user.id);

      // Xác định role UI
      let uiRole = UserRole.CLINICIAN;
      if (user.role === 'admin') uiRole = UserRole.ADMIN;
      else if (user.role === 'parent') uiRole = UserRole.PARENT;

      // Gọi onLogin để cập nhật state trong App
      onLogin(uiRole, user.email, user.full_name, token, user);

      // Chuyển hướng dựa trên role
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'specialist') {
        navigate('/specialist');
      } else {
        // Đối với parent, kiểm tra xem đã có child chưa
        // App.tsx sẽ tự động kiểm tra và chuyển đến ChildProfile nếu chưa có
        navigate('/');
      }
      
    } catch (err: any) {
      console.error('❌ Lỗi đăng nhập:', err);
      
      // Xử lý các loại lỗi khác nhau
      if (err.message) {
        setError(err.message);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Email hoặc mật khẩu không đúng');
      }
    } finally {
      setLoading(false);
    }
  };

  // ==================== DEMO NHANH - CHỈ DÙNG CHO DEVELOPMENT ====================
  const handleQuickLogin = (role: UserRole) => {
    // CHỈ cho phép trong môi trường development
    if (process.env.NODE_ENV !== 'development') {
      setError('Tính năng demo chỉ khả dụng trong môi trường phát triển');
      return;
    }

    // Thêm cảnh báo rõ ràng
    const confirmDemo = window.confirm(
      '⚠️ CẢNH BÁO CHẾ ĐỘ DEMO ⚠️\n\n' +
      'Bạn đang sử dụng nút "Demo nhanh" - tính năng này BỎ QUA hoàn toàn xác thực mật khẩu.\n\n' +
      '• Token giả sẽ được tạo tự động\n' +
      '• Không kiểm tra thông tin đăng nhập\n' +
      '• Chỉ dùng cho mục đích phát triển\n\n' +
      'Bạn có chắc chắn muốn tiếp tục?'
    );
    
    if (!confirmDemo) return;

    // Tạo user demo
    let userData: any = {};
    let redirectPath = '/';
    
    if (role === UserRole.PARENT) {
      userData = {
        id: `parent_${Date.now()}`,
        email: 'parent@demo.com',
        full_name: 'Phụ huynh Demo',
        role: 'parent'
      };
      redirectPath = '/';
    } else if (role === UserRole.CLINICIAN) {
      userData = {
        id: `clinician_${Date.now()}`,
        email: 'specialist@demo.com',
        full_name: 'Chuyên gia Demo',
        role: 'specialist'
      };
      redirectPath = '/specialist';
    } else if (role === UserRole.ADMIN) {
      userData = {
        id: `admin_${Date.now()}`,
        email: 'admin@demo.com',
        full_name: 'Admin Demo',
        role: 'admin'
      };
      redirectPath = '/admin';
    }

    const token = `demo-token-${Date.now()}`;

    // Log cảnh báo rõ ràng trong console
    console.warn('🚨🚨🚨 DEMO MODE: Đăng nhập bằng token giả, KHÔNG qua xác thực! 🚨🚨🚨');
    console.warn('👤 User demo:', userData);
    console.warn('🔑 Token demo:', token);
    console.warn('⚠️ Tính năng này chỉ dùng cho phát triển, không áp dụng cho production!');

    // Lưu vào localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('neuropath_user_id', userData.id);

    // Gọi onLogin
    onLogin(role, userData.email, userData.full_name, token, userData);

    // Chuyển hướng
    navigate(redirectPath);
  };

  // ==================== XỬ LÝ PARENT AUTH SUCCESS ====================
  const handleParentAuthSuccess = (userId: string) => {
    // Lấy thông tin user từ localStorage (ParentAuth sẽ lưu)
    const userDataStr = localStorage.getItem('parent_user');
    let userData;
    
    if (userDataStr) {
      userData = JSON.parse(userDataStr);
    } else {
      userData = {
        id: userId || `parent_${Date.now()}`,
        email: 'parent@example.com',
        full_name: 'Phụ huynh',
        role: 'parent'
      };
    }

    const token = `demo-token-${Date.now()}`;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('neuropath_user_id', userData.id);

    // Gọi onLogin - App.tsx sẽ tự động kiểm tra và chuyển đến ChildProfile nếu chưa có child
    onLogin(UserRole.PARENT, userData.email, userData.full_name, token, userData);
    
    // Chuyển đến trang chính, App.tsx sẽ xử lý việc kiểm tra child
    navigate('/');
  };

  // ==================== QUAY LẠI CHỌN ROLE ====================
  const handleBackToRoleSelection = () => {
    setSelectedRole(null);
    setError('');
    setFormData({ email: '', password: '', name: '', confirmPassword: '' });
  };

  // ==================== RENDER PARENT AUTH ====================
  if (selectedRole === UserRole.PARENT) {
    return (
      <div className="login-screen-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">NP</div>
            <h1 className="login-title">NeuroPath</h1>
            <p className="login-subtitle">Đăng ký / Đăng nhập Phụ huynh</p>
            <button 
              className="back-button"
              onClick={handleBackToRoleSelection}
            >
              ← Quay lại chọn vai trò
            </button>
          </div>
          
          <ParentAuth 
            onAuthSuccess={handleParentAuthSuccess}
          />
        </div>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <div className="login-screen-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">NP</div>
          <h1 className="login-title">NeuroPath</h1>
          <p className="login-subtitle">Hệ thống đánh giá phát triển thần kinh</p>
        </div>

        {!selectedRole ? (
          // ==================== MÀN HÌNH CHỌN VAI TRÒ ====================
          <div className="role-selection">
            <h2 className="role-title">Chọn vai trò của bạn</h2>
            <div className="role-cards">
              {/* PHỤ HUYNH */}
              <div 
                className="role-card"
                onClick={() => handleRoleSelect(UserRole.PARENT)}
              >
                <div className="role-icon">👨‍👩‍👧‍👦</div>
                <h3>Phụ huynh</h3>
                <p>Đăng ký tài khoản, thêm hồ sơ trẻ và làm bài sàng lọc</p>
                {process.env.NODE_ENV === 'development' && (
                  <button 
                    className="quick-login-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickLogin(UserRole.PARENT);
                    }}
                  >
                    Demo nhanh (Dev)
                  </button>
                )}
              </div>
              
              {/* CHUYÊN GIA */}
              <div 
                className="role-card"
                onClick={() => handleRoleSelect(UserRole.CLINICIAN)}
              >
                <div className="role-icon">👨‍⚕️</div>
                <h3>Bác sĩ / Chuyên gia</h3>
                <p>Theo dõi và phân tích kết quả đánh giá</p>
                {process.env.NODE_ENV === 'development' && (
                  <button 
                    className="quick-login-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickLogin(UserRole.CLINICIAN);
                    }}
                  >
                    Demo nhanh (Dev)
                  </button>
                )}
              </div>

              {/* ADMIN */}
              <div 
                className="role-card"
                onClick={() => handleRoleSelect(UserRole.ADMIN)}
              >
                <div className="role-icon">👑</div>
                <h3>Admin</h3>
                <p>Quản lý hệ thống, người dùng và cấu hình</p>
                {process.env.NODE_ENV === 'development' && (
                  <button 
                    className="quick-login-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickLogin(UserRole.ADMIN);
                    }}
                  >
                    Demo nhanh (Dev)
                  </button>
                )}
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="demo-note" style={{ 
                marginTop: '2rem', 
                padding: '1rem', 
                background: '#fef3c7', 
                borderRadius: '8px',
                border: '2px solid #f59e0b'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                  <h4 style={{ margin: 0, color: '#92400e' }}>CHẾ ĐỘ PHÁT TRIỂN</h4>
                </div>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#92400e' }}>
                  <strong>Nút "Demo nhanh (Dev)" BỎ QUA xác thực mật khẩu</strong> và tạo token giả.
                  Chỉ sử dụng cho mục đích phát triển. Khi triển khai thật, các nút này sẽ tự động biến mất.
                </p>
              </div>
            )}
          </div>
        ) : (
          // ==================== FORM ĐĂNG NHẬP CHUYÊN GIA / ADMIN ====================
          <div className="auth-form-container">
            <div className="auth-header">
              <button 
                className="back-button"
                onClick={handleBackToRoleSelection}
              >
                ← Quay lại chọn vai trò
              </button>
              <h2>
                {selectedRole === UserRole.CLINICIAN ? 'Đăng nhập Chuyên gia' : 'Đăng nhập Admin'}
              </h2>
            </div>
            
            <form onSubmit={handleClinicianSubmit} className="auth-form">
              {error && (
                <div className="error-message" style={{ 
                  color: '#dc2626', 
                  background: '#fee2e2', 
                  padding: '0.75rem', 
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
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
                  autoComplete="email"
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
                  autoComplete="current-password"
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
                  transition: 'background 0.2s'
                }}
              >
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <a 
                  href="/forgot-password" 
                  style={{ color: '#6366f1', fontSize: '0.9rem', textDecoration: 'none' }}
                >
                  Quên mật khẩu?
                </a>
              </div>
            </form>
            
            <div className="info-note" style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              background: '#e0f2fe', 
              borderRadius: '8px' 
            }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#0369a1' }}>
                💡 <strong>Đăng nhập thật:</strong> Sử dụng email và mật khẩu đã đăng ký.
                {process.env.NODE_ENV === 'development' && (
                  <span> Nút "Demo nhanh" ở màn hình trước chỉ dành cho phát triển.</span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;