import {
  User,
  Child,
  ChildGuardian,
  AgeGroup,
  Skill,
  Game,
  GameSkill,
  Assessment,
  GameSession,
  GameSessionMetric,
  MediaFile,
  Norm,
  QuickNote,
  DailyReport,
  Message,
  InterventionPlan,
  UUID
} from '../types';

// Export lại các interface để có thể dùng qua namespace db
export type {
  User,
  Child,
  ChildGuardian,
  AgeGroup,
  Skill,
  Game,
  GameSkill,
  Assessment,
  GameSession,
  GameSessionMetric,
  MediaFile,
  Norm,
  QuickNote,
  DailyReport,
  Message,
  InterventionPlan,
  UUID
};

// ============================================================================
// STORAGE KEYS
// ============================================================================
const STORAGE_KEYS = {
  USERS: 'db_users',
  CHILDREN: 'db_children',
  CHILD_GUARDIANS: 'db_child_guardians',
  AGE_GROUPS: 'db_age_groups',
  SKILLS: 'db_skills',
  GAMES: 'db_games',
  GAME_SKILLS: 'db_game_skills',
  ASSESSMENTS: 'db_assessments',
  GAME_SESSIONS: 'db_game_sessions',
  GAME_SESSION_METRICS: 'db_game_session_metrics',
  MEDIA_FILES: 'db_media_files',
  NORMS: 'db_norms',
  QUICK_NOTES: 'db_quick_notes',
  DAILY_REPORTS: 'db_daily_reports',
  MESSAGES: 'db_messages',
  INTERVENTION_PLANS: 'db_intervention_plans',
} as const;

// ============================================================================
// HELPERS
// ============================================================================
function getStore<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(`Lỗi khi đọc ${key} từ localStorage`, e);
    return [];
  }
}

