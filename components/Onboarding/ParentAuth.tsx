import React, { useState } from 'react';
import '../../styles.css';

interface ParentAuthProps {
  onAuthSuccess: (userId: string) => void;
}

const ParentAuth: React.FC<ParentAuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        alert('Mật khẩu không khớp!');
        return false;
      }
      if (!formData.email && !formData.phone) {
        alert('Vui lòng nhập email hoặc số điện thoại!');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Giả lập API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Tạo userId
      const userId = `parent_${Date.now()}`;
      
      // Lưu thông tin vào localStorage
      const userData = {
        id: userId,
        email: formData.email,
        phone: formData.phone,
        name: formData.name || 'Phụ huynh',
        role: 'parent',
        isAuthenticated: true,
        registeredAt: new Date().toISOString()
      };
      
      localStorage.setItem('parent_user', JSON.stringify(userData));
      
      // Cũng lưu vào neuropath_user để thống nhất
      localStorage.setItem('neuropath_user', JSON.stringify({
        id: userId,
        email: formData.email,
        name: formData.name || 'Phụ huynh',
        role: 'parent'
      }));
      
      onAuthSuccess(userId);
      
    } catch (error) {
      console.error('Auth error:', error);
      alert(isLogin ? 'Đăng nhập thất bại!' : 'Đăng ký thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">
          {isLogin ? 'Đăng nhập Phụ huynh' : 'Đăng ký tài khoản Phụ huynh'}
        </h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Họ tên phụ huynh *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
                placeholder="Nhập họ tên đầy đủ"
              />
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
              required={!formData.phone}
              placeholder="example@gmail.com"
            />
            <div className="input-note">hoặc sử dụng số điện thoại bên dưới</div>
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Số điện thoại</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required={!formData.email}
              placeholder="0987654321"
              pattern="[0-9]{10,11}"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Mật khẩu *</label>
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
          
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required={!isLogin}
                placeholder="Nhập lại mật khẩu"
              />
            </div>
          )}
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
          </button>
        </form>
        
        <div className="auth-switch">
          <p>
            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <button 
              type="button"
              className="switch-button"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? ' Đăng ký ngay' : ' Đăng nhập'}
            </button>
          </p>
        </div>
        
        <div className="auth-note">
          <p>✅ Sau khi đăng nhập, bạn sẽ được hướng dẫn thêm hồ sơ trẻ và làm bài sàng lọc sơ bộ.</p>
        </div>
      </div>
    </div>
  );
};

export default ParentAuth;