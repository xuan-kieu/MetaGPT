const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../config/database');
const { sendResetEmail } = require('../utils/emailService');
const { generateToken } = require('../utils/tokenGenerator');

/**
 * Đăng ký tài khoản mới
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
    try {
        const { username, email, password, full_name, role, phone } = req.body;
        const pool = await poolPromise;

        // Kiểm tra dữ liệu đầu vào
        const errors = [];

        // Validate username
        if (!username || username.trim().length < 3) {
            errors.push('Tên đăng nhập phải có ít nhất 3 ký tự');
        } else if (username.trim().length > 50) {
            errors.push('Tên đăng nhập không được vượt quá 50 ký tự');
        } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            errors.push('Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới');
        }

        // Validate email
        if (!email) {
            errors.push('Email không được để trống');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('Email không đúng định dạng');
        }

        // Validate password
        if (!password) {
            errors.push('Mật khẩu không được để trống');
        } else if (password.length < 6) {
            errors.push('Mật khẩu phải có ít nhất 6 ký tự');
        } else if (password.length > 100) {
            errors.push('Mật khẩu không được vượt quá 100 ký tự');
        }

        // Validate full_name
        if (!full_name || full_name.trim().length < 2) {
            errors.push('Họ tên phải có ít nhất 2 ký tự');
        } else if (full_name.trim().length > 100) {
            errors.push('Họ tên không được vượt quá 100 ký tự');
        }

        // Validate phone (nếu có)
        if (phone && !/^(0[0-9]{9})$/.test(phone)) {
            errors.push('Số điện thoại không hợp lệ (phải 10 số, bắt đầu bằng 0)');
        }

        if (errors.length > 0) {
            return res.status(400).json({ 
                error: 'Dữ liệu không hợp lệ',
                details: errors 
            });
        }

        // Kiểm tra email đã tồn tại chưa
        const emailCheck = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT id FROM [users] WHERE email = @email');
        
        if (emailCheck.recordset.length > 0) {
            return res.status(400).json({ 
                error: 'Email đã được sử dụng',
                field: 'email'
            });
        }

        // Kiểm tra username đã tồn tại chưa
        const usernameCheck = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT id FROM [users] WHERE username = @username');
        
        if (usernameCheck.recordset.length > 0) {
            return res.status(400).json({ 
                error: 'Tên đăng nhập đã tồn tại',
                field: 'username'
            });
        }

        // Kiểm tra phone nếu có
        if (phone) {
            const phoneCheck = await pool.request()
                .input('phone', sql.NVarChar, phone)
                .query('SELECT id FROM [users] WHERE phone = @phone');
            
            if (phoneCheck.recordset.length > 0) {
                return res.status(400).json({ 
                    error: 'Số điện thoại đã được sử dụng',
                    field: 'phone'
                });
            }
        }

        // Hash mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user mới
        const result = await pool.request()
            .input('username', sql.NVarChar(50), username.trim())
            .input('email', sql.NVarChar(100), email.toLowerCase().trim())
            .input('phone', sql.NVarChar(20), phone || null)
            .input('full_name', sql.NVarChar(100), full_name.trim())
            .input('password_hash', sql.NVarChar(255), hashedPassword)
            .input('role', sql.NVarChar(20), role || 'parent')
            .input('is_active', sql.Bit, 1)
            .query(`
                INSERT INTO [users] (username, email, phone, full_name, password_hash, role, is_active)
                OUTPUT INSERTED.id, INSERTED.created_at
                VALUES (@username, @email, @phone, @full_name, @password_hash, @role, @is_active)
            `);

        const userId = result.recordset[0].id;

        // Kiểm tra JWT_SECRET tồn tại
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET không được cấu hình trong environment variables');
            return res.status(500).json({ error: 'Lỗi cấu hình máy chủ' });
        }
        
        // Tạo JWT token
        const token = jwt.sign(
            { 
                id: userId, 
                role: role || 'parent',
                email: email.toLowerCase().trim()
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            message: 'Đăng ký thành công',
            token,
            user: {
                id: userId,
                username: username.trim(),
                email: email.toLowerCase().trim(),
                phone: phone || null,
                full_name: full_name.trim(),
                role: role || 'parent',
                created_at: result.recordset[0].created_at
            }
        });
    } catch (err) {
        console.error('Lỗi đăng ký:', err);
        
        // Xử lý lỗi foreign key constraint
        if (err.number === 547) {
            return res.status(400).json({ 
                error: 'Dữ liệu không hợp lệ',
                details: err.message
            });
        }
        
        res.status(500).json({ 
            error: 'Đã xảy ra lỗi máy chủ',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

/**
 * Đăng nhập
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const pool = await poolPromise; 

        // Thêm dòng kiểm tra này để Debug (Rất quan trọng)
        if (!pool) {
            console.error("❌ Pool connection is undefined. Check database.js exports.");
            return res.status(500).json({ error: 'Lỗi kết nối cơ sở dữ liệu' });
        }
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Vui lòng nhập email và mật khẩu' 
            });
        }

        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM [users] WHERE email = @email');
        
        const user = result.recordset[0];
        
        if (!user) {
            return res.status(401).json({ 
                error: 'Email hoặc mật khẩu không đúng' 
            });
        }

        // Kiểm tra tài khoản có bị khóa không
        if (!user.is_active) {
            return res.status(403).json({ 
                error: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.' 
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                error: 'Email hoặc mật khẩu không đúng' 
            });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                full_name: user.full_name,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Lỗi đăng nhập:', err);
        res.status(500).json({ 
            error: 'Đã xảy ra lỗi máy chủ' 
        });
    }
};

/**
 * Lấy thông tin profile
 * GET /api/auth/profile
 */
