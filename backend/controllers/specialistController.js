const sql = require('mssql');
const { poolPromise } = require('../config/database');

/**
 * MIDDLEWARE: Kiểm tra quyền truy cập vào trẻ
 * Tái sử dụng cho nhiều hàm
 */
const checkChildAccess = async (pool, childId, specialistId) => {
    const result = await pool.request()
        .input('child_id', sql.UniqueIdentifier, childId)
        .input('specialist_id', sql.UniqueIdentifier, specialistId)
        .query(`
            SELECT COUNT(*) as hasAccess
            FROM [children] c
            LEFT JOIN [child_guardians] cg ON c.id = cg.child_id
            WHERE c.id = @child_id 
                AND (cg.user_id = @specialist_id OR c.created_by = @specialist_id)
        `);
    
    return result.recordset[0].hasAccess > 0;
};

/**
 * Lấy danh sách trẻ của chuyên gia - ĐÃ TỐI ƯU
 * GET /api/specialist/children
 */
exports.getChildren = async (req, res) => {
    try {
        const specialistId = req.user.id;
        const pool = await poolPromise;

        // Sử dụng WITH (NOLOCK) cho read-only queries để tránh blocking
        const result = await pool.request()
            .input('specialist_id', sql.UniqueIdentifier, specialistId)
            .query(`
                SELECT DISTINCT 
                    c.id, c.full_name, c.birth_date, c.gender, 
                    c.region, c.primary_language, c.notes,
                    c.parent_id, c.created_by, c.created_at, c.updated_at,
                    u.full_name as parent_name,
                    -- Tính tuổi hiện tại (tháng)
                    DATEDIFF(month, c.birth_date, GETDATE()) as age_months,
                    -- Lấy assessment gần nhất
                    (
                        SELECT TOP 1 created_at 
                        FROM [assessments] a 
                        WHERE a.child_id = c.id 
                        ORDER BY created_at DESC
                    ) as last_assessment_date
                FROM [children] c WITH (NOLOCK)
                LEFT JOIN [child_guardians] cg WITH (NOLOCK) ON c.id = cg.child_id
                LEFT JOIN [users] u WITH (NOLOCK) ON c.parent_id = u.id
                WHERE cg.user_id = @specialist_id OR c.created_by = @specialist_id
                ORDER BY last_assessment_date DESC, c.created_at DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Lỗi lấy danh sách trẻ:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Lấy chi tiết một trẻ - ĐÃ TỐI ƯU VỚI PROMISE.ALL
 * GET /api/specialist/children/:childId
 */
exports.getChildDetail = async (req, res) => {
    try {
        const { childId } = req.params;
        const specialistId = req.user.id;
        const pool = await poolPromise;

        // Kiểm tra quyền truy cập
        const hasAccess = await checkChildAccess(pool, childId, specialistId);
        
        if (!hasAccess) {
            return res.status(403).json({ error: 'Bạn không có quyền xem thông tin trẻ này' });
        }

        // Chạy song song 3 queries để tối ưu tốc độ
        const [childResult, assessmentsResult, notesResult, recentGamesResult] = await Promise.all([
            // Thông tin trẻ
            pool.request()
                .input('child_id', sql.UniqueIdentifier, childId)
                .query(`
                    SELECT 
                        c.*, 
                        u.full_name as parent_name,
                        u.email as parent_email,
                        u.phone as parent_phone,
                        DATEDIFF(month, c.birth_date, GETDATE()) as age_months
                    FROM [children] c WITH (NOLOCK)
                    LEFT JOIN [users] u WITH (NOLOCK) ON c.parent_id = u.id
                    WHERE c.id = @child_id
                `),
            
            // Lịch sử đánh giá
            pool.request()
                .input('child_id', sql.UniqueIdentifier, childId)
                .query(`
                    SELECT 
                        a.id, a.status, a.overall_risk_score, a.risk_level,
                        a.started_at, a.completed_at, a.created_at,
                        u.full_name as specialist_name,
                        -- Đếm số game sessions
                        (SELECT COUNT(*) FROM [game_sessions] gs WHERE gs.assessment_id = a.id) as game_count
                    FROM [assessments] a WITH (NOLOCK)
                    LEFT JOIN [users] u WITH (NOLOCK) ON a.started_by = u.id
                    WHERE a.child_id = @child_id
                    ORDER BY a.created_at DESC
                `),
            
            // Ghi chú gần đây
            pool.request()
                .input('child_id', sql.UniqueIdentifier, childId)
                .query(`
                    SELECT TOP 10
                        qn.id, qn.note_type, qn.content, qn.created_at,
                        u.full_name as created_by_name
                    FROM [quick_notes] qn WITH (NOLOCK)
                    JOIN [users] u WITH (NOLOCK) ON qn.created_by = u.id
                    WHERE qn.child_id = @child_id
                    ORDER BY qn.created_at DESC
                `),
            
            // Game sessions gần đây
            pool.request()
                .input('child_id', sql.UniqueIdentifier, childId)
                .query(`
                    SELECT TOP 5
                        gs.id, g.name as game_name, gs.sequence_order,
                        gs.started_at, gs.ended_at, gs.status
                    FROM [game_sessions] gs WITH (NOLOCK)
                    JOIN [assessments] a WITH (NOLOCK) ON gs.assessment_id = a.id
                    JOIN [games] g WITH (NOLOCK) ON gs.game_id = g.id
                    WHERE a.child_id = @child_id
                    ORDER BY gs.created_at DESC
                `)
        ]);

        if (childResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy trẻ' });
        }

        res.json({ 
            child: childResult.recordset[0],
            assessments: assessmentsResult.recordset,
            recent_notes: notesResult.recordset,
            recent_games: recentGamesResult.recordset
        });
    } catch (err) {
        console.error('Lỗi lấy chi tiết trẻ:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Xem báo cáo chi tiết của một đánh giá - ĐÃ TỐI ƯU
 * GET /api/specialist/assessments/:assessmentId
 */
exports.getAssessmentDetail = async (req, res) => {
    try {
        const { assessmentId } = req.params;
        const specialistId = req.user.id;
        const pool = await poolPromise;

        // Lấy chi tiết assessment và kiểm tra quyền trong 1 query
        const assessmentResult = await pool.request()
            .input('assessment_id', sql.UniqueIdentifier, assessmentId)
            .input('specialist_id', sql.UniqueIdentifier, specialistId)
            .query(`
                SELECT 
                    a.*, 
                    c.full_name as child_name,
                    c.birth_date,
                    c.gender,
                    DATEDIFF(month, c.birth_date, a.created_at) as age_at_assessment_months,
                    u.full_name as specialist_name,
                    -- Kiểm tra quyền
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 
                            FROM [child_guardians] cg 
                            WHERE cg.child_id = a.child_id 
                                AND cg.user_id = @specialist_id
                        ) OR a.started_by = @specialist_id OR c.created_by = @specialist_id
                        THEN 1 ELSE 0 
                    END as hasAccess
                FROM [assessments] a WITH (NOLOCK)
                JOIN [children] c WITH (NOLOCK) ON a.child_id = c.id
                LEFT JOIN [users] u WITH (NOLOCK) ON a.started_by = u.id
                WHERE a.id = @assessment_id
            `);

        if (assessmentResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đánh giá' });
        }

        const assessment = assessmentResult.recordset[0];

        if (!assessment.hasAccess) {
            return res.status(403).json({ error: 'Bạn không có quyền xem đánh giá này' });
        }

        // Lấy game sessions với metrics chi tiết
        const gameSessionsResult = await pool.request()
            .input('assessment_id', sql.UniqueIdentifier, assessmentId)
            .query(`
                SELECT 
                    gs.*, 
                    g.name as game_name, 
                    g.code as game_code,
                    g.description as game_description,
                    -- Lấy metrics của game session
                    (
                        SELECT 
                            metric_key, 
                            metric_value, 
                            unit,
                            captured_at
                        FROM [game_session_metrics] gsm 
                        WHERE gsm.game_session_id = gs.id
                        FOR JSON PATH
                    ) as metrics_json,
                    -- Lấy media files
                    (
                        SELECT 
                            id, 
                            file_type, 
                            file_path,
                            uploaded_at
                        FROM [media_files] mf 
                        WHERE mf.game_session_id = gs.id
                        FOR JSON PATH
                    ) as media_json
                FROM [game_sessions] gs WITH (NOLOCK)
                JOIN [games] g WITH (NOLOCK) ON gs.game_id = g.id
                WHERE gs.assessment_id = @assessment_id
                ORDER BY gs.sequence_order
            `);

        // Parse JSON từ SQL
        const gameSessions = gameSessionsResult.recordset.map(session => ({
            ...session,
            metrics: session.metrics_json ? JSON.parse(session.metrics_json) : [],
            media: session.media_json ? JSON.parse(session.media_json) : []
        }));

        // Xóa các trường JSON gốc
        delete assessment.hasAccess;
        
        res.json({
            ...assessment,
            game_sessions: gameSessions
        });
    } catch (err) {
        console.error('Lỗi lấy chi tiết đánh giá:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Ghi chú nhanh về trẻ - ĐÃ THÊM VALIDATION
 * POST /api/specialist/children/:childId/notes
 */
exports.createQuickNote = async (req, res) => {
    try {
        const { childId } = req.params;
        const { content, noteType } = req.body;
        const specialistId = req.user.id;
        const pool = await poolPromise;

        // Validate input
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Nội dung ghi chú không được để trống' });
        }

        if (content.length > 5000) {
            return res.status(400).json({ error: 'Ghi chú không được vượt quá 5000 ký tự' });
        }

        const validNoteTypes = ['progress', 'behavior', 'other'];
        const normalizedNoteType = noteType && validNoteTypes.includes(noteType) ? noteType : 'other';

        // Kiểm tra quyền và tạo ghi chú trong 1 transaction nếu cần
        const hasAccess = await checkChildAccess(pool, childId, specialistId);
        
        if (!hasAccess) {
            return res.status(403).json({ error: 'Bạn không có quyền ghi chú về trẻ này' });
        }

        // Tạo ghi chú
        const result = await pool.request()
            .input('child_id', sql.UniqueIdentifier, childId)
            .input('created_by', sql.UniqueIdentifier, specialistId)
            .input('note_type', sql.NVarChar(20), normalizedNoteType)
            .input('content', sql.NVarChar(sql.MAX), content.trim())
            .query(`
                INSERT INTO [quick_notes] (child_id, created_by, note_type, content)
                OUTPUT INSERTED.id, INSERTED.created_at
                VALUES (@child_id, @created_by, @note_type, @content)
            `);

        // Lấy thông tin người tạo để trả về
        const userResult = await pool.request()
            .input('user_id', sql.UniqueIdentifier, specialistId)
            .query('SELECT full_name FROM [users] WHERE id = @user_id');

        res.status(201).json({
            id: result.recordset[0].id,
            child_id: childId,
            created_by: specialistId,
            created_by_name: userResult.recordset[0]?.full_name,
            note_type: normalizedNoteType,
            content: content.trim(),
            created_at: result.recordset[0].created_at
        });
    } catch (err) {
        console.error('Lỗi tạo ghi chú:', err);
        
        // Xử lý lỗi foreign key
        if (err.number === 547) {
            return res.status(400).json({ error: 'Trẻ không tồn tại' });
        }
        
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Lấy danh sách ghi chú của trẻ - ĐÃ THÊM PHÂN TRANG
 * GET /api/specialist/children/:childId/notes
 */
exports.getChildNotes = async (req, res) => {
    try {
        const { childId } = req.params;
        const specialistId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const pool = await poolPromise;

        // Parse pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Kiểm tra quyền
        const hasAccess = await checkChildAccess(pool, childId, specialistId);
        
        if (!hasAccess) {
            return res.status(403).json({ error: 'Bạn không có quyền xem ghi chú của trẻ này' });
        }

        // Đếm tổng số ghi chú
        const countResult = await pool.request()
            .input('child_id', sql.UniqueIdentifier, childId)
            .query(`
                SELECT COUNT(*) as total
                FROM [quick_notes]
                WHERE child_id = @child_id
            `);

        // Lấy ghi chú với phân trang
        const notesResult = await pool.request()
            .input('child_id', sql.UniqueIdentifier, childId)
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limitNum)
            .query(`
                SELECT 
                    qn.id, qn.note_type, qn.content, qn.created_at,
                    u.full_name as created_by_name,
                    u.role as created_by_role
                FROM [quick_notes] qn WITH (NOLOCK)
                JOIN [users] u WITH (NOLOCK) ON qn.created_by = u.id
                WHERE qn.child_id = @child_id
                ORDER BY qn.created_at DESC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `);

        res.json({
            notes: notesResult.recordset,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: countResult.recordset[0].total,
                total_pages: Math.ceil(countResult.recordset[0].total / limitNum)
            }
        });
    } catch (err) {
        console.error('Lỗi lấy danh sách ghi chú:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Lấy tất cả danh sách đánh giá mà chuyên gia có quyền xem
 * GET /api/specialist/assessments
 */
exports.getAllAssessments = async (req, res) => {
    try {
        const specialistId = req.user.id;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('specialist_id', sql.UniqueIdentifier, specialistId)
            .query(`
                SELECT 
                    a.id, a.status, a.risk_level, a.overall_risk_score, 
                    a.created_at, c.full_name as child_name, c.id as child_id
                FROM [assessments] a WITH (NOLOCK)
                JOIN [children] c WITH (NOLOCK) ON a.child_id = c.id
                LEFT JOIN [child_guardians] cg WITH (NOLOCK) ON c.id = cg.child_id
                WHERE cg.user_id = @specialist_id 
                   OR a.started_by = @specialist_id 
                   OR c.created_by = @specialist_id
                ORDER BY a.created_at DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Lỗi lấy danh sách đánh giá:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};
/**
 * Thống kê tổng quan cho chuyên gia
 * GET /api/specialist/dashboard/stats
 */
exports.getDashboardStats = async (req, res) => {
    try {
        const specialistId = req.user.id;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('specialist_id', sql.UniqueIdentifier, specialistId)
            .query(`
                SELECT 
                    -- Tổng số trẻ đang theo dõi
                    (
                        SELECT COUNT(DISTINCT c.id)
                        FROM [children] c
                        LEFT JOIN [child_guardians] cg ON c.id = cg.child_id
                        WHERE cg.user_id = @specialist_id OR c.created_by = @specialist_id
                    ) as total_children,
                    
                    -- Tổng số đánh giá đã thực hiện
                    (
                        SELECT COUNT(*)
                        FROM [assessments] a
                        WHERE a.started_by = @specialist_id
                    ) as total_assessments,
                    
                    -- Số đánh giá gần đây (7 ngày)
                    (
                        SELECT COUNT(*)
                        FROM [assessments] a
                        WHERE a.started_by = @specialist_id
                            AND a.created_at >= DATEADD(day, -7, GETDATE())
                    ) as recent_assessments,
                    
                    -- Phân bố mức độ nguy cơ
                    (
                        SELECT 
                            risk_level,
                            COUNT(*) as count
                        FROM [assessments] a
                        WHERE a.started_by = @specialist_id
                        GROUP BY risk_level
                        FOR JSON PATH
                    ) as risk_distribution
            `);

        const stats = result.recordset[0];
        
        // Parse JSON risk distribution
        if (stats.risk_distribution) {
            stats.risk_distribution = JSON.parse(stats.risk_distribution);
        } else {
            stats.risk_distribution = [];
        }

        res.json(stats);
    } catch (err) {
        console.error('Lỗi lấy thống kê dashboard:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};