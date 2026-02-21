const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { sendResetEmail } = require('../utils/emailService');
const { generateToken } = require('../utils/tokenGenerator');

/**
 * Đăng nhập
 * POST /api/auth/login
 * Body: { email, password }
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kiểm tra email có tồn tại không
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
        }

        // Kiểm tra mật khẩu
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
        }

        // Tạo JWT token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Trả về token và thông tin cơ bản của user (không gửi password)
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Lỗi đăng nhập:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Quên mật khẩu - Gửi email reset
 * POST /api/auth/forgot-password
 * Body: { email }
 */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Tìm user theo email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({ error: 'Email không tồn tại trong hệ thống' });
        }

        // Tạo token reset
        const resetToken = generateToken();
        const expiresAt = new Date(Date.now() + 3600000); // 1 giờ

        // Lưu token vào database
        await PasswordReset.create(user.id, resetToken, expiresAt);

        // Gửi email
        await sendResetEmail(email, resetToken);

        res.json({ message: 'Email khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.' });
    } catch (err) {
        console.error('Lỗi quên mật khẩu:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Đặt lại mật khẩu
 * POST /api/auth/reset-password
 * Body: { token, newPassword }
 */
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Kiểm tra token có hợp lệ và chưa hết hạn không
        const resetRecord = await PasswordReset.findValidToken(token);
        if (!resetRecord) {
            return res.status(400).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
        }

        // Mã hóa mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Cập nhật mật khẩu cho user
        await User.updatePassword(resetRecord.user_id, hashedPassword);

        // Đánh dấu token đã sử dụng
        await PasswordReset.markAsUsed(resetRecord.id);

        res.json({ message: 'Mật khẩu đã được cập nhật thành công' });
    } catch (err) {
        console.error('Lỗi đặt lại mật khẩu:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};