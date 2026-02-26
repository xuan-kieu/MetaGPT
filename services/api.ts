import axios from 'axios';
console.log("API URL:", import.meta.env.VITE_API_URL);
// Tạo instance axios với baseURL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000, // 10 giây timeout
});

// Interceptor cho request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Interceptor cho response
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      // Token không hợp lệ hoặc hết hạn
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Không tự động redirect ở đây, để component xử lý
    }
    
    return Promise.reject(error);
  }
);

export default api;