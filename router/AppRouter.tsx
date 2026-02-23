import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import NotFoundPage from '../components/NotFoundPage';

// Types
import { UserRole } from '../types';

// ============================================
// APP ROUTER
// ============================================
export const AppRouter: React.FC = () => {
  const { currentUser, handleLogin, handleLogout } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        currentUser ? <Navigate to="/" replace /> : <LoginScreen onLogin={handleLogin} />
      } />
      <Route path="/register" element={
        currentUser ? <Navigate to="/" replace /> : <RegisterScreen onLogin={handleLogin} />
      } />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes */}
      <Route path="/" element={
        <PrivateRoute>
          <AppContent onLogout={handleLogout} />
        </PrivateRoute>
      } />

      {/* Specialist routes */}
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

      {/* Admin routes */}
      <Route path="/admin" element={
        <RoleRoute allowedRoles={[UserRole.ADMIN]}>
          <AdminLayout />
        </RoleRoute>
      }>
        <Route index element={<Navigate to="/admin/stats" replace />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="children" element={<ChildManagement />} />
        <Route path="norms" element={<NormManagement />} />
        <Route path="games" element={<GameManagement />} />
        <Route path="stats" element={<SystemStats />} />
      </Route>

      {/* 404 page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};