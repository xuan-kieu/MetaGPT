const Child = require('../models/Child');
const Assessment = require('../models/Assessment');

/**
 * Lấy danh sách trẻ của chuyên gia
 * GET /api/specialist/children
 */
exports.getChildren = async (req, res) => {
    try {
        const specialistId = req.user.id;
        const children = await Child.findBySpecialist(specialistId);
        res.json(children);
    } catch (err) {
        console.error('Lỗi lấy danh sách trẻ:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Lấy chi tiết một trẻ (kèm lịch sử đánh giá)
 * GET /api/specialist/children/:childId
 */
exports.getChildDetail = async (req, res) => {
    try {
        const { childId } = req.params;
        const specialistId = req.user.id;

        // Kiểm tra quyền truy cập: chuyên gia có được xem trẻ này không?
        const hasAccess = await Child.isAssignedToSpecialist(childId, specialistId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Bạn không có quyền xem thông tin trẻ này' });
        }

        // Lấy thông tin trẻ
        const child = await Child.findById(childId);
        if (!child) {
            return res.status(404).json({ error: 'Không tìm thấy trẻ' });
        }

        // Lấy lịch sử đánh giá của trẻ
        const assessments = await Assessment.findByChild(childId);

        res.json({ child, assessments });
    } catch (err) {
        console.error('Lỗi lấy chi tiết trẻ:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};