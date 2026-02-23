import React, { useEffect } from 'react';
import { UIUser } from '../context/AuthContext';
import { ChildProfile } from '../types';

// ============================================
// ĐỊNH NGHĨA KIỂU
// ============================================
type AgeGroupInfo = {
  id: string;
  label: string;
  description: string;
  targetTime: string;
  numericAge: number;
  previewList: string[];
};

interface StartScreenProps {
    childName: string;
    setChildName: (name: string) => void;
    selectedGroupId: string | null;
    setSelectedGroupId: (id: string) => void;
    onStartSession: () => void;
    onManageProfiles: () => void;
    programInfo: Record<string, AgeGroupInfo>;
    currentUser: UIUser;
    currentChild: ChildProfile | null;
    disableStart?: boolean;
  }

// ============================================
// START SCREEN COMPONENT
// ============================================
const StartScreen: React.FC<StartScreenProps> = ({
  childName,
  setChildName,
  selectedGroupId,
  setSelectedGroupId,
  onStartSession,
  onManageProfiles,
  programInfo,
  currentUser,
  currentChild,
  disableStart = false
}) => {
  // Auto-select group based on child age
  useEffect(() => {
    if (currentChild && currentChild.age) {
      const ageInMonths = currentChild.age.years * 12 + currentChild.age.months;
      let closestGroup = Object.values(programInfo).reduce((prev, curr) =>
        Math.abs(curr.numericAge - ageInMonths) < Math.abs(prev.numericAge - ageInMonths) ? curr : prev
      );
      setSelectedGroupId(closestGroup.id);
    }
  }, [currentChild, programInfo, setSelectedGroupId]);

  return (
    <div className="setup-container">
      <div className="user-welcome">
        <div className="welcome-left">
          <span className="welcome-text">Xin chào, {currentUser.name}</span>
          <span className="user-role-badge">
            {currentUser.role === 'parent' ? '👨‍👩‍👧‍👦 Phụ huynh' : 
             currentUser.role === 'specialist' ? '👨‍⚕️ Chuyên gia' : 
             '👑 Admin'}
          </span>
        </div>
        {currentChild && (
          <div className="current-child-info">
            <span className="child-label">👶 Bé đang đánh giá:</span>
            <span className="child-name">
              {currentChild.name} ({currentChild.age?.years || 0} tuổi {currentChild.age?.months || 0} tháng)
            </span>
          </div>
        )}
      </div>

      <h2 className="setup-title">Thiết lập buổi đánh giá</h2>

      {currentUser.role === 'parent' && !currentChild && (
        <div className="input-group">
          <label>Tên bé:</label>
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="Nhập tên bé..."
            className="name-input"
            autoFocus
          />
        </div>
      )}

      {(currentUser.role === 'specialist' || currentUser.role === 'admin') && (
        <div className="clinician-note">
          <div className="note-icon">💡</div>
          <div className="note-content">
            <strong>Chế độ {currentUser.role === 'admin' ? 'Admin' : 'Chuyên gia'}:</strong> 
            {currentUser.role === 'admin' 
              ? ' Bạn có thể quản lý hệ thống qua Admin Panel.'
              : ' Bạn có thể tạo buổi đánh giá demo.'}
          </div>
        </div>
      )}

      <div className="program-grid">
        {Object.values(programInfo).map((group) => (
          <div
            key={group.id}
            onClick={() => setSelectedGroupId(group.id)}
            className={`program-card ${selectedGroupId === group.id ? 'selected' : ''}`}
          >
            <div className="card-header">
              <span className="card-label">{group.label}</span>
              {selectedGroupId === group.id && <span className="check-icon">✓</span>}
            </div>
            <div className="card-meta">⏱ {group.targetTime}</div>
            <div className="card-desc">{group.description}</div>
            {currentChild?.age && (
              <div className="age-match">
                <span className={`match-indicator ${
                  Math.abs(currentChild.age.years * 12 + currentChild.age.months - group.numericAge) <= 6 
                    ? 'match-good' 
                    : 'match-fair'
                }`}>
                  {Math.abs(currentChild.age.years * 12 + currentChild.age.months - group.numericAge) <= 6 
                    ? '✓ Phù hợp' 
                    : '∼ Có thể thử'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedGroupId && (
        <div className="preview-box">
          <h4>📋 Lộ trình bài tập dự kiến:</h4>
          <div className="tags-container">
            {programInfo[selectedGroupId].previewList.map((gameName, idx) => (
              <span key={idx} className="game-tag">{idx + 1}. {gameName}</span>
            ))}
          </div>
        </div>
      )}

      <div className="session-actions">
        <button
          onClick={onStartSession}
          disabled={disableStart || !selectedGroupId}
          className="start-btn"
          style={{
            opacity: (disableStart || !selectedGroupId) ? 0.5 : 1,
            cursor: (disableStart || !selectedGroupId) ? 'not-allowed' : 'pointer'
          }}
        >
          🚀 Chuẩn bị đánh giá
        </button>

        {currentUser.role === 'parent' && (
          <button className="manage-profiles-btn" onClick={onManageProfiles}>
            👥 Quản lý hồ sơ trẻ
          </button>
        )}
      </div>
    </div>
  );
};

export default StartScreen;