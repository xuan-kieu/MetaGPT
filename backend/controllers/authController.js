const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { sendResetEmail } = require('../utils/emailService');
const { generateToken } = require('../utils/tokenGenerator');

/**
 * Đăng ký tài khoản mới
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
    try {
        const { username, email, password, phone, full_name, role } = req.body;

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
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ 
                error: 'Email đã được sử dụng',
                field: 'email'
            });
        }

        // Kiểm tra username đã tồn tại chưa
        const existingUsername = await User.findByUsername(username);
        if (existingUsername) {
            return res.status(400).json({ 
                error: 'Tên đăng nhập đã tồn tại',
                field: 'username'
            });
        }

        // Hash mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user mới
        const userId = await User.create({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            phone: phone || null,
            full_name: full_name.trim(),
            password_hash: hashedPassword,
            role: role || 'parent'
        });

        // Tạo JWT token
        const token = jwt.sign(
            { id: userId, role: role || 'parent' },
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
                role: role || 'parent'
            }
        });
    } catch (err) {
        console.error('Lỗi đăng ký:', err);
        res.status(500).json({ 
            error: 'Đã xảy ra lỗi máy chủ',
            message: err.message
        });
    }
};

/**
 * Đăng nhập
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Vui lòng nhập email và mật khẩu' 
            });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ 
                error: 'Email hoặc mật khẩu không đúng' 
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                error: 'Email hoặc mật khẩu không đúng' 
            });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
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
 */
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
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
 */
exports.logout = async (req, res) => {
    try {
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
 */
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user.id;

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

        // Lấy user kèm password hash
        const user = await User.findByIdWithPassword(userId);
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

        // Hash mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Cập nhật mật khẩu
        await User.updatePassword(userId, hashedPassword);

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
 */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                error: 'Vui lòng nhập email' 
            });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({ 
                error: 'Email không tồn tại trong hệ thống' 
            });
        }

        const resetToken = generateToken();
        const expiresAt = new Date(Date.now() + 3600000); // 1 giờ

        await PasswordReset.create(user.id, resetToken, expiresAt);
        await sendResetEmail(email, resetToken);

        res.json({ 
            message: 'Email khôi phục mật khẩu đã được gửi' 
        });
    } catch (err) {
        console.error('Lỗi quên mật khẩu:', err);
        res.status(500).json({ 
            error: 'Đã xảy ra lỗi máy chủ' 
        });
    }
};

/**
 * Đặt lại mật khẩu
 */
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;

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

        const resetRecord = await PasswordReset.findValidToken(token);
        if (!resetRecord) {
            return res.status(400).json({ 
                error: 'Token không hợp lệ hoặc đã hết hạn' 
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updatePassword(resetRecord.user_id, hashedPassword);
        await PasswordReset.markAsUsed(resetRecord.id);

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