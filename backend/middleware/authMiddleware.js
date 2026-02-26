const jwt = require('jsonwebtoken');

/**
 * Middleware xác thực JWT
 * Kiểm tra token trong header Authorization, giải mã và gắn thông tin user vào req.user
 */
const authenticateToken = (req, res, next) => {
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
            role: decoded.role,
            email: decoded.email,
            full_name: decoded.full_name
        };
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token đã hết hạn' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token không hợp lệ' });
        }
        return res.status(401).json({ error: 'Lỗi xác thực token' });
    }
};

/**
 * Middleware phân quyền Admin
 * Kiểm tra user đã đăng nhập có role là admin hay không
 */
const authorizeAdmin = (req, res, next) => {
    // Kiểm tra req.user đã được gắn bởi authenticateToken chưa
    if (!req.user) {
        return res.status(401).json({ error: 'Chưa xác thực người dùng' });
    }
    
    // Kiểm tra role có phải admin không
    if (req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ error: 'Quyền truy cập bị từ chối. Bạn không phải Admin!' });
    }
};

/**
 * Middleware phân quyền Chuyên gia (Specialist)
 * ĐỒNG NHẤT: Sử dụng role 'specialist' thay vì 'expert'
 */
const authorizeSpecialist = (req, res, next) => {
    // Kiểm tra req.user đã được gắn bởi authenticateToken chưa
    if (!req.user) {
        return res.status(401).json({ error: 'Chưa xác thực người dùng' });
    }
    
    // Kiểm tra role có phải specialist hoặc admin không
    if (req.user.role === 'specialist' || req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ error: 'Quyền truy cập bị từ chối. Cần quyền Chuyên gia (Specialist)!' });
    }
};

/**
 * Middleware phân quyền Người dùng thông thường
 * Kiểm tra user đã đăng nhập (bất kỳ role nào cũng được)
 */
const authorizeUser = (req, res, next) => {
    // Kiểm tra req.user đã được gắn bởi authenticateToken chưa
    if (!req.user) {
        return res.status(401).json({ error: 'Chưa xác thực người dùng' });
    }
    
    // Tất cả user đã đăng nhập đều được phép
    next();
};

/**
 * Middleware kiểm tra quyền sở hữu tài nguyên
 * Ví dụ: User chỉ được sửa thông tin của chính mình
 * @param {Function} getResourceOwnerId - Hàm lấy ID của chủ sở hữu tài nguyên
 */
const authorizeOwner = (getResourceOwnerId) => {
    return async (req, res, next) => {
        try {
            // Kiểm tra req.user đã được gắn bởi authenticateToken chưa
            if (!req.user) {
                return res.status(401).json({ error: 'Chưa xác thực người dùng' });
            }

            // Admin có thể truy cập tất cả
            if (req.user.role === 'admin') {
                return next();
            }

            // Lấy ID của chủ sở hữu tài nguyên
            const ownerId = await getResourceOwnerId(req);
            
            // Kiểm tra quyền sở hữu
            if (req.user.id === ownerId) {
                next();
            } else {
                return res.status(403).json({ error: 'Bạn không có quyền truy cập tài nguyên này' });
            }
        } catch (err) {
            console.error('Lỗi kiểm tra quyền sở hữu:', err);
            return res.status(500).json({ error: 'Lỗi máy chủ khi kiểm tra quyền' });
        }
    };
};

/**
 * Middleware tùy chọn - có thể có hoặc không có token
 * Nếu có token thì giải mã và gắn req.user, nếu không thì vẫn next()
 */
const optionalAuthenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            role: decoded.role,
            email: decoded.email,
            full_name: decoded.full_name
        };
        next();
    } catch (err) {
        // Nếu token không hợp lệ, vẫn next() nhưng không có req.user
        next();
    }
};

// Xuất các hàm dưới dạng object
module.exports = {
    authenticateToken,
    authorizeAdmin,
    authorizeSpecialist, // Đã đổi từ authorizeExpert thành authorizeSpecialist
    authorizeUser,
    authorizeOwner,
    optionalAuthenticateToken
};