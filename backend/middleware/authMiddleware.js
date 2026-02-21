const jwt = require('jsonwebtoken');

/**
 * Middleware xác thực JWT
 * Kiểm tra token trong header Authorization, giải mã và gắn thông tin user vào req.user
 */
module.exports = (req, res, next) => {
    // Lấy token từ header Authorization (dạng "Bearer <token>")
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Không tìm thấy token xác thực' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    try {
        // Xác thực token với secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Gắn thông tin user vào request để các middleware/controller sau sử dụng
        req.user = {
            id: decoded.id,
            role: decoded.role
        };
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token đã hết hạn' });
        }
        return res.status(401).json({ error: 'Token không hợp lệ' });
    }
};