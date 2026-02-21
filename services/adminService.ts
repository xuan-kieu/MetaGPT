import api from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  full_name: string;
  role: 'parent' | 'teacher' | 'specialist' | 'admin';
  created_at: string;
}

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

export interface Norm {
  id: number;
  skill_id: number;
  age_group_id: number;
  mean: number;
  std_dev: number;
  sample_size?: number;
  updated_at: string;
  skill_name?: string;
  age_group_name?: string;
}

export interface Game {
  id: number;
  code: string;
  name: string;
  description?: string;
  instructions?: string;
  min_age_months: number;
  max_age_months: number;
  target_duration_seconds?: number;
  media_url?: string;
  is_gateway: boolean;
  created_at: string;
}

export interface SystemStats {
  total_users: number;
  total_children: number;
  total_assessments: number;
  assessments_by_risk: { risk_level: string; count: number }[];
  recent_activities: any[];
}

// Users
export const getUsers = () => api.get('/admin/users').then(res => res.data);
export const createUser = (data: Partial<User> & { password: string }) => api.post('/admin/users', data).then(res => res.data);
export const updateUser = (id: string, data: Partial<User>) => api.put(`/admin/users/${id}`, data).then(res => res.data);
export const deleteUser = (id: string) => api.delete(`/admin/users/${id}`).then(res => res.data);

// Children
export const getAllChildren = () => api.get('/admin/children').then(res => res.data);
export const createChild = (data: Partial<Child>) => api.post('/admin/children', data).then(res => res.data);
export const updateChild = (id: string, data: Partial<Child>) => api.put(`/admin/children/${id}`, data).then(res => res.data);
export const deleteChild = (id: string) => api.delete(`/admin/children/${id}`).then(res => res.data);

// Norms
export const getNorms = () => api.get('/admin/norms').then(res => res.data);
export const createNorm = (data: Partial<Norm>) => api.post('/admin/norms', data).then(res => res.data);
export const updateNorm = (id: number, data: Partial<Norm>) => api.put(`/admin/norms/${id}`, data).then(res => res.data);
export const deleteNorm = (id: number) => api.delete(`/admin/norms/${id}`).then(res => res.data);

// Games
export const getGames = () => api.get('/admin/games').then(res => res.data);
export const createGame = (data: Partial<Game>) => api.post('/admin/games', data).then(res => res.data);
export const updateGame = (id: number, data: Partial<Game>) => api.put(`/admin/games/${id}`, data).then(res => res.data);
export const deleteGame = (id: number) => api.delete(`/admin/games/${id}`).then(res => res.data);

// Stats
export const getSystemStats = () => api.get('/admin/stats').then(res => res.data);