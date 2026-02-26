import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Components
import LoginScreen from '../components/Auth/LoginScreen';
import RegisterScreen from '../components/Auth/RegisterScreen';
import ForgotPassword from '../components/Auth/ForgotPassword';
import ResetPassword from '../components/Auth/ResetPassword';
import PrivateRoute from '../components/Auth/PrivateRoute';
import RoleRoute from '../components/Auth/RoleRoute';
import AppContent from '../components/AppContent';
import SpecialistChildren from '../components/Specialist/SpecialistChildren';
import ChildDetail from '../components/Specialist/ChildDetail';
import AdminLayout from '../components/Admin/AdminLayout';
import UserManagement from '../components/Admin/UserManagement';
import ChildManagement from '../components/Admin/ChildManagement';
import NormManagement from '../components/Admin/NormManagement';
import GameManagement from '../components/Admin/GameManagement';
import SystemStats from '../components/Admin/SystemStats';
import AdminDashboard from '../components/Admin/AdminDashboard';
import NotFoundPage from '../components/NotFoundPage';

// Types
import { UserRole } from '../types';

/**
 * Component phụ trợ: Ngăn người dùng đã đăng nhập truy cập vào các trang Public (Login/Register)
 */
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (currentUser) {
    // Nếu đã đăng nhập, điều hướng về trang chủ tương ứng với vai trò hoặc trang mặc định
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  const { currentUser, handleLogin, handleLogout, isLoading } = useAuth();

  // 1. Chờ xác thực xong để tránh tình trạng "nháy" trang hoặc Navigate sai hướng
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem' 
      }}>
        Đang tải dữ liệu hệ thống...
      </div>
    ); 
  }

  return (
    <Routes>
      {/* --- PUBLIC ROUTES --- */}
      {/* Sử dụng PublicRoute để bọc Login và Register */}
      <Route path="/login" element={
        <PublicRoute>
          <LoginScreen onLogin={handleLogin} />
        </PublicRoute>
      } />
      
      <Route path="/register" element={
        <PublicRoute>
          <RegisterScreen onLogin={handleLogin} />
        </PublicRoute>
      } />

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* --- PROTECTED ROUTES (PARENT / GENERAL) --- */}
      <Route path="/" element={
        <PrivateRoute>
          <AppContent onLogout={handleLogout} />
        </PrivateRoute>
      } />

      {/* --- SPECIALIST ROUTES --- */}
      <Route path="/specialist" element={
        <RoleRoute allowedRoles={[UserRole.CLINICIAN]}>
          <div className="app-container" style={{ padding: '20px' }}>
            <SpecialistChildren />
          </div>
        </RoleRoute>
      } />
      
      <Route path="/specialist/children/:childId" element={
        <RoleRoute allowedRoles={[UserRole.CLINICIAN]}>
          <div className="app-container" style={{ padding: '20px' }}>
            <ChildDetail />
          </div>
        </RoleRoute>
      } />

      {/* --- ADMIN ROUTES --- */}
      <Route path="/admin" element={
        <RoleRoute allowedRoles={[UserRole.ADMIN]}>
          <AdminLayout />
        </RoleRoute>
      }>
        {/* Route mặc định khi vào /admin */}
        <Route index element={<AdminDashboard />} />
        <Route path="stats" element={<SystemStats />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="children" element={<ChildManagement />} />
        <Route path="norms" element={<NormManagement />} />
        <Route path="games" element={<GameManagement />} />
      </Route>

      {/* --- 404 PAGE --- */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};