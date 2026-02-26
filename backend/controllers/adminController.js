const sql = require('mssql');
const bcrypt = require('bcrypt');
const { poolPromise } = require('../config/database');

/**
 * Lấy tất cả người dùng
 * GET /api/admin/users
 */
exports.getAllUsers = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT id, username, email, phone, full_name, role, is_active, created_at
                FROM [users]
                ORDER BY created_at DESC
            `);
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Lỗi lấy danh sách users:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Tạo người dùng mới - ĐÃ SỬA
 * POST /api/admin/users
 */
exports.createUser = async (req, res) => {
    try {
        const { username, email, full_name, role, password, phone } = req.body;
        const pool = await poolPromise;

        // Validation cơ bản
        if (!username || !email || !full_name || !role || !password) {
            return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
        }

        // Kiểm tra email đã tồn tại
        const emailCheck = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT id FROM [users] WHERE email = @email');
        
        if (emailCheck.recordset.length > 0) {
            return res.status(400).json({ error: 'Email đã được sử dụng' });
        }

        // Kiểm tra username
        const usernameCheck = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT id FROM [users] WHERE username = @username');
        
        if (usernameCheck.recordset.length > 0) {
            return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
        }

        // Kiểm tra phone nếu có
        if (phone) {
            const phoneCheck = await pool.request()
                .input('phone', sql.NVarChar, phone)
                .query('SELECT id FROM [users] WHERE phone = @phone');
            
            if (phoneCheck.recordset.length > 0) {
                return res.status(400).json({ error: 'Số điện thoại đã được sử dụng' });
            }
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user mới - KHÔNG cần INSERT id vì DB tự tạo
        const result = await pool.request()
            .input('username', sql.NVarChar(50), username)
            .input('email', sql.NVarChar(100), email)
            .input('phone', sql.NVarChar(20), phone || null)
            .input('full_name', sql.NVarChar(100), full_name)
            .input('password_hash', sql.NVarChar(255), hashedPassword)
            .input('role', sql.NVarChar(20), role)
            .input('is_active', sql.Bit, 1)
            .query(`
                INSERT INTO [users] (username, email, phone, full_name, password_hash, role, is_active)
                OUTPUT INSERTED.id, INSERTED.created_at
                VALUES (@username, @email, @phone, @full_name, @password_hash, @role, @is_active)
            `);

        res.status(201).json({ 
            id: result.recordset[0].id,
            created_at: result.recordset[0].created_at,
            message: 'Tạo người dùng thành công' 
        });
    } catch (err) {
        console.error('Lỗi tạo user:', err);
        
        // Xử lý lỗi foreign key constraint nếu có
        if (err.number === 547) {
            return res.status(400).json({ error: 'Dữ liệu không hợp lệ hoặc vi phạm ràng buộc' });
        }
        
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Lấy thống kê hệ thống - ĐÃ SỬA lỗi started_by/created_by
 * GET /api/admin/stats
 */
exports.getSystemStats = async (req, res) => {
    try {
        const pool = await poolPromise;
        
        // 1. Lấy các con số tổng quát bằng 1 câu query duy nhất (Nhanh & An toàn)
        const countResult = await pool.request()
            .query(`
                SELECT 
                    (SELECT COUNT(*) FROM [users]) as total_users,
                    (SELECT COUNT(*) FROM [children]) as total_children,
                    (SELECT COUNT(*) FROM [assessments]) as total_assessments,
                    (SELECT COUNT(*) FROM [games]) as total_games
            `);
        
        const counts = countResult.recordset[0];

        // 2. Lấy phân bố mức độ nguy cơ (Risk Level)
        const riskResult = await pool.request()
            .query(`
                SELECT 
                    ISNULL(risk_level, N'Chưa xác định') as risk_level,
                    COUNT(*) as count
                FROM [assessments]
                GROUP BY risk_level
            `);

        // 3. Lấy 5 hoạt động gần đây nhất
        const activitiesResult = await pool.request()
            .query(`
                SELECT TOP 5
                    a.id,
                    a.created_at,
                    c.full_name as child_name,
                    u.full_name as user_name
                FROM [assessments] a
                LEFT JOIN [children] c ON a.child_id = c.id
                LEFT JOIN [users] u ON a.started_by = u.id
                ORDER BY a.created_at DESC
            `);

        const formattedActivities = activitiesResult.recordset.map(act => ({
            description: `Đánh giá mới cho trẻ ${act.child_name || 'N/A'}${act.user_name ? ' bởi ' + act.user_name : ''}`,
            created_at: act.created_at
        }));

        // 4. Trả về kết quả đúng cấu hình Frontend mong đợi
        res.status(200).json({
            total_users: counts.total_users || 0,
            total_children: counts.total_children || 0,
            total_assessments: counts.total_assessments || 0,
            total_games: counts.total_games || 0,
            assessments_by_risk: riskResult.recordset.length > 0 ? riskResult.recordset : [{ risk_level: 'Chưa xác định', count: 0 }],
            recent_activities: formattedActivities.length > 0 ? formattedActivities : [{
                description: 'Chưa có hoạt động nào gần đây',
                created_at: new Date().toISOString()
            }]
        });

    } catch (error) {
        console.error("❌ Lỗi stats API:", error);
        res.status(500).json({ 
            error: "Không thể lấy dữ liệu thống kê",
            details: error.message 
        });
    }
};
// Các hàm khác giữ nguyên nhưng thêm [brackets] cho tên bảng để tránh lỗi keyword
// Ví dụ:
exports.getAllChildren = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT c.*, u.full_name as parent_name
                FROM [children] c
                LEFT JOIN [users] u ON c.parent_id = u.id
                ORDER BY c.created_at DESC
            `);
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Lỗi lấy danh sách trẻ:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