exports.getProfile = async (req, res) => {
    try {
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, req.user.id)
            .query(`
                SELECT id, username, email, phone, full_name, role, is_active, created_at
                FROM [users] 
                WHERE id = @id
            `);
        
        const user = result.recordset[0];
        
        if (!user) {
            return res.status(404).json({ 
                error: 'Không tìm thấy người dùng' 
            });
        }
        
        res.json({ 
            message: 'Lấy thông tin thành công',
            user 
        });
    } catch (err) {
        console.error('Lỗi lấy profile:', err);
        res.status(500).json({ 
            error: 'Đã xảy ra lỗi máy chủ' 
        });
    }
};

/**
 * Đăng xuất
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
    try {
        // Với JWT, logout chỉ cần xóa token ở client
        res.json({ 
            message: 'Đăng xuất thành công' 
        });
    } catch (err) {
        console.error('Lỗi đăng xuất:', err);
        res.status(500).json({ 
            error: 'Đã xảy ra lỗi máy chủ' 
        });
    }
};

/**
 * Đổi mật khẩu
 * POST /api/auth/change-password
 */
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user.id;
        const pool = await poolPromise;

        // Validate
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ 
                error: 'Vui lòng nhập đầy đủ thông tin' 
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ 
                error: 'Mật khẩu xác nhận không khớp' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                error: 'Mật khẩu mới phải có ít nhất 6 ký tự' 
            });
        }

        if (newPassword.length > 100) {
            return res.status(400).json({ 
                error: 'Mật khẩu mới không được vượt quá 100 ký tự' 
            });
        }

        // Lấy user kèm password hash
        const userResult = await pool.request()
            .input('id', sql.UniqueIdentifier, userId)
            .query('SELECT password_hash FROM [users] WHERE id = @id');
        
        const user = userResult.recordset[0];
        
        if (!user) {
            return res.status(404).json({ 
                error: 'Không tìm thấy người dùng' 
            });
        }

        // Kiểm tra mật khẩu hiện tại
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                error: 'Mật khẩu hiện tại không đúng' 
            });
        }

        // Kiểm tra mật khẩu mới không trùng mật khẩu cũ
        const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
        if (isSamePassword) {
            return res.status(400).json({ 
                error: 'Mật khẩu mới không được trùng với mật khẩu hiện tại' 
            });
        }

        // Hash mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Cập nhật mật khẩu
        await pool.request()
            .input('id', sql.UniqueIdentifier, userId)
            .input('password_hash', sql.NVarChar(255), hashedPassword)
            .query('UPDATE [users] SET password_hash = @password_hash WHERE id = @id');

        res.json({ 
            message: 'Đổi mật khẩu thành công' 
        });
    } catch (err) {
        console.error('Lỗi đổi mật khẩu:', err);
        res.status(500).json({ 
            error: 'Đã xảy ra lỗi máy chủ' 
        });
    }
};

