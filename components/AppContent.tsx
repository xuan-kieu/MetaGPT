import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAssessment } from '../context/AssessmentContext';
import { ChildProfile, UserRole } from '../types';

import GameEngine from './GameEngine';
import { ClinicianDashboard } from './ClinicianDashboard';
import ChildProfileScreen from './Onboarding/ChildProfile';
import Screener from './Assessment/Screener';
import AssessmentPrep from './Assessment/AssessmentPrep';
import StartScreen from './StartScreen';
import ParentReport from './ParentReport';
import LoadingSpinner from './LoadingSpinner';

import { PROGRAM_INFO } from '../config/programInfo';
import * as childService from '../services/childService';
import * as assessmentService from '../services/assessmentService';

import '../styles.css';

/* ============================================================
   ENUMS
============================================================ */

export enum ParentFlowStep {
  START = 'start',
  CHILD_PROFILE = 'child_profile',
  SCREENER = 'screener',
  PREP = 'prep',
  SESSION = 'session',
  REPORT = 'report',
}

export enum DemoStep {
  START = 'start',
  SESSION = 'session',
}

export enum ClinicianMode {
  DEMO = 'demo',
  DASHBOARD = 'dashboard'
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

interface AppContentProps {
  onLogout: () => void;
}

const AppContent: React.FC<AppContentProps> = ({ onLogout }) => {
  const { currentUser } = useAuth();
  const {
    records,
    currentAnalysis,
    assessmentResult,
    isAnalyzing,
    sessionMessage,
    handleSessionEnd,
    handleFeatureStream,
    clearSessionMessage,
  } = useAssessment();

  const navigate = useNavigate();

  /* ============================================================
     COMMON STATE
  ============================================================ */

  const [currentChild, setCurrentChild] = useState<ChildProfile | null>(null);
  const [childName, setChildName] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);

  /* ============================================================
     PARENT FLOW STATE
  ============================================================ */

  const [parentStep, setParentStep] = useState<ParentFlowStep>(ParentFlowStep.START);

  /* ============================================================
     CLINICIAN DEMO STATE
  ============================================================ */

  const [demoStep, setDemoStep] = useState<DemoStep>(DemoStep.START);
  const [clinicianMode, setClinicianMode] = useState<ClinicianMode>(ClinicianMode.DEMO);

  /* ============================================================
     RESET WHEN USER CHANGES
  ============================================================ */

  useEffect(() => {
    setParentStep(ParentFlowStep.START);
    setDemoStep(DemoStep.START);
    setClinicianMode(ClinicianMode.DEMO);
    setCurrentChild(null);
    setChildName('');
    setSelectedGroupId(null);
    setCurrentAssessmentId(null);
  }, [currentUser?.id]);

  /* ============================================================
     COMPUTED
  ============================================================ */

  const currentProgramInfo = useMemo(() => {
    if (!selectedGroupId) return null;
    return PROGRAM_INFO[selectedGroupId] ?? null;
  }, [selectedGroupId]);

  const canStartSession = !!currentProgramInfo;

  /* ============================================================
     GUARD
  ============================================================ */

  if (!currentUser) {
    return <LoadingSpinner message="Đang tải thông tin người dùng..." />;
  }

  /* ============================================================
     INITIALIZE PARENT DATA
  ============================================================ */

  useEffect(() => {
    if (currentUser.role !== UserRole.PARENT) return;

    const children = childService.getChildrenByParent(currentUser.id);

    if (children.length === 0) {
      setParentStep(ParentFlowStep.CHILD_PROFILE);
      return;
    }

    const storedChildId = localStorage.getItem('neuropath_child_id');
    const selectedChild =
      children.find((c) => c.id === storedChildId) || children[0];

    const mappedChild = childService.mapDBChildToChildProfile(selectedChild);

    setCurrentChild(mappedChild);
    setChildName(mappedChild.name);

    // Kiểm tra screener
    const assessments = assessmentService.getAssessmentsByChild(mappedChild.id);
    const hasScreener = assessments.some(a => a.status === 'scheduled' && a.adaptive_flow);

    if (!hasScreener) {
      setParentStep(ParentFlowStep.SCREENER);
    } else {
      setParentStep(ParentFlowStep.START);
    }
  }, [currentUser.id, currentUser.role]);

