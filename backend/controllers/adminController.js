const User = require('../models/User');
const Child = require('../models/Child');
const Norm = require('../models/Norm');
const Game = require('../models/Game');
const Assessment = require('../models/Assessment');
const bcrypt = require('bcrypt');

/**
 * Lấy tất cả người dùng
 * GET /api/admin/users
 */
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (err) {
        console.error('Lỗi lấy danh sách users:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Tạo người dùng mới
 * POST /api/admin/users
 */
exports.createUser = async (req, res) => {
    try {
        const { username, email, phone, full_name, role, password } = req.body;

        // Kiểm tra email đã tồn tại chưa
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email đã được sử dụng' });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user
        const userId = await User.create({
            username,
            email,
            phone,
            full_name,
            role,
            password_hash: hashedPassword
        });

        res.status(201).json({ id: userId, message: 'Tạo người dùng thành công' });
    } catch (err) {
        console.error('Lỗi tạo user:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Cập nhật người dùng
 * PUT /api/admin/users/:id
 */
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, phone, full_name, role } = req.body;

        // Kiểm tra user tồn tại
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }

        await User.update(id, { username, email, phone, full_name, role });
        res.json({ message: 'Cập nhật thành công' });
    } catch (err) {
        console.error('Lỗi cập nhật user:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Xóa người dùng
 * DELETE /api/admin/users/:id
 */
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.delete(id);
        res.json({ message: 'Xóa thành công' });
    } catch (err) {
        console.error('Lỗi xóa user:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Lấy tất cả trẻ
 * GET /api/admin/children
 */
exports.getAllChildren = async (req, res) => {
    try {
        const children = await Child.findAll();
        res.json(children);
    } catch (err) {
        console.error('Lỗi lấy danh sách trẻ:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Tạo trẻ mới
 * POST /api/admin/children
 */
exports.createChild = async (req, res) => {
    try {
        const childData = req.body;
        const childId = await Child.create(childData);
        res.status(201).json({ id: childId, message: 'Tạo trẻ thành công' });
    } catch (err) {
        console.error('Lỗi tạo trẻ:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Cập nhật thông tin trẻ
 * PUT /api/admin/children/:id
 */
exports.updateChild = async (req, res) => {
    try {
        const { id } = req.params;
        await Child.update(id, req.body);
        res.json({ message: 'Cập nhật thành công' });
    } catch (err) {
        console.error('Lỗi cập nhật trẻ:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Xóa trẻ
 * DELETE /api/admin/children/:id
 */
exports.deleteChild = async (req, res) => {
    try {
        const { id } = req.params;
        await Child.delete(id);
        res.json({ message: 'Xóa thành công' });
    } catch (err) {
        console.error('Lỗi xóa trẻ:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Lấy tất cả norms
 * GET /api/admin/norms
 */
exports.getAllNorms = async (req, res) => {
    try {
        const norms = await Norm.findAll();
        res.json(norms);
    } catch (err) {
        console.error('Lỗi lấy norms:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Tạo norm mới
 * POST /api/admin/norms
 */
exports.createNorm = async (req, res) => {
    try {
        const normId = await Norm.create(req.body);
        res.status(201).json({ id: normId, message: 'Tạo norm thành công' });
    } catch (err) {
        console.error('Lỗi tạo norm:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Cập nhật norm
 * PUT /api/admin/norms/:id
 */
exports.updateNorm = async (req, res) => {
    try {
        const { id } = req.params;
        await Norm.update(id, req.body);
        res.json({ message: 'Cập nhật thành công' });
    } catch (err) {
        console.error('Lỗi cập nhật norm:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Xóa norm
 * DELETE /api/admin/norms/:id
 */
exports.deleteNorm = async (req, res) => {
    try {
        const { id } = req.params;
        await Norm.delete(id);
        res.json({ message: 'Xóa thành công' });
    } catch (err) {
        console.error('Lỗi xóa norm:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Lấy tất cả games
 * GET /api/admin/games
 */
exports.getAllGames = async (req, res) => {
    try {
        const games = await Game.findAll();
        res.json(games);
    } catch (err) {
        console.error('Lỗi lấy games:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Tạo game mới
 * POST /api/admin/games
 */
exports.createGame = async (req, res) => {
    try {
        const gameId = await Game.create(req.body);
        res.status(201).json({ id: gameId, message: 'Tạo game thành công' });
    } catch (err) {
        console.error('Lỗi tạo game:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Cập nhật game
 * PUT /api/admin/games/:id
 */
exports.updateGame = async (req, res) => {
    try {
        const { id } = req.params;
        await Game.update(id, req.body);
        res.json({ message: 'Cập nhật thành công' });
    } catch (err) {
        console.error('Lỗi cập nhật game:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Xóa game
 * DELETE /api/admin/games/:id
 */
exports.deleteGame = async (req, res) => {
    try {
        const { id } = req.params;
        await Game.delete(id);
        res.json({ message: 'Xóa thành công' });
    } catch (err) {
        console.error('Lỗi xóa game:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Lấy thống kê hệ thống
 * GET /api/admin/stats
 */
exports.getSystemStats = async (req, res) => {
    try {
        // Lấy số lượng users, children, assessments
        const totalUsers = await User.count();
        const totalChildren = await Child.count();
        const totalAssessments = await Assessment.count();

        // Lấy phân bố mức độ nguy cơ
        const assessmentsByRisk = await Assessment.groupByRisk();

        // Lấy hoạt động gần đây (ví dụ 10 hoạt động mới nhất)
        const recentActivities = await Assessment.getRecentActivities(10);

        res.json({
            total_users: totalUsers,
            total_children: totalChildren,
            total_assessments: totalAssessments,
            assessments_by_risk: assessmentsByRisk,
            recent_activities: recentActivities
        });
    } catch (err) {
        console.error('Lỗi lấy thống kê:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};