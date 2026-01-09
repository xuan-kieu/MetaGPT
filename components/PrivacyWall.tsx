import React from 'react';

export const PrivacyWall: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: '#059669',
      backgroundColor: '#ecfdf5',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      width: 'fit-content'
    }}>
      <div style={{
        width: '0.5rem',
        height: '0.5rem',
        borderRadius: '50%',
        backgroundColor: '#10b981',
        boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)',
        animation: 'pulse 2s infinite'
      }}></div>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 4px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
      <span>Privacy Wall Active: No Raw Data Egress</span>
    </div>
  );
};