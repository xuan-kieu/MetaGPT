import * as db from './dbService';
import { ChildProfile, UserRole } from '../types';
import { Child as DBChild } from '../types';
import { UIUser } from '../context/AuthContext';

export const mapDBChildToChildProfile = (dbChild: DBChild): ChildProfile => {
  const birthDate = new Date(dbChild.birth_date);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  if (months < 0) { years--; months += 12; }
  
  return {
    id: dbChild.id,
    name: dbChild.full_name,
    birthDate: dbChild.birth_date,
    gender: (dbChild.gender as any) || 'other',
    region: dbChild.region || '',
    primaryLanguage: dbChild.primary_language || 'vi',
    age: { years, months },
  };
};

export const mapChildProfileToDBChild = (profile: ChildProfile, parentId: string): Omit<DBChild, 'id' | 'created_at' | 'updated_at'> => ({
  full_name: profile.name,
  birth_date: profile.birthDate,
  gender: profile.gender,
  region: profile.region,
  primary_language: profile.primaryLanguage,
  notes: null,
  parent_id: parentId,
  created_by: parentId,
});

export const getChildrenByParent = (parentId: string): DBChild[] => {
  return db.getChildrenByParent(parentId);
};

export const createChildProfile = (childData: ChildProfile, currentUser: UIUser): ChildProfile => {
  // Ensure user exists in DB
  const existingUser = db.getUserById(currentUser.id);
  if (!existingUser) {
    const dbRole = currentUser.role === UserRole.PARENT ? 'parent' : 
                   currentUser.role === UserRole.CLINICIAN ? 'specialist' : 'admin';
    db.createUser({
      username: currentUser.email?.split('@')[0] || `user_${Date.now()}`,
      password_hash: 'hashed_password_demo',
      email: currentUser.email,
      phone: null,
      full_name: currentUser.name,
      role: dbRole,
    });
  }

  const dbChildInput = mapChildProfileToDBChild(childData, currentUser.id);
  const dbChild = db.createChild(dbChildInput);
  return mapDBChildToChildProfile(dbChild);
};