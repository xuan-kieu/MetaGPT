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
      data: response.data
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Lỗi login chi tiết:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
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
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: 'parent' | 'specialist';
}

export interface RegisterResponse {
  message: string;
  token: string;
  user: {
    id: string;
    username?: string;
    email: string;
    full_name: string;
    role: 'parent' | 'specialist' | 'admin';
  };
}

export const register = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
  try {
    console.log('📤 Gửi request register đến:', '/auth/register');
    console.log('📦 Dữ liệu gửi đi:', {
      ...data,
      password: '***'
    });

    const response = await api.post('/auth/register', data);

    console.log('📥 Response register:', {
      status: response.status,
      data: response.data
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Lỗi register chi tiết:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    if (error.response?.status === 400) {
      throw new Error(error.response.data?.error || 'Email đã tồn tại');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Không thể kết nối đến server');
    } else {
      throw new Error(error.response?.data?.error || 'Đăng ký thất bại');
    }
  }
};