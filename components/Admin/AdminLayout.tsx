import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const AdminLayout: React.FC = () => {
  const navigation = [
    { name: 'Tổng quan', href: '/admin' },
    { name: 'Người dùng', href: '/admin/users' },
    { name: 'Trẻ em', href: '/admin/children' },
    { name: 'Chuẩn phát triển', href: '/admin/norms' },
    { name: 'Trò chơi', href: '/admin/games' },
    { name: 'Thống kê', href: '/admin/stats' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-md">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
          </div>
          <nav className="p-4">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    end={item.href === '/admin'}
                    className={({ isActive }) =>
                      `block px-4 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-700 hover:bg-indigo-50'
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;