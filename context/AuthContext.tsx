import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { User as DBUser } from '../types';
import * as db from '../services/dbService';

// ============================================
// ĐỊNH NGHĪA KIỂU
// ============================================

export interface UIUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginApiUser {
  id: string;
  email: string;
  full_name?: string;
  name?: string;
  role: 'parent' | 'specialist' | 'admin' | 'teacher';
}

interface AuthContextType {
  currentUser: UIUser | null;
  isLoading: boolean;
  handleLogin: (role: UserRole, email?: string, name?: string, token?: string, userData?: LoginApiUser) => void;
  handleLogout: () => void;
  isAuthenticated: boolean;
}

// ============================================
// TẠO CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// HẰNG SỐ
// ============================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ============================================
// MAP DỮ LIỆU
// ============================================

const mapDBUserToUIUser = (dbUser: DBUser): UIUser => {
  let uiRole: UserRole;
  switch (dbUser.role) {
    case 'parent':
      uiRole = UserRole.PARENT;
      break;
    case 'specialist':
      uiRole = UserRole.CLINICIAN;
      break;
    case 'admin':
      uiRole = UserRole.ADMIN;
      break;
    default:
      uiRole = UserRole.PARENT;
  }
  
  return {
    id: dbUser.id,
    email: dbUser.email || '',
    name: dbUser.full_name,
    role: uiRole,
  };
};

const mapUIUserToDBUser = (uiUser: UIUser, role: string): Omit<DBUser, 'id' | 'created_at' | 'updated_at'> => ({
  username: uiUser.email?.split('@')[0] || `user_${Date.now()}`,
  password_hash: 'hashed_password_demo',
  email: uiUser.email,
  phone: null,
  full_name: uiUser.name,
  role: role as 'parent' | 'specialist' | 'admin',
});

// ============================================
// AUTH PROVIDER COMPONENT
// ============================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UIUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // ============================================
  // VALIDATE TOKEN VỚI BACKEND
  // ============================================
  const validateTokenWithBackend = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/validate`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  // ============================================
  // KIỂM TRA AUTHENTICATION
  // ============================================
  const checkAuth = useCallback(async () => {
    console.log('🔍 Kiểm tra authentication...');
    
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      console.log('ℹ️ Không tìm thấy token/user');
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    try {
      // Validate token với backend
      const isValid = await validateTokenWithBackend(token);
      
      if (!isValid) {
        console.warn('⚠️ Token invalid, clearing storage');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('neuropath_user_id');
        localStorage.removeItem('neuropath_child_id');
        setCurrentUser(null);
        setIsLoading(false);
        return;
      }

      const uiUser = JSON.parse(userStr) as UIUser;
      
      // Validate UIUser has required fields
      if (!uiUser.id || !uiUser.email || !uiUser.role) {
        throw new Error('Invalid user data');
      }

      // Sync to DB if needed - tự động tạo user trong DB nếu chưa có
      const dbUser = db.getUserById(uiUser.id);
      if (!dbUser) {
        console.log('📝 User not in DB, syncing...');
        const dbRole = uiUser.role === UserRole.PARENT ? 'parent' : 
                       uiUser.role === UserRole.CLINICIAN ? 'specialist' : 'admin';
        db.createUser({
          username: uiUser.email.split('@')[0],
          password_hash: 'hashed_password_demo',
          email: uiUser.email,
          phone: null,
          full_name: uiUser.name,
          role: dbRole,
        });
        console.log('✅ User synced to DB');
      }

      setCurrentUser(uiUser);
      console.log('✅ Đã khôi phục phiên cho user:', uiUser.name);
      
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('neuropath_user_id');
      localStorage.removeItem('neuropath_child_id');
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []); // Đã xóa navigate khỏi dependency array

  // ============================================
  // ĐĂNG NHẬP
  // ============================================
  const handleLogin = useCallback((role: UserRole, email?: string, name?: string, token?: string, userData?: LoginApiUser) => {
    console.log('🔐 handleLogin nhận được:', { role, email, name, token: !!token, userData });

    if (token) {
      localStorage.setItem('token', token);
    }

    if (userData) {
      console.log('📦 User data from login:', userData);
      console.log('📦 User role from API:', userData.role);

      // Map API role to UI role
      let uiRole: UserRole;
      switch (userData.role) {
        case 'parent':
          uiRole = UserRole.PARENT;
          break;
        case 'specialist':
          uiRole = UserRole.CLINICIAN;
          break;
        case 'admin':
          uiRole = UserRole.ADMIN;
          break;
        default:
          uiRole = UserRole.PARENT;
      }

      console.log('🔄 Mapping role:', userData.role, '->', uiRole);

      // Tạo UI User object
      const uiUser: UIUser = {
        id: userData.id,
        email: userData.email,
        name: userData.full_name || userData.name || name || 'User',
        role: uiRole,
      };

      console.log('👤 Mapped UI User:', uiUser);
      
      // Lưu UI User vào localStorage (thay vì raw API user)
      localStorage.setItem('user', JSON.stringify(uiUser));
      localStorage.setItem('neuropath_user_id', uiUser.id);

      // Sync user to DB if not exists
      const existingUser = db.getUserById(uiUser.id);
      if (!existingUser) {
        console.log('📝 Đồng bộ user vào db_users:', userData);
        db.createUser({
          username: userData.email?.split('@')[0] || `user_${Date.now()}`,
          password_hash: 'hashed_password_demo',
          email: userData.email,
          phone: null,
          full_name: userData.full_name || userData.name || name || 'User',
          role: userData.role,
        });
      }

      setCurrentUser(uiUser);

      // Navigate based on role
      if (uiRole === UserRole.PARENT) {
        console.log('👪 Điều hướng đến trang chủ cho PARENT');
        navigate('/');
      } else if (uiRole === UserRole.CLINICIAN) {
        console.log('👨‍⚕️ Điều hướng đến trang specialist');
        navigate('/specialist');
      } else if (uiRole === UserRole.ADMIN) {
        console.log('👑 Điều hướng đến trang admin');
        navigate('/admin');
      }
    }
  }, [navigate]);

  // ============================================
  // ĐĂNG XUẤT
  // ============================================
  const handleLogout = useCallback(() => {
    console.log('🚪 Logging out');
    localStorage.removeItem('neuropath_user_id');
    localStorage.removeItem('neuropath_child_id');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    navigate('/login');
  }, [navigate]);

  // ============================================
  // KIỂM TRA AUTH KHI KHỞI ĐỘNG
  // ============================================
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = {
    currentUser,
    isLoading,
    handleLogin,
    handleLogout,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================
// HOOK SỬ DỤNG AUTH
// ============================================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};