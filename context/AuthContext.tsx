import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { User as DBUser } from '../types';
import * as db from '../services/dbService';

// ============================================
// ĐỊNH NGHĪA KIỂU & MAPPER
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ============================================
// AUTH PROVIDER COMPONENT
// ============================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UIUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Dùng useRef để quản lý trạng thái mounted hiệu quả hơn
  const isMounted = useRef(true);

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
  // KIỂM TRA AUTHENTICATION (Đã tối ưu)
  // ============================================
  const checkAuth = useCallback(async () => {
    console.log('🔍 Kiểm tra authentication...');
    
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      if (isMounted.current) {
        setCurrentUser(null);
        setIsLoading(false);
      }
      return;
    }

    try {
      const isValid = await validateTokenWithBackend(token);
      
      if (!isMounted.current) return;

      if (!isValid) {
        console.warn('⚠️ Token invalid, clearing storage');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setCurrentUser(null);
        setIsLoading(false);
        return;
      }

      const uiUser = JSON.parse(userStr) as UIUser;
      
      // Sync to DB logic
      const dbUser = db.getUserById(uiUser.id);
      if (!dbUser) {
        const dbRole = uiUser.role === UserRole.PARENT ? 'parent' : 
                       uiUser.role === UserRole.CLINICIAN ? 'specialist' : 'admin';
        db.createUser({
          username: uiUser.email.split('@')[0],
          password_hash: 'hashed_password_demo',
          email: uiUser.email,
          phone: null,
          full_name: uiUser.name,
          role: dbRole as any,
        });
      }

      if (isMounted.current) {
        setCurrentUser(uiUser);
        console.log('✅ Đã khôi phục phiên cho user:', uiUser.name);
      }
      
    } catch (error) {
      console.error('Error parsing user data:', error);
      if (isMounted.current) {
        localStorage.clear();
        setCurrentUser(null);
      }
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [validateTokenWithBackend]);

  // Khởi chạy checkAuth khi component mount
  useEffect(() => {
    isMounted.current = true;
    checkAuth();

    return () => {
      isMounted.current = false;
    };
  }, [checkAuth]);

  // ============================================
  // ĐĂNG NHẬP / ĐĂNG XUẤT
  // ============================================
  const handleLogin = useCallback((role: UserRole, email?: string, name?: string, token?: string, userData?: LoginApiUser) => {
    if (token) localStorage.setItem('token', token);

    if (userData) {
      let uiRole: UserRole;
      switch (userData.role) {
        case 'parent': uiRole = UserRole.PARENT; break;
        case 'specialist': uiRole = UserRole.CLINICIAN; break;
        case 'admin': uiRole = UserRole.ADMIN; break;
        default: uiRole = UserRole.PARENT;
      }

      const uiUser: UIUser = {
        id: userData.id,
        email: userData.email,
        name: userData.full_name || userData.name || name || 'User',
        role: uiRole,
      };

      localStorage.setItem('user', JSON.stringify(uiUser));
      localStorage.setItem('neuropath_user_id', uiUser.id);

      setCurrentUser(uiUser);

      // Điều hướng sau đăng nhập
      if (uiRole === UserRole.PARENT) navigate('/');
      else if (uiRole === UserRole.CLINICIAN) navigate('/specialist');
      else if (uiRole === UserRole.ADMIN) navigate('/admin');
    }
  }, [navigate]);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    setCurrentUser(null);
    navigate('/login');
  }, [navigate]);

  const value = {
    currentUser,
    isLoading,
    handleLogin,
    handleLogout,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};