// Thêm hàm kiểm tra kết nối database
exports.checkDatabase = async (req, res) => {
    try {
        const pool = await poolPromise;
        
        // Kiểm tra các bảng chính
        const tables = ['users', 'children', 'assessments', 'games', 'skills'];
        const tableStatus = [];
        
        for (const table of tables) {
            try {
                const result = await pool.request()
                    .query(`SELECT TOP 1 * FROM [${table}]`);
                tableStatus.push({
                    table,
                    exists: true,
                    hasData: result.recordset.length > 0
                });
            } catch (err) {
                tableStatus.push({
                    table,
                    exists: false,
                    error: err.message
                });
            }
        }
        
        // Kiểm tra cấu hình GUID
        const guidCheck = await pool.request()
            .query(`
                SELECT 
                    COLUMN_NAME, 
                    COLUMN_DEFAULT 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'users' 
                AND COLUMN_NAME = 'id'
            `);
        
        const hasDefaultGuid = guidCheck.recordset[0]?.COLUMN_DEFAULT?.includes('newid') || false;
        
        res.json({
            connected: true,
            database: pool.config.database,
            tables: tableStatus,
            guid_config: {
                has_default: hasDefaultGuid,
                default_value: guidCheck.recordset[0]?.COLUMN_DEFAULT
            }
        });
        
    } catch (err) {
        res.status(500).json({
            connected: false,
            error: err.message
        });
    }
};

// ... (Các hàm getAllUsers, createUser, getSystemStats bạn đã có giữ nguyên)

// ===== USER MANAGEMENT =====
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('SELECT id, username, email, phone, full_name, role, is_active, created_at FROM [users] WHERE id = @id');
        
        if (result.recordset.length === 0) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        res.json(result.recordset[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateUser = async (req, res) => { res.status(501).json({ message: 'Tính năng đang phát triển' }); };
exports.deleteUser = async (req, res) => { res.status(501).json({ message: 'Tính năng đang phát triển' }); };

// ===== CHILD MANAGEMENT =====
exports.getChildById = async (req, res) => { res.status(501).json({ message: 'Tính năng đang phát triển' }); };
exports.createChild = async (req, res) => { res.status(501).json({ message: 'Tính năng đang phát triển' }); };
exports.updateChild = async (req, res) => { res.status(501).json({ message: 'Tính năng đang phát triển' }); };
exports.deleteChild = async (req, res) => { res.status(501).json({ message: 'Tính năng đang phát triển' }); };

// ===== GAMES, NORMS, SKILLS (Tương tự) =====
exports.getGames = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM [games]');
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
};
exports.getGameById = async (req, res) => { res.status(501).json({ message: 'Tính năng' }); };
exports.createGame = async (req, res) => { res.status(501).json({ message: 'Tính năng' }); };
exports.updateGame = async (req, res) => { res.status(501).json({ message: 'Tính năng' }); };
exports.deleteGame = async (req, res) => { res.status(501).json({ message: 'Tính năng' }); };

exports.getNorms = async (req, res) => { res.json([]); };
exports.getNormById = async (req, res) => { res.json({}); };
exports.createNorm = async (req, res) => { res.json({}); };
exports.updateNorm = async (req, res) => { res.json({}); };
exports.deleteNorm = async (req, res) => { res.json({}); };

exports.getSkills = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM [skills]');
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
};
exports.getAgeGroups = async (req, res) => { res.json([]); };


