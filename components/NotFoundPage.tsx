import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      textAlign: 'center',
      backgroundColor: '#f8fafc'
    }}>
      <h1 style={{ fontSize: '6rem', margin: 0, color: '#6366f1' }}>404</h1>
      <h2 style={{ fontSize: '2rem', color: '#334155' }}>Không tìm thấy trang</h2>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <Link 
        to="/" 
        style={{
          backgroundColor: '#6366f1',
          color: 'white',
          padding: '0.75rem 2rem',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600
        }}
      >
        Về trang chủ
      </Link>
    </div>
  );
};

export default NotFoundPage;