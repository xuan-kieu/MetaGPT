
export enum AppMode {
  PATIENT = 'PATIENT',
  CLINICIAN = 'CLINICIAN',
  ADMIN = 'ADMIN'
}

export interface BehavioralFeature {
  timestamp: number;
  gazeX: number;
  gazeY: number;
  frownIntensity: number;
  smileIntensity: number;
  vocalPitch?: number;
  vocalVolume?: number;
}

export interface InferenceResult {
  patternId: string;
  confidence: number;
  explanation: string;
  behavioralTags: string[];
}

export interface LongitudinalRecord {
  id: string;
  date: string;
  riskScore: number;
  observations: string[];
  features: BehavioralFeature[];
}

export interface SessionData {
  sessionId: string;
  subjectId: string;
  startTime: number;
  endTime?: number;
  features: BehavioralFeature[];
}