  /* ============================================================
     PARENT HANDLERS
  ============================================================ */

  const handleChildProfileComplete = useCallback(
    (childData: ChildProfile) => {
      const newChild = childService.createChildProfile(childData, currentUser);
      setCurrentChild(newChild);
      setChildName(newChild.name);
      localStorage.setItem('neuropath_child_id', newChild.id);
      setParentStep(ParentFlowStep.SCREENER);
    },
    [currentUser]
  );

  const handleScreenerComplete = useCallback(
    (result: any) => {
      if (!currentChild) return;

      const assessment = assessmentService.createAssessment({
        child_id: currentChild.id,
        started_by: currentUser.id,
        started_at: new Date().toISOString(),
        status: 'scheduled',
        adaptive_flow: JSON.stringify(result),
      });

      setCurrentAssessmentId(assessment.id);
      setParentStep(ParentFlowStep.PREP);
    },
    [currentChild, currentUser.id]
  );

  const handleStartSession = useCallback(() => {
    if (!canStartSession) return;
    setParentStep(ParentFlowStep.PREP);
  }, [canStartSession]);

  const handleDeviceCheckComplete = useCallback(() => {
    clearSessionMessage();
    setParentStep(ParentFlowStep.SESSION);
  }, [clearSessionMessage]);

  const handleSessionEndCallback = useCallback(
    async (result: any) => {
      await handleSessionEnd(
        result,
        currentChild,
        selectedGroupId,
        currentAssessmentId
      );

      setParentStep(ParentFlowStep.REPORT);
    },
    [handleSessionEnd, currentChild, selectedGroupId, currentAssessmentId]
  );

  const handleBackToStart = useCallback(() => {
    setCurrentAssessmentId(null);
    setSelectedGroupId(null);
    setParentStep(ParentFlowStep.START);
  }, []);

  const handleManageProfiles = useCallback(() => {
    setParentStep(ParentFlowStep.CHILD_PROFILE);
  }, []);

  /* ============================================================
     CLINICIAN HANDLERS
  ============================================================ */

  const handleClinicianStartSession = useCallback(() => {
    if (!canStartSession) return;
    setDemoStep(DemoStep.SESSION);
  }, [canStartSession]);

  const handleClinicianSessionEnd = useCallback(
    async (result: any) => {
      await handleSessionEnd(
        result,
        null,
        selectedGroupId,
        currentAssessmentId
      );
      setDemoStep(DemoStep.START);
    },
    [handleSessionEnd, selectedGroupId, currentAssessmentId]
  );

  /* ============================================================
     ROLE ROUTING
  ============================================================ */

  if (currentUser.role === UserRole.PARENT) {
    return (
      <ParentFlow
        currentUser={currentUser}
        parentStep={parentStep}
        setParentStep={setParentStep}
        currentChild={currentChild}
        childName={childName}
        setChildName={setChildName}
        selectedGroupId={selectedGroupId}
        setSelectedGroupId={setSelectedGroupId}
        currentAssessmentId={currentAssessmentId}
        currentProgramInfo={currentProgramInfo}
        canStartSession={canStartSession}
        assessmentResult={assessmentResult}
        isAnalyzing={isAnalyzing}
        sessionMessage={sessionMessage}
        records={records}
        currentAnalysis={currentAnalysis}
        handleChildProfileComplete={handleChildProfileComplete}
        handleScreenerComplete={handleScreenerComplete}
        handleStartSession={handleStartSession}
        handleDeviceCheckComplete={handleDeviceCheckComplete}
        handleSessionEndCallback={handleSessionEndCallback}
        handleBackToStart={handleBackToStart}
        handleManageProfiles={handleManageProfiles}
        handleFeatureStream={handleFeatureStream}
        onLogout={onLogout}
        navigate={navigate}
      />
    );
  }

