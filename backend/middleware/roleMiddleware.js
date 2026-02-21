/**
 * Middleware kiểm tra quyền (role)
 * @param {string[]} allowedRoles - Mảng các role được phép truy cập
 * @returns {Function} Middleware
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        // Kiểm tra đã có thông tin user từ authMiddleware chưa
        if (!req.user) {
            return res.status(401).json({ error: 'Chưa xác thực người dùng' });
        }

        // Kiểm tra role của user có nằm trong danh sách được phép không
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Bạn không có quyền truy cập tài nguyên này' });
        }

        next();
    };
};

module.exports = {
    requireRole
};