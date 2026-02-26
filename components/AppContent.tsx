import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAssessment } from '../context/AssessmentContext';
import { ChildProfile, UserRole } from '../types';

import GameEngine from './GameEngine';
import { ClinicianDashboard } from './ClinicianDashboard';
import ChildProfileScreen from './Onboarding/ChildProfile';
import ManageProfiles from './Onboarding/ManageProfiles';
import Screener from './Assessment/Screener';
import AssessmentPrep from './Assessment/AssessmentPrep';
import StartScreen from './StartScreen';
import ParentReport from './ParentReport';
import LoadingSpinner from './LoadingSpinner';

import { PROGRAM_INFO } from '../config/programInfo';
import * as childService from '../services/childService';
import * as assessmentService from '../services/assessmentService';
import cameraService from '../services/cameraService'; 
import inferenceService from '../services/InferenceService';
import '../styles.css';

/* ============================================================
   ENUMS
============================================================ */

export enum ParentFlowStep {
  START = 'start',
  MANAGE_PROFILES = 'manage_profiles',
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

type AssessmentStatus = 'screened' | 'in_progress' | 'completed';

/* ============================================================
   UTILITY FUNCTIONS
============================================================ */

const getTotalMonthsFromBirthDate = (birthDateString?: string): number => {
  if (!birthDateString) return 0;
  const [bYear, bMonth, bDay] = birthDateString.split('-').map(Number);
  const today = new Date();
  const tYear = today.getFullYear();
  const tMonth = today.getMonth() + 1;
  const tDay = today.getDate();

  let totalMonths = (tYear - bYear) * 12 + (tMonth - bMonth);
  if (tDay < bDay) {
    totalMonths--;
  }
  return Math.max(0, totalMonths);
};

const formatAgeFromBirthDate = (birthDateString?: string): string => {
  const totalMonths = getTotalMonthsFromBirthDate(birthDateString);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  
  if (years === 0) return `${months} tháng`;
  if (months === 0) return `${years} tuổi`;
  return `${years} tuổi ${months} tháng`;
};

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
  const [pauseNotice, setPauseNotice] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pauseNotice) {
      timer = setTimeout(() => setPauseNotice(false), 60000);
    }
    return () => clearTimeout(timer);
  }, [pauseNotice]);
  /* ============================================================
     PARENT FLOW STATE
  ============================================================ */
  const [parentStep, setParentStep] = useState<ParentFlowStep>(ParentFlowStep.START);
  const [editingChild, setEditingChild] = useState<ChildProfile | null>(null);

  /* ============================================================
     CLINICIAN DEMO STATE
  ============================================================ */
  const [demoStep, setDemoStep] = useState<DemoStep>(DemoStep.START);
  const [clinicianMode, setClinicianMode] = useState<ClinicianMode>(ClinicianMode.DEMO);

  const initializedUserId = useRef<string | null>(null);

  /* ============================================================
     COMPUTED
  ============================================================ */
  const currentProgramInfo = useMemo(() => {
    if (!selectedGroupId) return null;
    return PROGRAM_INFO[selectedGroupId] ?? null;
  }, [selectedGroupId]);

  const canStartSession = !!currentProgramInfo;
/* ============================================================
     🔥 TRẠM KIỂM SOÁT CAMERA TOÀN CỤC
  ============================================================ */
  // Trong AppContent.tsx

// 1. Thêm một ref để ghi nhớ trạng thái cũ
const wasInSession = useRef(false);