  if (currentUser.role === UserRole.CLINICIAN) {
    return (
      <ClinicianFlow
        currentUser={currentUser}
        demoStep={demoStep}
        setDemoStep={setDemoStep}
        clinicianMode={clinicianMode}
        setClinicianMode={setClinicianMode}
        selectedGroupId={selectedGroupId}
        setSelectedGroupId={setSelectedGroupId}
        currentProgramInfo={currentProgramInfo}
        canStartSession={canStartSession}
        childName={childName}
        setChildName={setChildName}
        records={records}
        currentAnalysis={currentAnalysis}
        handleFeatureStream={handleFeatureStream}
        handleClinicianStartSession={handleClinicianStartSession}
        handleClinicianSessionEnd={handleClinicianSessionEnd}
        onLogout={onLogout}
        navigate={navigate}
      />
    );
  }

  return <AdminFlow currentUser={currentUser} onLogout={onLogout} navigate={navigate} />;
};

export default AppContent;

/* ============================================================
   ADMIN FLOW
============================================================ */

interface AdminFlowProps {
  currentUser: any;
  onLogout: () => void;
  navigate: ReturnType<typeof useNavigate>;
}

const AdminFlow: React.FC<AdminFlowProps> = ({ currentUser, onLogout, navigate }) => (
  <div className="app-container">
    <header className="main-header">
      <div className="brand">
        <div className="logo">NP</div>
        <h1>NeuroPath</h1>
      </div>
      <div className="nav-tabs">
        <button onClick={() => navigate('/admin')} className="admin-link">
          👑 Admin Panel
        </button>
        <div className="user-info">
          <span className="user-name">{currentUser.name}</span>
          <span className="user-role">👑</span>
          <button onClick={onLogout} className="logout-btn" title="Đăng xuất">⎋</button>
        </div>
      </div>
    </header>
    <main className="main-body">
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Chào mừng Admin</h2>
        <p>Vui lòng sử dụng Admin Panel để quản lý hệ thống</p>
      </div>
    </main>
  </div>
);

/* ============================================================
   PARENT FLOW
============================================================ */

interface ParentFlowProps {
  currentUser: any;
  parentStep: ParentFlowStep;
  setParentStep: React.Dispatch<React.SetStateAction<ParentFlowStep>>;
  currentChild: ChildProfile | null;
  childName: string;
  setChildName: React.Dispatch<React.SetStateAction<string>>;
  selectedGroupId: string | null;
  setSelectedGroupId: React.Dispatch<React.SetStateAction<string | null>>;
  currentAssessmentId: string | null;
  currentProgramInfo: any;
  canStartSession: boolean;
  assessmentResult: any;
  isAnalyzing: boolean;
  sessionMessage: string | null;
  records: any[];
  currentAnalysis: any;
  handleChildProfileComplete: (childData: ChildProfile) => void;
  handleScreenerComplete: (result: any) => void;
  handleStartSession: () => void;
  handleDeviceCheckComplete: () => void;
  handleSessionEndCallback: (result: any) => Promise<void>;
  handleBackToStart: () => void;
  handleManageProfiles: () => void;
  handleFeatureStream: (feature: any) => void;
  onLogout: () => void;
  navigate: ReturnType<typeof useNavigate>;
}

