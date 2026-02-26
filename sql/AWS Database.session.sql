USE  ASD_Screening;
GO

CREATE DATABASE ASD_Screening;
GO

USE ASD_Screening;
GO

/*
============================================================================
DỰ ÁN: ASD-SCREEN AI - FULL DATABASE (17 BẢNG)
Tính năng: Admin, Specialist, Parent, Assessment, Games, Reset Password
============================================================================
*/


-- 1. BẢNG NGƯỜI DÙNG (users)
CREATE TABLE users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    username NVARCHAR(50) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    email NVARCHAR(100) UNIQUE,
    full_name NVARCHAR(100) NOT NULL,
    role NVARCHAR(20) NOT NULL CONSTRAINT CK_User_Role CHECK (role IN ('parent', 'teacher', 'specialist', 'admin')),
    is_active BIT DEFAULT 1,
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- 2. BẢNG TRẺ EM (children)
CREATE TABLE children (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    full_name NVARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    gender NVARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    region NVARCHAR(50),
    primary_language NVARCHAR(50) DEFAULT 'vi',
    notes NVARCHAR(MAX),
    parent_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES users(id) ON DELETE SET NULL,
    created_by UNIQUEIDENTIFIER FOREIGN KEY REFERENCES users(id),
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- 3. BẢNG LIÊN KẾT TRẺ - NGƯỜI GIÁM HỘ (child_guardians)
CREATE TABLE child_guardians (
    child_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES children(id) ON DELETE CASCADE,
    user_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
    relationship NVARCHAR(50),
    is_primary BIT DEFAULT 0,
    assigned_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    professional_notes NVARCHAR(MAX),
    PRIMARY KEY (child_id, user_id)
);
GO

-- 4. BẢNG KHÔI PHỤC MẬT KHẨU (password_resets)
CREATE TABLE password_resets (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
    token NVARCHAR(255) NOT NULL,
    expires_at DATETIMEOFFSET NOT NULL,
    used BIT DEFAULT 0,
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- 5. BẢNG NHÓM TUỔI (age_groups)
CREATE TABLE age_groups (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL,
    min_months INT NOT NULL,
    max_months INT NOT NULL
);
GO

-- 6. BẢNG KỸ NĂNG (skills)
CREATE TABLE skills (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(20) UNIQUE,
    name NVARCHAR(100) NOT NULL,
    domain NVARCHAR(30) NOT NULL CHECK (domain IN ('social', 'communication', 'cognitive', 'motor')),
    description NVARCHAR(MAX),
    weight DECIMAL(3,2) DEFAULT 1.0
);
GO

-- 7. BẢNG TRÒ CHƠI (games)
CREATE TABLE games (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(20) UNIQUE NOT NULL,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX),
    instructions NVARCHAR(MAX),
    min_age_months INT NOT NULL,
    max_age_months INT NOT NULL,
    target_duration_seconds INT,
    media_url NVARCHAR(MAX),
    is_gateway BIT DEFAULT 0,
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- 8. BẢNG LIÊN KẾT GAME - KỸ NĂNG (game_skills)
CREATE TABLE game_skills (
    game_id INT FOREIGN KEY REFERENCES games(id) ON DELETE CASCADE,
    skill_id INT FOREIGN KEY REFERENCES skills(id) ON DELETE CASCADE,
    weight DECIMAL(3,2) DEFAULT 1.0,
    skill_type NVARCHAR(10) CHECK (skill_type IN ('primary', 'secondary')),
    PRIMARY KEY (game_id, skill_id)
);
GO

-- 9. BẢNG PHIÊN ĐÁNH GIÁ (assessments)
CREATE TABLE assessments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    child_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES children(id) ON DELETE CASCADE,
    started_by UNIQUEIDENTIFIER FOREIGN KEY REFERENCES users(id),
    started_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    completed_at DATETIMEOFFSET,
    status NVARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'abandoned')),
    adaptive_flow NVARCHAR(MAX), 
    overall_risk_score DECIMAL(5,2),
    risk_level NVARCHAR(20) CHECK (risk_level IN (N'RẤT CAO', N'CAO', N'TRUNG BÌNH', N'THẤP')),
    report_json NVARCHAR(MAX),
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- 10. BẢNG PHIÊN CHƠI GAME (game_sessions)
CREATE TABLE game_sessions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    assessment_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES assessments(id) ON DELETE CASCADE,
    game_id INT FOREIGN KEY REFERENCES games(id) ON DELETE CASCADE,
    sequence_order INT NOT NULL,
    started_at DATETIMEOFFSET,
    ended_at DATETIMEOFFSET,
    status NVARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'interrupted', 'skipped')),
    raw_data_json NVARCHAR(MAX),
    result_scores NVARCHAR(MAX),
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT unique_assessment_game_order UNIQUE (assessment_id, sequence_order)
);
GO

