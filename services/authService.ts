import api from './api';

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    full_name: string;
    role: 'parent' | 'specialist' | 'admin';
  };
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    console.log('📤 Gửi request login đến:', '/auth/login');
    console.log('📦 Dữ liệu gửi đi:', { email, password: '***' });
    
    const response = await api.post('/auth/login', { email, password });
    
    console.log('📥 Response nhận được:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    
    // API trả về { token, user } trực tiếp, không có .data
    return response.data;
  } catch (error: any) {
    console.error('❌ Lỗi login chi tiết:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    });
    
    // Ném lỗi với message phù hợp
    if (error.response?.status === 401) {
      throw new Error(error.response.data?.error || 'Email hoặc mật khẩu không đúng');
    } else if (error.response?.status === 404) {
      throw new Error('Email không tồn tại trong hệ thống');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
    } else {
      throw new Error(error.response?.data?.error || 'Đăng nhập thất bại. Vui lòng thử lại.');
    }
  }
};

export const forgotPassword = (email: string) => {
  return api.post('/auth/forgot-password', { email });
};

export const resetPassword = (token: string, newPassword: string) => {
  return api.post('/auth/reset-password', { token, newPassword });
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('neuropath_user_id');
  localStorage.removeItem('neuropath_child_id');
  window.location.href = '/login';
};