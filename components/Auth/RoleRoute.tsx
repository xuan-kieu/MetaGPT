import React from 'react';
import { Navigate } from 'react-router-dom';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: string[]; // ['admin', 'specialist', 'parent']
}

const RoleRoute: React.FC<RoleRouteProps> = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    // Chưa đăng nhập
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    
    if (!allowedRoles.includes(user.role)) {
      // Không có quyền, chuyển về trang chính
      return <Navigate to="/" replace />;
    }

    return <>{children}</>;
  } catch (error) {
    // User data không hợp lệ
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
};

export default RoleRoute;