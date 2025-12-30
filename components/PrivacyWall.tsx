
import React from 'react';

export const PrivacyWall: React.FC = () => {
  return (
    <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
      <span>Privacy Wall Active: No Raw Data Egress</span>
    </div>
  );
};