/**
 * Quên mật khẩu
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const pool = await poolPromise;

        if (!email) {
            return res.status(400).json({ 
                error: 'Vui lòng nhập email' 
            });
        }

        const userResult = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT id, full_name FROM [users] WHERE email = @email');
        
        const user = userResult.recordset[0];
        
        // Luôn trả về thành công dù email có tồn tại hay không (bảo mật)
        if (!user) {
            console.log(`Yêu cầu reset password cho email không tồn tại: ${email}`);
            return res.json({ 
                message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn khôi phục mật khẩu' 
            });
        }

        const resetToken = generateToken();
        const expiresAt = new Date(Date.now() + 3600000); // 1 giờ

        // Đánh dấu các token cũ đã hết hạn
        await pool.request()
            .input('user_id', sql.UniqueIdentifier, user.id)
            .query(`
                UPDATE [password_resets] 
                SET used = 1 
                WHERE user_id = @user_id AND used = 0 AND expires_at < SYSDATETIMEOFFSET()
            `);

        // Lưu token mới
        await pool.request()
            .input('user_id', sql.UniqueIdentifier, user.id)
            .input('token', sql.NVarChar(255), resetToken)
            .input('expires_at', sql.DateTimeOffset, expiresAt)
            .query(`
                INSERT INTO [password_resets] (user_id, token, expires_at)
                VALUES (@user_id, @token, @expires_at)
            `);

        // Gửi email (không await để không block response)
        sendResetEmail(email, resetToken, user.full_name).catch(err => {
            console.error("Gửi email thất bại:", err.message);
        });

        res.json({ 
            message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn khôi phục mật khẩu' 
        });
    } catch (err) {
        console.error('Lỗi quên mật khẩu:', err);
        
        // Xử lý lỗi kiểu dữ liệu datetimeoffset
        if (err.number === 206 || err.message.includes('datetimeoffset')) {
            return res.status(500).json({ 
                error: 'Lỗi định dạng ngày tháng trong database' 
            });
        }
        
        res.status(500).json({ 
            error: 'Đã xảy ra lỗi máy chủ' 
        });
    }
};

/**
 * Đặt lại mật khẩu
 * POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;
        const pool = await poolPromise;

        if (!token || !newPassword || !confirmPassword) {
            return res.status(400).json({ 
                error: 'Vui lòng nhập đầy đủ thông tin' 
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ 
                error: 'Mật khẩu xác nhận không khớp' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                error: 'Mật khẩu phải có ít nhất 6 ký tự' 
            });
        }

        if (newPassword.length > 100) {
            return res.status(400).json({ 
                error: 'Mật khẩu không được vượt quá 100 ký tự' 
            });
        }

        // Tìm token hợp lệ
        const resetResult = await pool.request()
            .input('token', sql.NVarChar, token)
            .query(`
                SELECT pr.*, u.email, u.username, u.password_hash as old_password_hash
                FROM [password_resets] pr
                JOIN [users] u ON pr.user_id = u.id
                WHERE pr.token = @token 
                    AND pr.expires_at > SYSDATETIMEOFFSET() 
                    AND pr.used = 0
            `);
        
        const resetRecord = resetResult.recordset[0];
        
        if (!resetRecord) {
            return res.status(400).json({ 
                error: 'Token không hợp lệ hoặc đã hết hạn' 
            });
        }

        // Kiểm tra mật khẩu mới không trùng mật khẩu cũ
        const isSamePassword = await bcrypt.compare(newPassword, resetRecord.old_password_hash);
        if (isSamePassword) {
            return res.status(400).json({ 
                error: 'Mật khẩu mới không được trùng với mật khẩu cũ' 
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Sử dụng transaction để đảm bảo tính nhất quán
        const transaction = pool.transaction();
        await transaction.begin();
        
        try {
            // Cập nhật mật khẩu
            await transaction.request()
                .input('user_id', sql.UniqueIdentifier, resetRecord.user_id)
                .input('password_hash', sql.NVarChar(255), hashedPassword)
                .query('UPDATE [users] SET password_hash = @password_hash WHERE id = @user_id');

            // Đánh dấu token đã sử dụng
            await transaction.request()
                .input('id', sql.UniqueIdentifier, resetRecord.id)
                .query('UPDATE [password_resets] SET used = 1 WHERE id = @id');

            // Đánh dấu tất cả token khác của user này đã hết hạn
            await transaction.request()
                .input('user_id', sql.UniqueIdentifier, resetRecord.user_id)
                .input('current_id', sql.UniqueIdentifier, resetRecord.id)
                .query(`
                    UPDATE [password_resets] 
                    SET used = 1 
                    WHERE user_id = @user_id AND id != @current_id AND used = 0
                `);

            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }

        // Gửi email thông báo (không await)
        sendResetEmail(resetRecord.email, null, resetRecord.username, 'password_changed').catch(err => {
            console.error("Gửi email thông báo thất bại:", err.message);
        });

        res.json({ 
            message: 'Mật khẩu đã được cập nhật thành công' 
        });
    } catch (err) {
        console.error('Lỗi đặt lại mật khẩu:', err);
        res.status(500).json({ 
            error: 'Đã xảy ra lỗi máy chủ' 
        });
    }
};

/**
 * Kiểm tra token hợp lệ
 * GET /api/auth/verify-token
 */
exports.verifyToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ valid: false });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Kiểm tra user còn tồn tại và active không
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, decoded.id)
            .query('SELECT id, is_active, role FROM [users] WHERE id = @id');
        
        const user = result.recordset[0];
        
        if (!user || !user.is_active) {
            return res.status(401).json({ valid: false });
        }
        
        res.json({ 
            valid: true, 
            user: {
                id: user.id,
                role: user.role
            }
        });
    } catch (err) {
        res.status(401).json({ valid: false });
    }
};

/**
 * Refresh token
 * POST /api/auth/refresh-token
 */
exports.refreshToken = async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ error: 'Token không được cung cấp' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
        
        // Kiểm tra user còn tồn tại
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, decoded.id)
            .query('SELECT id, role, is_active FROM [users] WHERE id = @id');
        
        const user = result.recordset[0];
        
        if (!user || !user.is_active) {
            return res.status(401).json({ error: 'Người dùng không hợp lệ' });
        }
        
        // Tạo token mới
        const newToken = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        
        res.json({ token: newToken });
    } catch (err) {
        console.error('Lỗi refresh token:', err);
        res.status(401).json({ error: 'Token không hợp lệ' });
    }
};
// Thêm hàm này vào controllers/authController.js
exports.updateProfile = async (req, res) => {
    try {
        // Logic cập nhật profile của bạn ở đây
        res.status(200).json({ message: "Tính năng cập nhật profile đang được phát triển" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};