-- 11. BẢNG CHỈ SỐ CHI TIẾT (game_session_metrics)
CREATE TABLE game_session_metrics (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    game_session_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES game_sessions(id) ON DELETE CASCADE,
    metric_key NVARCHAR(50) NOT NULL,
    metric_value DECIMAL(10,3),
    unit NVARCHAR(20),
    captured_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- 12. BẢNG FILE MEDIA (media_files) - QUAN TRỌNG CHO AI PHÂN TÍCH
CREATE TABLE media_files (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    game_session_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES game_sessions(id) ON DELETE CASCADE,
    file_type NVARCHAR(10) CHECK (file_type IN ('video', 'audio')),
    file_path NVARCHAR(MAX) NOT NULL,
    uploaded_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- 13. BẢNG CHUẨN PHÁT TRIỂN (norms)
CREATE TABLE norms (
    id INT IDENTITY(1,1) PRIMARY KEY,
    skill_id INT FOREIGN KEY REFERENCES skills(id) ON DELETE CASCADE,
    age_group_id INT FOREIGN KEY REFERENCES age_groups(id) ON DELETE CASCADE,
    mean DECIMAL(6,3) NOT NULL,
    std_dev DECIMAL(6,3) NOT NULL,
    sample_size INT,
    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- 14. BẢNG GHI CHÚ NHANH (quick_notes)
CREATE TABLE quick_notes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    child_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES children(id) ON DELETE CASCADE,
    created_by UNIQUEIDENTIFIER FOREIGN KEY REFERENCES users(id),
    note_type NVARCHAR(20) CHECK (note_type IN ('progress', 'behavior', 'other')),
    content NVARCHAR(MAX) NOT NULL,
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- 15. BẢNG BÁO CÁO HÀNG NGÀY (daily_reports) - QUAN TRỌNG CHO PHỤ HUYNH
CREATE TABLE daily_reports (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    child_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES children(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    summary NVARCHAR(MAX),
    mood NVARCHAR(20),
    sleep_quality NVARCHAR(20),
    eating_quality NVARCHAR(20),
    activities NVARCHAR(MAX),
    notes NVARCHAR(MAX),
    created_by UNIQUEIDENTIFIER FOREIGN KEY REFERENCES users(id),
    sent_to_parent BIT DEFAULT 0,
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- 16. BẢNG TIN NHẮN (messages)
CREATE TABLE messages (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    from_user_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES users(id),
    to_user_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES users(id),
    child_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES children(id) ON DELETE CASCADE,
    content NVARCHAR(MAX) NOT NULL,
    is_read BIT DEFAULT 0,
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    read_at DATETIMEOFFSET
);
GO

-- 17. BẢNG KẾ HOẠCH CAN THIỆP (intervention_plans)
CREATE TABLE intervention_plans (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    child_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES children(id) ON DELETE CASCADE,
    specialist_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES users(id),
    start_date DATE NOT NULL,
    end_date DATE,
    goals_json NVARCHAR(MAX),
    activities_json NVARCHAR(MAX),
    status NVARCHAR(20) DEFAULT 'active',
    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);
GO

-- ============================================================================
-- INDEXES (Tối ưu hóa tốc độ truy vấn)
-- ============================================================================
CREATE INDEX idx_children_parent ON children(parent_id);
CREATE INDEX idx_assessments_child ON assessments(child_id);
CREATE INDEX idx_game_sessions_assessment ON game_sessions(assessment_id);
CREATE INDEX idx_password_resets_token ON password_resets(token);
CREATE INDEX idx_messages_unread ON messages(to_user_id) WHERE is_read = 0;
GO

-- ============================================================================
-- TRIGGERS (Tự động cập nhật thời gian và kiểm tra logic)
-- ============================================================================

-- Tự động cập nhật updated_at cho users
CREATE TRIGGER trg_UpdateUsersUpdatedAt ON users AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE users SET updated_at = SYSDATETIMEOFFSET() FROM inserted WHERE users.id = inserted.id;
END;
GO

-- Tự động cập nhật updated_at cho children
CREATE TRIGGER trg_UpdateChildrenUpdatedAt ON children AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE children SET updated_at = SYSDATETIMEOFFSET() FROM inserted WHERE children.id = inserted.id;
END;
GO

-- Kiểm tra vai trò khi gán phụ huynh vào trẻ
CREATE TRIGGER trg_CheckParentRole ON children AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM inserted i 
        JOIN users u ON i.parent_id = u.id 
        WHERE u.role NOT IN ('parent', 'admin')
    )
    BEGIN
        RAISERROR ('Người giám hộ phải là Parent hoặc Admin.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

-- ============================================================================
-- DỮ LIỆU MẪU (SEED DATA)
-- ============================================================================
INSERT INTO age_groups (name, min_months, max_months) VALUES
(N'12-18 tháng', 12, 18), (N'18-24 tháng', 18, 24), (N'2-3 tuổi', 24, 36);

INSERT INTO skills (code, name, domain, weight) VALUES
('joint_attention', N'Chú ý chia sẻ', 'social', 0.25),
('imitation', N'Bắt chước', 'social', 0.20);
GO-- ============================================================================
-- KHỞI TẠO TÀI KHOẢN QUẢN TRỊ VIÊN BAN ĐẦU
-- ============================================================================
-- Lưu ý: Trong thực tế, 'password_hash' phải là chuỗi đã được mã hóa (bcrypt/argon2) từ Backend.
-- Dưới đây là ví dụ để bạn có dữ liệu test trong DB.

INSERT INTO users (username, password_hash, email, phone, full_name, role, is_active)
VALUES (
    'admin', 
    '$2b$10$YourHashedPasswordExample', -- Chuỗi hash mẫu
    'admin@asdscreen.com', 
    '0901234567', -- Số điện thoại của Admin
    N'Quản trị viên hệ thống', 
    'admin', 
    1
);

-- Thêm một chuyên gia mẫu để test tính năng Chuyên gia
INSERT INTO users (username, password_hash, email, phone, full_name, role, is_active)
VALUES (
    'bacsi_minh', 
    '$2b$10$YourHashedPasswordExample', 
    'minh.nguyen@clinic.com', 
    '0987654321', -- Số điện thoại của Bác sĩ Minh
    N'BS. Nguyễn Văn Minh', 
    'specialist', 
    1
);
GO

ALTER LOGIN [sa] WITH PASSWORD=N'MatKhau@123456!', CHECK_POLICY=OFF;
ALTER LOGIN [sa] ENABLE;

SELECT * FROM users;

ALTER TABLE users ADD phone NVARCHAR(20);
GO
ALTER TABLE users ADD CONSTRAINT UQ_User_Phone UNIQUE(phone);
GO
UPDATE users SET phone = '0901234567' WHERE username = 'admin';
UPDATE users SET phone = '0987654321' WHERE username = 'bacsi_minh';
GO

UPDATE users 
SET password_hash = '$2b$10$4DFGNYALkr4motVoZnDTFeZ5xuQximoTacmEOlE4V35jWluaYLeVS'
WHERE email = 'minh.nguyen@clinic.com';
GO
UPDATE users 
SET password_hash = '$2b$10$4DFGNYALkr4motVoZnDTFeZ5xuQximoTacmEOlE4V35jWluaYLeVS'
WHERE username = 'admin';
GO

ALTER TABLE password_resets
ADD created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET();

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('assessments') AND name = 'created_at')
BEGIN
    ALTER TABLE assessments ADD created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET();
END
GO

-- Đảm bảo có cột risk_level để không bị lỗi GROUP BY
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('assessments') AND name = 'risk_level')
BEGIN
    ALTER TABLE assessments ADD risk_level NVARCHAR(20);
END
GO