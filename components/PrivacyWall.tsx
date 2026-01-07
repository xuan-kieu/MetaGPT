import React, { useState } from 'react';
import { FeatureExtractorService } from '../services/FeatureExtractorService';

export const PrivacyWall: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [dataStats, setDataStats] = useState({
    localProcessing: true,
    noRawDataSent: true,
    modelOnDevice: true,
  });

  return (
    <div className="relative">
      <div 
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-500/10 cursor-help"
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
        onClick={() => setShowDetails(!showDetails)}
        role="button"
        aria-label="Privacy protection details"
        tabIndex={0}
      >
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        <span>Privacy Wall: On-Device AI</span>
      </div>
      
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-72 p-4 bg-white rounded-xl shadow-lg border border-slate-200 z-50">
          <h4 className="font-bold text-slate-800 mb-3">🔒 Privacy Protocol</h4>
          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <span><strong>Local Processing:</strong> MediaPipe/TFJS runs entirely in browser</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <span><strong>No Raw Data:</strong> Only extracted features are processed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <span><strong>Zero Cloud Upload:</strong> Video never leaves your device</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <span><strong>Model On-Device:</strong> 2.7MB TensorFlow.js model</span>
            </li>
          </ul>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-[10px] text-slate-500">
              Feature extraction: MediaPipe FaceMesh v0.4
              <br />
              Model size: 2.7MB (quantized)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};