const ParentFlow: React.FC<ParentFlowProps> = ({
  currentUser,
  parentStep,
  setParentStep,
  currentChild,
  childName,
  setChildName,
  selectedGroupId,
  setSelectedGroupId,
  currentAssessmentId,
  currentProgramInfo,
  canStartSession,
  assessmentResult,
  isAnalyzing,
  sessionMessage,
  handleChildProfileComplete,
  handleScreenerComplete,
  handleStartSession,
  handleDeviceCheckComplete,
  handleSessionEndCallback,
  handleBackToStart,
  handleManageProfiles,
  handleFeatureStream,
  onLogout,
}) => {
  return (
    <div className="app-container">
      {isAnalyzing && (
        <div className="analysis-overlay">
          <div className="loading-box">
            <div className="spinner"></div>
            <h3>Đang phân tích hành vi AI...</h3>
            <p>Vui lòng đợi trong giây lát</p>
          </div>
        </div>
      )}

      {sessionMessage && (
        <div className="session-message" style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#fef3c7',
          color: '#92400e',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          zIndex: 1000,
          textAlign: 'center',
          fontSize: '1.2rem',
          border: '2px solid #fbbf24',
          animation: 'fadeInOut 2s ease-in-out'
        }}>
          {sessionMessage}
        </div>
      )}

      <header className="main-header">
        <div className="brand">
          <div className="logo">NP</div>
          <h1>NeuroPath</h1>
        </div>
        <div className="nav-tabs">
          <button
            onClick={() => setParentStep(ParentFlowStep.START)}
            className={parentStep === ParentFlowStep.START ? 'active' : ''}
          >
            Đánh giá
          </button>
          <button
            onClick={handleManageProfiles}
            className="child-profile-btn"
          >
            👶 Hồ sơ trẻ
          </button>
          <div className="user-info">
            <span className="user-name">{currentUser.name}</span>
            <span className="user-role">👨‍👩‍👧‍👦</span>
            <button onClick={onLogout} className="logout-btn" title="Đăng xuất">⎋</button>
          </div>
        </div>
      </header>

      <main className="main-body">
        {parentStep === ParentFlowStep.CHILD_PROFILE && (
          <ChildProfileScreen 
            onComplete={handleChildProfileComplete} 
            isNewUser={true} 
          />
        )}

        {parentStep === ParentFlowStep.SCREENER && currentChild && (
          <>
            <div className="screener-header-info">
              <h2>Bảng câu hỏi sàng lọc sơ bộ</h2>
              <div className="child-info-badge">
                <span>👶 Bé: {currentChild.name}</span>
                <span>🎂 {currentChild.age?.years || 0} tuổi {currentChild.age?.months || 0} tháng</span>
              </div>
            </div>
            <Screener onComplete={handleScreenerComplete} />
          </>
        )}

        {parentStep === ParentFlowStep.PREP && (
          <AssessmentPrep
            onStartAssessment={handleDeviceCheckComplete}
            childName={currentChild?.name || childName || 'Bé'}
          />
        )}

        {parentStep === ParentFlowStep.SESSION &&
          canStartSession &&
          currentProgramInfo && (
            <div className="game-wrapper">
              <GameEngine
                age={currentProgramInfo.numericAge}
                childName={childName || currentChild?.name || 'Bé'}
                childId={currentChild?.id}
                assessmentId={currentAssessmentId || undefined}
                userId={currentUser.id}
                themeId="default"
                specificAsset={null}
                onFeatureCapture={handleFeatureStream}
                onSessionEnd={handleSessionEndCallback}
              />
            </div>
          )}

        {parentStep === ParentFlowStep.REPORT &&
          assessmentResult &&
          currentChild && (
            <ParentReport
              assessmentResult={assessmentResult}
              childName={currentChild.name}
              onBack={handleBackToStart}
            />
          )}

        {parentStep === ParentFlowStep.START && (
          <StartScreen
            childName={childName}
            setChildName={setChildName}
            selectedGroupId={selectedGroupId}
            setSelectedGroupId={setSelectedGroupId}
            onStartSession={handleStartSession}
            onManageProfiles={handleManageProfiles}
            programInfo={PROGRAM_INFO}
            currentUser={currentUser}
            currentChild={currentChild}
            disableStart={!canStartSession}
          />
        )}
      </main>
    </div>
  );
};

/* ============================================================
   CLINICIAN FLOW
============================================================ */

