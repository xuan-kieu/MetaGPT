
import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { LongitudinalRecord, InferenceResult } from '../types';

interface DashboardProps {
  records: LongitudinalRecord[];
  latestAnalysis?: InferenceResult;
}

export const ClinicianDashboard: React.FC<DashboardProps> = ({ records, latestAnalysis }) => {
  const chartData = useMemo(() => {
    return records.map(r => ({
      date: new Date(r.date).toLocaleDateString(),
      score: r.riskScore,
      points: r.features.length
    }));
  }, [records]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Longitudinal Graph */}
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-800">Longitudinal Behavioral Index</h3>
          <p className="text-sm text-slate-500">Temporal variance tracking across sessions</p>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorScore)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Explainable Insights */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">AI Behavioral Analysis</h3>
          {latestAnalysis ? (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-2xl">
                <p className="text-sm leading-relaxed text-indigo-900 italic">
                  "{latestAnalysis.explanation}"
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {latestAnalysis.behavioralTags.map(tag => (
                  <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-bold uppercase tracking-tight">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-400">Analysis Confidence</span>
                <span className="font-bold text-emerald-600">{(latestAnalysis.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <div className="mb-2">⏳</div>
              <p className="text-sm">Complete a session to generate insights</p>
            </div>
          )}
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">🛡️</div>
            <h4 className="font-bold">Privacy Protocol</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            All behavioral features are extracted on-device. Zero raw video/audio data has been persisted or transmitted to the backend.
          </p>
        </div>
      </div>
    </div>
  );
};
