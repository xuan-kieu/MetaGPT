import api from './api';

export interface Child {
  id: string;
  full_name: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other';
  region?: string;
  primary_language?: string;
  notes?: string;
  parent_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  child_id: string;
  started_by?: string;
  started_at: string;
  completed_at?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'abandoned';
  overall_risk_score?: number;
  risk_level?: 'RẤT CAO' | 'CAO' | 'TRUNG BÌNH' | 'THẤP';
  developmental_age_estimate?: number;
  created_at: string;
}

export const getChildren = async (): Promise<Child[]> => {
  const response = await api.get('/specialist/children');
  return response.data;
};

export const getChildDetail = async (childId: string): Promise<{ child: Child; assessments: Assessment[] }> => {
  const response = await api.get(`/specialist/children/${childId}`);
  return response.data;
};