useEffect(() => {
  const isParentActiveCam = parentStep === ParentFlowStep.PREP || parentStep === ParentFlowStep.SESSION;
  const isClinicianActiveCam = demoStep === DemoStep.SESSION;
  const currentIsActive = isParentActiveCam || isClinicianActiveCam;

  if (!currentIsActive && wasInSession.current) {
    console.log("🛑 Trạm kiểm soát: Phát hiện thoát phiên, đang dập tắt phần cứng...");

    inferenceService.dispose();

    setTimeout(() => {
      cameraService.stopCamera();
    }, 200);
  }

  wasInSession.current = currentIsActive;
}, [parentStep, demoStep]);

  /* ============================================================
     INITIALIZE PARENT DATA
  ============================================================ */
  useEffect(() => {
    if (!currentUser || currentUser.role !== UserRole.PARENT) return;
    
    if (initializedUserId.current === currentUser.id) return;
    initializedUserId.current = currentUser.id;

    const children = childService.getChildrenByParent(currentUser.id);

    if (children.length === 0) {
      setParentStep(ParentFlowStep.CHILD_PROFILE);
      return;
    }

    const storedChildId = localStorage.getItem('neuropath_child_id');
    const selectedChild = children.find((c) => c.id === storedChildId) || children[0];
    const mappedChild = childService.mapDBChildToChildProfile(selectedChild);

    setCurrentChild(mappedChild);
    setChildName(mappedChild.name);

    const assessments = assessmentService.getAssessmentsByChild(mappedChild.id);
    const activeAssessment = assessments
      .filter((a: any) => a.status === 'in_progress')
      .sort((a: any, b: any) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0];
    
    if (activeAssessment) {
      setCurrentAssessmentId(activeAssessment.id);
    }

    const hasCompletedOrInProgress = assessments.some(
      (a: any) => a.status === 'completed' || a.status === 'in_progress'
    );

    if (!hasCompletedOrInProgress) {
      setParentStep(ParentFlowStep.SCREENER);
    } else {
      setParentStep(ParentFlowStep.START);
    }
  }, [currentUser]);

  /* ============================================================
     EARLY RETURN
  ============================================================ */
  if (!currentUser) {
    return <LoadingSpinner message="Đang tải thông tin người dùng..." />;
  }

  /* ============================================================
     PARENT HANDLERS
  ============================================================ */

  const handleManageProfiles = useCallback(() => {
    const isSafe = parentStep === ParentFlowStep.START || parentStep === ParentFlowStep.REPORT;
    if (!isSafe) return;
    setParentStep(ParentFlowStep.MANAGE_PROFILES);
  }, [parentStep]);

  const handleGoHome = useCallback(() => {
    const isSafe = parentStep === ParentFlowStep.START || parentStep === ParentFlowStep.REPORT;
    if (!isSafe) return;
    setParentStep(ParentFlowStep.START);
  }, [parentStep]);

  const handleAddNewChild = useCallback(() => {
    setEditingChild(null);
    setSelectedGroupId(null);
    setParentStep(ParentFlowStep.CHILD_PROFILE);
  }, []);

  const handleEditChild = useCallback((child: ChildProfile) => {
    setEditingChild(child);
    setSelectedGroupId(null);
    setParentStep(ParentFlowStep.CHILD_PROFILE);
  }, []);

  const handleSelectChildForAssessment = useCallback((child: ChildProfile) => {
    setCurrentChild(child);
    setChildName(child.name);
    localStorage.setItem('neuropath_child_id', child.id);
    setSelectedGroupId(null);
    
    const assessments = assessmentService.getAssessmentsByChild(child.id);
    const activeAssessment = assessments
      .filter((a: any) => a.status === 'in_progress')
      .sort((a: any, b: any) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0];
    
    if (activeAssessment) {
      setCurrentAssessmentId(activeAssessment.id);
    } else {
      setCurrentAssessmentId(null);
    }

    const hasCompletedOrInProgress = assessments.some(
      (a: any) => a.status === 'completed' || a.status === 'in_progress'
    );

    if (!hasCompletedOrInProgress) {
      setParentStep(ParentFlowStep.SCREENER);
    } else {
      setParentStep(ParentFlowStep.START);
    }
  }, []);

  const handleChildProfileComplete = useCallback(
    (childData: ChildProfile) => {
      setCurrentChild(childData);
      localStorage.setItem('neuropath_child_id', childData.id);

      if (editingChild) {
        setEditingChild(null);
        setParentStep(ParentFlowStep.MANAGE_PROFILES);
        return;
      }
      setParentStep(ParentFlowStep.SCREENER);
    },
    [editingChild]
  );

  const handleScreenerComplete = useCallback(
    (result: any) => {
      if (!currentChild) return;

      const assessment = assessmentService.createAssessment({
        child_id: currentChild.id,
        started_by: currentUser.id,
        started_at: new Date().toISOString(),
        status: 'in_progress',
        adaptive_flow: JSON.stringify(result),
      });

      setCurrentAssessmentId(assessment.id);
      
      let autoGroupId = 'g1';
      const totalMonths = getTotalMonthsFromBirthDate(currentChild.birthDate);
      
      if (totalMonths >= 12 && totalMonths < 18) autoGroupId = 'g1';
      else if (totalMonths >= 18 && totalMonths < 24) autoGroupId = 'g2';
      else if (totalMonths >= 24 && totalMonths < 36) autoGroupId = 'g3';
      else if (totalMonths >= 36) autoGroupId = 'g4';

      setSelectedGroupId(autoGroupId);
      setParentStep(ParentFlowStep.PREP);
    },
    [currentChild, currentUser.id]
  );

  const handleStartSession = useCallback(() => {
    if (!canStartSession || !currentChild) return;

    const newAssessment = assessmentService.createAssessment({
      child_id: currentChild.id,
      started_by: currentUser.id,
      started_at: new Date().toISOString(),
      status: 'in_progress',
      adaptive_flow: null,
    });

    setCurrentAssessmentId(newAssessment.id);
    setParentStep(ParentFlowStep.PREP);
  }, [canStartSession, currentChild, currentUser.id]);

  const handleDeviceCheckComplete = useCallback(() => {
    clearSessionMessage();
    setParentStep(ParentFlowStep.SESSION);
  }, [clearSessionMessage]);

  const handleSessionEndCallback = useCallback(
    async (result: any) => {
      // 1. Dọn dẹp camera ngay khi ra khỏi game
      cameraService.stopCamera();

      // 2. Xử lý trường hợp người dùng chủ động bấm "Kết thúc sớm" (Tạm dừng)
      if (result.status === 'aborted') {
        console.log("🛑 Đã nhận lệnh Tạm dừng/Kết thúc sớm từ GameEngine");
        
        // Cập nhật trạng thái CSDL nếu cần
        if (currentAssessmentId) {
          assessmentService.updateAssessment(currentAssessmentId, {
            status: 'abandoned' // Hoặc 'in_progress' nếu bạn muốn cho chơi tiếp sau này
          });
        }
        setParentStep(ParentFlowStep.START);
        
        setPauseNotice(true); 
        return; 
      }

      // 3. Xử lý trường hợp chơi THÀNH CÔNG (Hoàn thành trọn vẹn)
      await handleSessionEnd(
        result,
        currentChild,
        selectedGroupId,
        currentAssessmentId
      );

      if (currentAssessmentId) {
        assessmentService.updateAssessment(currentAssessmentId, {
          status: 'completed'
        });
      }

      setParentStep(ParentFlowStep.REPORT);
    },
    [handleSessionEnd, currentChild, selectedGroupId, currentAssessmentId]
  );

  const handleBackToStart = useCallback(() => {
    setCurrentAssessmentId(null);
    setParentStep(ParentFlowStep.START);
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
      await handleSessionEnd(result, null, selectedGroupId, currentAssessmentId);
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
        editingChild={editingChild}
        handleChildProfileComplete={handleChildProfileComplete}
        handleScreenerComplete={handleScreenerComplete}
        handleStartSession={handleStartSession}
        handleDeviceCheckComplete={handleDeviceCheckComplete}
        handleSessionEndCallback={handleSessionEndCallback}
        handleBackToStart={handleBackToStart}
        handleManageProfiles={handleManageProfiles}
        handleGoHome={handleGoHome}
        handleAddNewChild={handleAddNewChild}
        handleEditChild={handleEditChild}
        handleSelectChildForAssessment={handleSelectChildForAssessment}
        handleFeatureStream={handleFeatureStream}
        onLogout={onLogout}
        navigate={navigate}
        pauseNotice={pauseNotice}
        setPauseNotice={setPauseNotice}
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
  editingChild: ChildProfile | null;
  handleChildProfileComplete: (childData: ChildProfile) => void;
  handleScreenerComplete: (result: any) => void;
  handleStartSession: () => void;
  handleDeviceCheckComplete: () => void;
  handleSessionEndCallback: (result: any) => Promise<void>;
  handleBackToStart: () => void;
  handleManageProfiles: () => void;
  handleGoHome: () => void;
  handleAddNewChild: () => void;
  handleEditChild: (child: ChildProfile) => void;
  handleSelectChildForAssessment: (child: ChildProfile) => void;
  handleFeatureStream: (feature: any) => void;
  onLogout: () => void;
  navigate: ReturnType<typeof useNavigate>;
  pauseNotice: boolean;
  setPauseNotice: React.Dispatch<React.SetStateAction<boolean>>;
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
  editingChild,
  handleChildProfileComplete,
  handleScreenerComplete,
  handleStartSession,
  handleDeviceCheckComplete,
  handleSessionEndCallback,
  handleBackToStart,
  handleManageProfiles,
  handleGoHome,
  handleAddNewChild,
  handleEditChild,
  handleSelectChildForAssessment,
  handleFeatureStream,
  onLogout,
  pauseNotice,
  setPauseNotice,
}) => {
  const ageDisplay = currentChild?.birthDate 
    ? formatAgeFromBirthDate(currentChild.birthDate)
    : 'Chưa xác định';


    return (
      <div className="app-container">
        {pauseNotice && (
          <div style={{
              position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)',
              backgroundColor: '#fef3c7', border: '1px solid #f59e0b', color: '#92400e',
              padding: '15px 25px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              zIndex: 9999, display: 'flex', alignItems: 'center', gap: '15px',
              animation: 'fadeInDown 0.3s ease-out'
          }}>
            <span style={{ fontSize: '20px' }}>⏸️</span>
            <span style={{ fontWeight: '500' }}>Bạn đã tạm dừng đánh giá. (Thông báo sẽ tắt sau 1 phút)</span>
            <button 
              onClick={() => setPauseNotice(false)} 
              style={{border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', marginLeft: '10px'}}
            >✖️</button>
          </div>
      )}

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
            onClick={handleGoHome}
            className={parentStep === ParentFlowStep.START ? 'active' : ''}
          >
            Trang chủ
          </button>
          
          <div className="user-info">
            <span className="user-name">{currentUser.name}</span>
            <span className="user-role">👨‍👩‍👧‍👦</span>
            <button onClick={onLogout} className="logout-btn" title="Đăng xuất">⎋</button>
          </div>
        </div>
      </header>

      <main className="main-body">
        {parentStep === ParentFlowStep.MANAGE_PROFILES && (
          <ManageProfiles
            userId={currentUser.id}
            currentChildId={currentChild?.id}
            onSelect={handleSelectChildForAssessment}
            onEdit={handleEditChild}
            onAddNew={handleAddNewChild}
            onBack={handleBackToStart}
          />
        )}

        {parentStep === ParentFlowStep.CHILD_PROFILE && (
          <ChildProfileScreen 
            onComplete={handleChildProfileComplete} 
            isNewUser={!editingChild && (!currentChild)} 
            editingData={editingChild} 
            onCancel={handleManageProfiles}
          />
        )}

        {parentStep === ParentFlowStep.SCREENER && currentChild && (
          <>
            <div className="screener-header-info">
              <h2>Bảng câu hỏi sàng lọc sơ bộ</h2>
              <div className="child-info-badge">
                <span>👶 Bé: {currentChild.name}</span>
                <span>🎂 {ageDisplay}</span>
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