function setStore<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Lỗi khi ghi ${key} vào localStorage`, e);
  }
}

const generateUUID = (): UUID => {
  if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
  return (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)) as UUID;
};

function getNextId<T extends { id: number }>(key: string): number {
  const items = getStore<T>(key);
  if (items.length === 0) return 1;
  return Math.max(...items.map(i => i.id)) + 1;
}

function toISOString(date: Date | string | null | undefined): string {
  if (!date) return new Date().toISOString();
  if (date instanceof Date) return date.toISOString();
  return date;
}

// ============================================================================
// USERS
// ============================================================================
export const createUser = (user: Omit<User, 'id' | 'created_at' | 'updated_at'>): User => {
  const items = getStore<User>(STORAGE_KEYS.USERS);
  const now = new Date().toISOString();
  const newItem: User = {
    ...user,
    id: generateUUID(),
    created_at: now,
    updated_at: now,
  };
  items.push(newItem);
  setStore(STORAGE_KEYS.USERS, items);
  return newItem;
};

export const getUserById = (id: UUID): User | undefined => {
  return getStore<User>(STORAGE_KEYS.USERS).find(u => u.id === id);
};

export const getUserByEmail = (email: string): User | undefined => {
  return getStore<User>(STORAGE_KEYS.USERS).find(u => u.email === email);
};

export const getAllUsers = (): User[] => {
  return getStore<User>(STORAGE_KEYS.USERS);
};

export const updateUser = (id: UUID, updates: Partial<User>): User | null => {
  const items = getStore<User>(STORAGE_KEYS.USERS);
  const index = items.findIndex(u => u.id === id);
  if (index === -1) return null;
  items[index] = { 
    ...items[index], 
    ...updates, 
    updated_at: new Date().toISOString() 
  };
  setStore(STORAGE_KEYS.USERS, items);
  return items[index];
};

export const deleteUser = (id: UUID): boolean => {
  const items = getStore<User>(STORAGE_KEYS.USERS);
  const filtered = items.filter(u => u.id !== id);
  if (filtered.length === items.length) return false;
  setStore(STORAGE_KEYS.USERS, filtered);
  return true;
};

// ============================================================================
// CHILDREN
// ============================================================================
export const createChild = (child: Omit<Child, 'id' | 'created_at' | 'updated_at'>): Child => {
  const items = getStore<Child>(STORAGE_KEYS.CHILDREN);
  const now = new Date().toISOString();
  const newItem: Child = {
    ...child,
    id: generateUUID(),
    created_at: now,
    updated_at: now,
  };
  items.push(newItem);
  setStore(STORAGE_KEYS.CHILDREN, items);
  return newItem;
};

export const getChildById = (id: UUID): Child | undefined => {
  return getStore<Child>(STORAGE_KEYS.CHILDREN).find(c => c.id === id);
};

export const getChildrenByParent = (parentId: UUID): Child[] => {
  return getStore<Child>(STORAGE_KEYS.CHILDREN).filter(c => c.parent_id === parentId);
};

export const getAllChildren = (): Child[] => {
  return getStore<Child>(STORAGE_KEYS.CHILDREN);
};

export const updateChild = (id: UUID, updates: Partial<Child>): Child | null => {
  const items = getStore<Child>(STORAGE_KEYS.CHILDREN);
  const index = items.findIndex(c => c.id === id);
  if (index === -1) return null;
  items[index] = { 
    ...items[index], 
    ...updates, 
    updated_at: new Date().toISOString() 
  };
  setStore(STORAGE_KEYS.CHILDREN, items);
  return items[index];
};

export const deleteChild = (id: UUID): boolean => {
  const items = getStore<Child>(STORAGE_KEYS.CHILDREN);
  const filtered = items.filter(c => c.id !== id);
  if (filtered.length === items.length) return false;
  setStore(STORAGE_KEYS.CHILDREN, filtered);
  return true;
};

// ============================================================================
// CHILD GUARDIANS
// ============================================================================
export const addGuardian = (guardian: ChildGuardian): ChildGuardian => {
  const items = getStore<ChildGuardian>(STORAGE_KEYS.CHILD_GUARDIANS);
  const index = items.findIndex(g => g.child_id === guardian.child_id && g.user_id === guardian.user_id);
  if (index !== -1) {
    items[index] = { ...items[index], ...guardian };
  } else {
    items.push(guardian);
  }
  setStore(STORAGE_KEYS.CHILD_GUARDIANS, items);
  return guardian;
};

export const getGuardiansByChild = (childId: UUID): ChildGuardian[] => {
  return getStore<ChildGuardian>(STORAGE_KEYS.CHILD_GUARDIANS).filter(g => g.child_id === childId);
};

export const getChildrenByGuardian = (userId: UUID): ChildGuardian[] => {
  return getStore<ChildGuardian>(STORAGE_KEYS.CHILD_GUARDIANS).filter(g => g.user_id === userId);
};

// ============================================================================
// AGE GROUPS
// ============================================================================
export const createAgeGroup = (ageGroup: Omit<AgeGroup, 'id'>): AgeGroup => {
  const items = getStore<AgeGroup>(STORAGE_KEYS.AGE_GROUPS);
  const newItem = { ...ageGroup, id: getNextId<AgeGroup>(STORAGE_KEYS.AGE_GROUPS) };
  items.push(newItem);
  setStore(STORAGE_KEYS.AGE_GROUPS, items);
  return newItem;
};

export const getAllAgeGroups = (): AgeGroup[] => {
  return getStore<AgeGroup>(STORAGE_KEYS.AGE_GROUPS);
};

export const getAgeGroupById = (id: number): AgeGroup | undefined => {
  return getStore<AgeGroup>(STORAGE_KEYS.AGE_GROUPS).find(ag => ag.id === id);
};

// ============================================================================
// SKILLS
// ============================================================================
export const createSkill = (skill: Omit<Skill, 'id'>): Skill => {
  const items = getStore<Skill>(STORAGE_KEYS.SKILLS);
  const newItem = { ...skill, id: getNextId<Skill>(STORAGE_KEYS.SKILLS) };
  items.push(newItem);
  setStore(STORAGE_KEYS.SKILLS, items);
  return newItem;
};

export const getAllSkills = (): Skill[] => {
  return getStore<Skill>(STORAGE_KEYS.SKILLS);
};

export const getSkillById = (id: number): Skill | undefined => {
  return getStore<Skill>(STORAGE_KEYS.SKILLS).find(s => s.id === id);
};

export const updateSkill = (id: number, updates: Partial<Skill>): Skill | null => {
  const items = getStore<Skill>(STORAGE_KEYS.SKILLS);
  const index = items.findIndex(s => s.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  setStore(STORAGE_KEYS.SKILLS, items);
  return items[index];
};

export const deleteSkill = (id: number): boolean => {
  const items = getStore<Skill>(STORAGE_KEYS.SKILLS);
  const filtered = items.filter(s => s.id !== id);
  if (filtered.length === items.length) return false;
  setStore(STORAGE_KEYS.SKILLS, filtered);
  return true;
};

// ============================================================================
// GAMES
// ============================================================================
export const createGame = (game: Omit<Game, 'id' | 'created_at'>): Game => {
  const items = getStore<Game>(STORAGE_KEYS.GAMES);
  const newItem: Game = { 
    ...game, 
    id: getNextId<Game>(STORAGE_KEYS.GAMES), 
    created_at: new Date().toISOString() 
  };
  items.push(newItem);
  setStore(STORAGE_KEYS.GAMES, items);
  return newItem;
};

export const getAllGames = (): Game[] => {
  return getStore<Game>(STORAGE_KEYS.GAMES);
};

export const getGameById = (id: number): Game | undefined => {
  return getStore<Game>(STORAGE_KEYS.GAMES).find(g => g.id === id);
};

export const updateGame = (id: number, updates: Partial<Game>): Game | null => {
  const items = getStore<Game>(STORAGE_KEYS.GAMES);
  const index = items.findIndex(g => g.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  setStore(STORAGE_KEYS.GAMES, items);
  return items[index];
};

export const deleteGame = (id: number): boolean => {
  const items = getStore<Game>(STORAGE_KEYS.GAMES);
  const filtered = items.filter(g => g.id !== id);
  if (filtered.length === items.length) return false;
  setStore(STORAGE_KEYS.GAMES, filtered);
  return true;
};

// ============================================================================
// GAME SKILLS
// ============================================================================
export const addGameSkill = (gameSkill: GameSkill): GameSkill => {
  const items = getStore<GameSkill>(STORAGE_KEYS.GAME_SKILLS);
  const index = items.findIndex(gs => gs.game_id === gameSkill.game_id && gs.skill_id === gameSkill.skill_id);
  if (index !== -1) {
    items[index] = { ...items[index], ...gameSkill };
  } else {
    items.push(gameSkill);
  }
  setStore(STORAGE_KEYS.GAME_SKILLS, items);
  return gameSkill;
};

export const getSkillsByGame = (gameId: number): GameSkill[] => {
  return getStore<GameSkill>(STORAGE_KEYS.GAME_SKILLS).filter(gs => gs.game_id === gameId);
};

export const getGamesBySkill = (skillId: number): GameSkill[] => {
  return getStore<GameSkill>(STORAGE_KEYS.GAME_SKILLS).filter(gs => gs.skill_id === skillId);
};

// ============================================================================
// ASSESSMENTS
// ============================================================================
export const createAssessment = (assessment: Omit<Assessment, 'id' | 'created_at' | 'updated_at'>): Assessment => {
  const items = getStore<Assessment>(STORAGE_KEYS.ASSESSMENTS);
  const now = new Date().toISOString();
  const newItem: Assessment = {
    ...assessment,
    id: generateUUID(),
    created_at: now,
    updated_at: now,
    started_at: toISOString(assessment.started_at),
  };
  items.push(newItem);
  setStore(STORAGE_KEYS.ASSESSMENTS, items);
  return newItem;
};

export const getAssessmentById = (id: UUID): Assessment | undefined => {
  return getStore<Assessment>(STORAGE_KEYS.ASSESSMENTS).find(a => a.id === id);
};

export const getAssessmentsByChild = (childId: UUID): Assessment[] => {
  return getStore<Assessment>(STORAGE_KEYS.ASSESSMENTS)
    .filter(a => a.child_id === childId)
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
};

export const getAllAssessments = (): Assessment[] => {
  return getStore<Assessment>(STORAGE_KEYS.ASSESSMENTS);
};

export const updateAssessment = (id: UUID, updates: Partial<Assessment>): Assessment | null => {
  const items = getStore<Assessment>(STORAGE_KEYS.ASSESSMENTS);
  const index = items.findIndex(a => a.id === id);
  if (index === -1) return null;
  items[index] = { 
    ...items[index], 
    ...updates, 
    updated_at: new Date().toISOString() 
  };
  setStore(STORAGE_KEYS.ASSESSMENTS, items);
  return items[index];
};

export const deleteAssessment = (id: UUID): boolean => {
  const items = getStore<Assessment>(STORAGE_KEYS.ASSESSMENTS);
  const filtered = items.filter(a => a.id !== id);
  if (filtered.length === items.length) return false;
  setStore(STORAGE_KEYS.ASSESSMENTS, filtered);
  return true;
};

// ============================================================================
// GAME SESSIONS
// ============================================================================
export const createGameSession = (session: Omit<GameSession, 'id' | 'created_at'>): GameSession => {
  const items = getStore<GameSession>(STORAGE_KEYS.GAME_SESSIONS);
  const newItem: GameSession = {
    ...session,
    id: generateUUID(),
    created_at: new Date().toISOString(),
  };
  items.push(newItem);
  setStore(STORAGE_KEYS.GAME_SESSIONS, items);
  return newItem;
};

export const getGameSessionById = (id: UUID): GameSession | undefined => {
  return getStore<GameSession>(STORAGE_KEYS.GAME_SESSIONS).find(gs => gs.id === id);
};

export const getGameSessionsByAssessment = (assessmentId: UUID): GameSession[] => {
  return getStore<GameSession>(STORAGE_KEYS.GAME_SESSIONS)
    .filter(s => s.assessment_id === assessmentId)
    .sort((a, b) => a.sequence_order - b.sequence_order);
};

export const getAllGameSessions = (): GameSession[] => {
  return getStore<GameSession>(STORAGE_KEYS.GAME_SESSIONS);
};

export const updateGameSession = (id: UUID, updates: Partial<GameSession>): GameSession | null => {
  const items = getStore<GameSession>(STORAGE_KEYS.GAME_SESSIONS);
  const index = items.findIndex(gs => gs.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  setStore(STORAGE_KEYS.GAME_SESSIONS, items);
  return items[index];
};

// ============================================================================
// GAME SESSION METRICS
// ============================================================================
export const createGameSessionMetric = (metric: Omit<GameSessionMetric, 'id' | 'captured_at'>): GameSessionMetric => {
  const items = getStore<GameSessionMetric>(STORAGE_KEYS.GAME_SESSION_METRICS);
  const newItem: GameSessionMetric = {
    ...metric,
    id: generateUUID(),
    captured_at: new Date().toISOString(),
  };
  items.push(newItem);
  setStore(STORAGE_KEYS.GAME_SESSION_METRICS, items);
  return newItem;
};

export const createManyGameSessionMetrics = (metrics: Omit<GameSessionMetric, 'id' | 'captured_at'>[]): GameSessionMetric[] => {
  const existing = getStore<GameSessionMetric>(STORAGE_KEYS.GAME_SESSION_METRICS);
  const now = new Date().toISOString();
  const newItems = metrics.map(m => ({
    ...m,
    id: generateUUID(),
    captured_at: now,
  }));
  setStore(STORAGE_KEYS.GAME_SESSION_METRICS, [...existing, ...newItems]);
  return newItems;
};

export const getMetricsByGameSession = (gameSessionId: UUID): GameSessionMetric[] => {
  return getStore<GameSessionMetric>(STORAGE_KEYS.GAME_SESSION_METRICS)
    .filter(m => m.game_session_id === gameSessionId);
};

export const getAllGameSessionMetrics = (): GameSessionMetric[] => {
  return getStore<GameSessionMetric>(STORAGE_KEYS.GAME_SESSION_METRICS);
};

// ============================================================================
// MEDIA FILES
// ============================================================================
export const createMediaFile = (mediaFile: Omit<MediaFile, 'id' | 'uploaded_at'>): MediaFile => {
  const items = getStore<MediaFile>(STORAGE_KEYS.MEDIA_FILES);
  const newItem: MediaFile = {
    ...mediaFile,
    id: generateUUID(),
    uploaded_at: new Date().toISOString(),
  };
  items.push(newItem);
  setStore(STORAGE_KEYS.MEDIA_FILES, items);
  return newItem;
};

export const getMediaFilesByGameSession = (gameSessionId: UUID): MediaFile[] => {
  return getStore<MediaFile>(STORAGE_KEYS.MEDIA_FILES).filter(mf => mf.game_session_id === gameSessionId);
};

// ============================================================================
// NORMS
// ============================================================================
export const createNorm = (norm: Omit<Norm, 'id'>): Norm => {
  const items = getStore<Norm>(STORAGE_KEYS.NORMS);
  const newItem = { ...norm, id: getNextId<Norm>(STORAGE_KEYS.NORMS) };
  items.push(newItem);
  setStore(STORAGE_KEYS.NORMS, items);
  return newItem;
};

export const getAllNorms = (): Norm[] => {
  return getStore<Norm>(STORAGE_KEYS.NORMS);
};

export const getNormsBySkillAndAge = (skillId: number, ageGroupId: number): Norm | undefined => {
  return getStore<Norm>(STORAGE_KEYS.NORMS).find(
    n => n.skill_id === skillId && n.age_group_id === ageGroupId
  );
};

// ============================================================================
// QUICK NOTES
// ============================================================================
export const createQuickNote = (note: Omit<QuickNote, 'id' | 'created_at'>): QuickNote => {
  const items = getStore<QuickNote>(STORAGE_KEYS.QUICK_NOTES);
  const newItem: QuickNote = {
    ...note,
    id: generateUUID(),
    created_at: new Date().toISOString(),
  };
  items.push(newItem);
  setStore(STORAGE_KEYS.QUICK_NOTES, items);
  return newItem;
};

export const getQuickNotesByChild = (childId: UUID): QuickNote[] => {
  return getStore<QuickNote>(STORAGE_KEYS.QUICK_NOTES)
    .filter(n => n.child_id === childId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

// ============================================================================
// DAILY REPORTS
// ============================================================================
export const createDailyReport = (report: Omit<DailyReport, 'id' | 'created_at' | 'updated_at'>): DailyReport => {
  const items = getStore<DailyReport>(STORAGE_KEYS.DAILY_REPORTS);
  const now = new Date().toISOString();
  const newItem: DailyReport = {
    ...report,
    id: generateUUID(),
    created_at: now,
    updated_at: now,
  };
  items.push(newItem);
  setStore(STORAGE_KEYS.DAILY_REPORTS, items);
  return newItem;
};

export const getDailyReportsByChild = (childId: UUID): DailyReport[] => {
  return getStore<DailyReport>(STORAGE_KEYS.DAILY_REPORTS)
    .filter(r => r.child_id === childId)
    .sort((a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime());
};

export const getDailyReportByDate = (childId: UUID, reportDate: string): DailyReport | undefined => {
  return getStore<DailyReport>(STORAGE_KEYS.DAILY_REPORTS).find(
    r => r.child_id === childId && r.report_date === reportDate
  );
};

// ============================================================================
// MESSAGES
// ============================================================================
export const createMessage = (message: Omit<Message, 'id' | 'created_at' | 'is_read' | 'read_at'>): Message => {
  const items = getStore<Message>(STORAGE_KEYS.MESSAGES);
  const newItem: Message = {
    ...message,
    id: generateUUID(),
    is_read: false,
    read_at: null,
    created_at: new Date().toISOString(),
  };
  items.push(newItem);
  setStore(STORAGE_KEYS.MESSAGES, items);
  return newItem;
};

export const getMessagesBetweenUsers = (user1Id: UUID, user2Id: UUID): Message[] => {
  return getStore<Message>(STORAGE_KEYS.MESSAGES)
    .filter(m => 
      (m.from_user_id === user1Id && m.to_user_id === user2Id) ||
      (m.from_user_id === user2Id && m.to_user_id === user1Id)
    )
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
};

export const getMessagesByChild = (childId: UUID): Message[] => {
  return getStore<Message>(STORAGE_KEYS.MESSAGES)
    .filter(m => m.child_id === childId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const markMessageAsRead = (id: UUID): boolean => {
  const items = getStore<Message>(STORAGE_KEYS.MESSAGES);
  const index = items.findIndex(m => m.id === id);
  if (index === -1) return false;
  items[index].is_read = true;
  items[index].read_at = new Date().toISOString();
  setStore(STORAGE_KEYS.MESSAGES, items);
  return true;
};

export const getUnreadMessagesCount = (userId: UUID): number => {
  return getStore<Message>(STORAGE_KEYS.MESSAGES).filter(
    m => m.to_user_id === userId && !m.is_read
  ).length;
};

// ============================================================================
// INTERVENTION PLANS
// ============================================================================
export const createInterventionPlan = (plan: Omit<InterventionPlan, 'id' | 'created_at' | 'updated_at'>): InterventionPlan => {
  const items = getStore<InterventionPlan>(STORAGE_KEYS.INTERVENTION_PLANS);
  const now = new Date().toISOString();
  const newItem: InterventionPlan = {
    ...plan,
    id: generateUUID(),
    created_at: now,
    updated_at: now,
  };
  items.push(newItem);
  setStore(STORAGE_KEYS.INTERVENTION_PLANS, items);
  return newItem;
};

export const getInterventionPlansByChild = (childId: UUID): InterventionPlan[] => {
  return getStore<InterventionPlan>(STORAGE_KEYS.INTERVENTION_PLANS)
    .filter(p => p.child_id === childId)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
};

export const getActiveInterventionPlans = (childId: UUID): InterventionPlan[] => {
  const today = new Date().toISOString().split('T')[0];
  return getStore<InterventionPlan>(STORAGE_KEYS.INTERVENTION_PLANS).filter(
    p => p.child_id === childId && p.status === 'active' && p.end_date && p.end_date >= today
  );
};

// ============================================================================
// UTILITIES
// ============================================================================
export const clearAllData = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
};

export const getDatabaseStats = () => {
  return {
    users: getStore<User>(STORAGE_KEYS.USERS).length,
    children: getStore<Child>(STORAGE_KEYS.CHILDREN).length,
    assessments: getStore<Assessment>(STORAGE_KEYS.ASSESSMENTS).length,
    gameSessions: getStore<GameSession>(STORAGE_KEYS.GAME_SESSIONS).length,
    messages: getStore<Message>(STORAGE_KEYS.MESSAGES).length,
  };
};