interface ClinicianFlowProps {
  currentUser: any;
  demoStep: DemoStep;
  setDemoStep: React.Dispatch<React.SetStateAction<DemoStep>>;
  clinicianMode: ClinicianMode;
  setClinicianMode: React.Dispatch<React.SetStateAction<ClinicianMode>>;
  selectedGroupId: string | null;
  setSelectedGroupId: React.Dispatch<React.SetStateAction<string | null>>;
  currentProgramInfo: any;
  canStartSession: boolean;
  childName: string;
  setChildName: React.Dispatch<React.SetStateAction<string>>;
  records: any[];
  currentAnalysis: any;
  handleFeatureStream: (feature: any) => void;
  handleClinicianStartSession: () => void;
  handleClinicianSessionEnd: (result: any) => Promise<void>;
  onLogout: () => void;
  navigate: ReturnType<typeof useNavigate>;
}

const ClinicianFlow: React.FC<ClinicianFlowProps> = ({
  currentUser,
  clinicianMode,
  setClinicianMode,
  selectedGroupId,
  setSelectedGroupId,
  currentProgramInfo,
  canStartSession,
  childName,
  setChildName,
  records,
  currentAnalysis,
  handleFeatureStream,
  handleClinicianStartSession,
  handleClinicianSessionEnd,
  onLogout,
  navigate,
}) => {
  return (
    <div className="app-container">
      <header className="main-header">
        <div className="brand">
          <div className="logo">NP</div>
          <h1>NeuroPath</h1>
        </div>
        <div className="nav-tabs">
          <button
            onClick={() => setClinicianMode(ClinicianMode.DEMO)}
            className={clinicianMode === ClinicianMode.DEMO ? 'active' : ''}
          >
            Demo Game
          </button>
          <button
            onClick={() => setClinicianMode(ClinicianMode.DASHBOARD)}
            className={clinicianMode === ClinicianMode.DASHBOARD ? 'active' : ''}
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate('/specialist')}
            className="specialist-link"
            style={{ marginLeft: '0.5rem', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            📋 Danh sách trẻ
          </button>
          <div className="user-info">
            <span className="user-name">{currentUser.name}</span>
            <span className="user-role">👨‍⚕️</span>
            <button onClick={onLogout} className="logout-btn" title="Đăng xuất">⎋</button>
          </div>
        </div>
      </header>

      <main className="main-body">
        {clinicianMode === ClinicianMode.DEMO && (
          <>
            {canStartSession && currentProgramInfo ? (
              <div className="game-wrapper">
                <GameEngine
                  age={currentProgramInfo.numericAge}
                  childName={childName || 'Bé Demo'}
                  childId={undefined}
                  assessmentId={undefined}
                  userId={currentUser.id}
                  themeId="default"
                  specificAsset={null}
                  onFeatureCapture={handleFeatureStream}
                  onSessionEnd={handleClinicianSessionEnd}
                />
              </div>
            ) : (
              <StartScreen
                childName={childName}
                setChildName={setChildName}
                selectedGroupId={selectedGroupId}
                setSelectedGroupId={setSelectedGroupId}
                onStartSession={handleClinicianStartSession}
                onManageProfiles={() => {}}
                programInfo={PROGRAM_INFO}
                currentUser={currentUser}
                currentChild={null}
                disableStart={!canStartSession}
              />
            )}
          </>
        )}

        {clinicianMode === ClinicianMode.DASHBOARD && (
          <div className="dashboard-wrapper">
            <div className="dashboard-header">
              <h2>Hồ sơ bệnh án điện tử</h2>
              <div className="stats-row">
                <div className="stat-pill">Tổng Sessions: <b>{records.length}</b></div>
                <div className="user-info-pill">
                  <span className="user-icon">👨‍⚕️</span>
                  <span>{currentUser.name}</span>
                </div>
              </div>
            </div>
            <ClinicianDashboard records={records} latestAnalysis={currentAnalysis} />
          </div>
        )}
      </main>
    </div>
  );
};