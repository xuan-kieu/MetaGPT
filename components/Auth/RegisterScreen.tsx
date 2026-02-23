import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from '../../types';
import { register } from '../../services/authService';
import '../../styles.css';

interface RegisterScreenProps {
  onLogin: (role: UserRole, email?: string, name?: string, token?: string, userData?: any) => void;
}

interface ValidationErrors {
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
  general?: string;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Họ tên không được để trống';
        if (value.trim().length < 2) return 'Họ tên phải có ít nhất 2 ký tự';
        if (value.trim().length > 100) return 'Họ tên không được vượt quá 100 ký tự';
        return '';

      case 'username':
        if (!value.trim()) return 'Tên đăng nhập không được để trống';
        if (value.trim().length < 3) return 'Tên đăng nhập phải có ít nhất 3 ký tự';
        if (value.trim().length > 50) return 'Tên đăng nhập không được vượt quá 50 ký tự';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          return 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới';
        }
        return '';

      case 'email':
        if (!value.trim()) return 'Email không được để trống';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Email không đúng định dạng';
        }
        return '';

      case 'phone':
        if (!value.trim()) {
          return ''; // Phone có thể để trống vì trong SQL không có NOT NULL
        }
        // Regex cho số điện thoại Việt Nam
        const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
          return 'Số điện thoại không đúng định dạng (VD: 0912345678 hoặc +84912345678)';
        }
        return '';

      case 'password':
        if (!value) return 'Mật khẩu không được để trống';
        if (value.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
        if (value.length > 100) return 'Mật khẩu không được vượt quá 100 ký tự';
        return '';

      case 'confirmPassword':
        if (!value) return 'Vui lòng xác nhận mật khẩu';
        if (value !== formData.password) return 'Mật khẩu xác nhận không khớp';
        return '';

      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    newErrors.fullName = validateField('fullName', formData.fullName);
    newErrors.username = validateField('username', formData.username);
    newErrors.email = validateField('email', formData.email);
    newErrors.phone = validateField('phone', formData.phone);
    newErrors.password = validateField('password', formData.password);
    newErrors.confirmPassword = validateField('confirmPassword', formData.confirmPassword);

    setErrors(newErrors);
    
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validate field on change if it's been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    // Validate all fields
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      console.log('🔐 Bắt đầu đăng ký với email:', formData.email);
      
      // Chuẩn bị dữ liệu đăng ký, chỉ gửi phone nếu có giá trị
      const registerData: any = {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        full_name: formData.fullName.trim(),
        role: 'parent'
      };

      // Chỉ thêm phone vào request nếu có giá trị
      if (formData.phone.trim()) {
        registerData.phone = formData.phone.trim();
      }
      
      const data = await register(registerData);

      console.log('✅ Đăng ký thành công:', data);

      const { token, user } = data;

      onLogin(UserRole.PARENT, user.email, user.full_name, token, user);
      
      // Chuyển hướng sau khi đăng ký thành công
      setTimeout(() => {
        navigate('/create-child-profile');
      }, 100);
      
    } catch (err: any) {
      console.error('❌ Lỗi đăng ký:', err);
      
      // Xử lý lỗi từ server
      if (err.response?.data) {
        const serverError = err.response.data;
        
        // Lỗi validation chi tiết từ server
        if (serverError.details && Array.isArray(serverError.details)) {
          setErrors({ general: serverError.details.join(', ') });
        } 
        // Lỗi field cụ thể
        else if (serverError.field) {
          const fieldError: ValidationErrors = {};
          fieldError[serverError.field as keyof ValidationErrors] = serverError.error;
          setErrors(fieldError);
        }
        // Lỗi chung
        else if (serverError.error) {
          setErrors({ general: serverError.error });
        } else {
          setErrors({ general: 'Đăng ký thất bại. Vui lòng thử lại.' });
        }
      } else if (err.message) {
        setErrors({ general: err.message });
      } else {
        setErrors({ general: 'Đăng ký thất bại. Vui lòng thử lại.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const getInputClassName = (fieldName: keyof ValidationErrors) => {
    const baseClass = 'form-input';
    if (touched[fieldName] && errors[fieldName]) {
      return `${baseClass} input-error`;
    }
    return baseClass;
  };

  return (
    <div className="login-screen-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">NP</div>
          <h1 className="login-title">NeuroPath</h1>
          <p className="login-subtitle">Đăng ký tài khoản Phụ huynh</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Hiển thị lỗi chung */}
          {errors.general && (
            <div className="error-message" style={{ 
              color: '#dc2626', 
              background: '#fee2e2', 
              padding: '0.75rem', 
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '1px solid #fecaca',
              fontSize: '0.9rem'
            }}>
              ❌ {errors.general}
            </div>
          )}

          {/* Họ và tên */}
          <div className="form-group">
            <label htmlFor="fullName">
              Họ và tên <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Nhập họ tên của bạn"
              disabled={loading}
              className={getInputClassName('fullName')}
              style={touched.fullName && errors.fullName ? { borderColor: '#dc2626' } : {}}
            />
            {touched.fullName && errors.fullName && (
              <div className="field-error" style={{
                color: '#dc2626',
                fontSize: '0.8rem',
                marginTop: '0.25rem'
              }}>
                ⚠️ {errors.fullName}
              </div>
            )}
          </div>

          {/* Tên đăng nhập */}
          <div className="form-group">
            <label htmlFor="username">
              Tên đăng nhập <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Nhập tên đăng nhập"
              disabled={loading}
              className={getInputClassName('username')}
              style={touched.username && errors.username ? { borderColor: '#dc2626' } : {}}
            />
            {touched.username && errors.username && (
              <div className="field-error" style={{
                color: '#dc2626',
                fontSize: '0.8rem',
                marginTop: '0.25rem'
              }}>
                ⚠️ {errors.username}
              </div>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">
              Email <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="nhap@email.com"
              disabled={loading}
              className={getInputClassName('email')}
              style={touched.email && errors.email ? { borderColor: '#dc2626' } : {}}
            />
            {touched.email && errors.email && (
              <div className="field-error" style={{
                color: '#dc2626',
                fontSize: '0.8rem',
                marginTop: '0.25rem'
              }}>
                ⚠️ {errors.email}
              </div>
            )}
          </div>

          {/* Số điện thoại (Mới thêm) */}
          <div className="form-group">
            <label htmlFor="phone">
              Số điện thoại <span style={{ color: '#64748b', fontSize: '0.8rem' }}>(Không bắt buộc)</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="0912345678 hoặc +84912345678"
              disabled={loading}
              className={getInputClassName('phone')}
              style={touched.phone && errors.phone ? { borderColor: '#dc2626' } : {}}
            />
            {touched.phone && errors.phone && (
              <div className="field-error" style={{
                color: '#dc2626',
                fontSize: '0.8rem',
                marginTop: '0.25rem'
              }}>
                ⚠️ {errors.phone}
              </div>
            )}
            {!errors.phone && (
              <div style={{
                color: '#64748b',
                fontSize: '0.75rem',
                marginTop: '0.25rem'
              }}>
                Nhập số điện thoại Việt Nam (bắt đầu bằng 0 hoặc +84)
              </div>
            )}
          </div>

          {/* Mật khẩu */}
          <div className="form-group">
            <label htmlFor="password">
              Mật khẩu <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="•••••• (ít nhất 6 ký tự)"
              disabled={loading}
              className={getInputClassName('password')}
              style={touched.password && errors.password ? { borderColor: '#dc2626' } : {}}
            />
            {touched.password && errors.password && (
              <div className="field-error" style={{
                color: '#dc2626',
                fontSize: '0.8rem',
                marginTop: '0.25rem'
              }}>
                ⚠️ {errors.password}
              </div>
            )}
          </div>

          {/* Xác nhận mật khẩu */}
          <div className="form-group">
            <label htmlFor="confirmPassword">
              Xác nhận mật khẩu <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="••••••"
              disabled={loading}
              className={getInputClassName('confirmPassword')}
              style={touched.confirmPassword && errors.confirmPassword ? { borderColor: '#dc2626' } : {}}
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <div className="field-error" style={{
                color: '#dc2626',
                fontSize: '0.8rem',
                marginTop: '0.25rem'
              }}>
                ⚠️ {errors.confirmPassword}
              </div>
            )}
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
              width: '100%',
              marginTop: '1rem',
              opacity: loading ? 0.7 : 1
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
            ) : 'Đăng ký'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Đã có tài khoản?{' '}
              <Link to="/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
                Đăng nhập
              </Link>
            </span>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link to="/forgot-password" style={{ color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'none' }}>
              Quên mật khẩu?
            </Link>
          </div>  
        </form>
      </div>
    </div>
  );
};

export default RegisterScreen;