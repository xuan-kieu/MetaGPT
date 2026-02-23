const Child = require('../models/Child');
const Assessment = require('../models/Assessment');
//const Note = require('../models/Note'); // Giả sử có model Note

/**
 * Lấy danh sách trẻ của chuyên gia
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
 * Lấy chi tiết một trẻ
 */
exports.getChildDetail = async (req, res) => {
    try {
        const { childId } = req.params;
        const specialistId = req.user.id;

        const hasAccess = await Child.isAssignedToSpecialist(childId, specialistId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Bạn không có quyền xem thông tin trẻ này' });
        }

        const child = await Child.findById(childId);
        if (!child) {
            return res.status(404).json({ error: 'Không tìm thấy trẻ' });
        }

        const assessments = await Assessment.findByChild(childId);
        res.json({ child, assessments });
    } catch (err) {
        console.error('Lỗi lấy chi tiết trẻ:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Lấy lịch sử đánh giá của trẻ
 * GET /api/specialist/children/:childId/assessments
 */
exports.getChildAssessments = async (req, res) => {
    try {
        const { childId } = req.params;
        const specialistId = req.user.id;

        // Kiểm tra quyền
        const hasAccess = await Child.isAssignedToSpecialist(childId, specialistId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Bạn không có quyền xem thông tin này' });
        }

        const assessments = await Assessment.findByChild(childId);
        res.json(assessments);
    } catch (err) {
        console.error('Lỗi lấy lịch sử đánh giá:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Xem báo cáo chi tiết của một đánh giá
 * GET /api/specialist/assessments/:assessmentId
 */
exports.getAssessmentDetail = async (req, res) => {
    try {
        const { assessmentId } = req.params;
        const specialistId = req.user.id;

        // Lấy chi tiết assessment kèm kiểm tra quyền
        const assessment = await Assessment.findById(assessmentId);
        if (!assessment) {
            return res.status(404).json({ error: 'Không tìm thấy đánh giá' });
        }

        // Kiểm tra xem chuyên gia có quyền xem assessment này không
        const hasAccess = await Child.isAssignedToSpecialist(assessment.childId, specialistId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Bạn không có quyền xem đánh giá này' });
        }

        res.json(assessment);
    } catch (err) {
        console.error('Lỗi lấy chi tiết đánh giá:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};

/**
 * Ghi chú nhanh về trẻ
 * POST /api/specialist/children/:childId/notes
 */
exports.createQuickNote = async (req, res) => {
    try {
        const { childId } = req.params;
        const { content, noteType } = req.body;
        const specialistId = req.user.id;

        // Kiểm tra quyền
        const hasAccess = await Child.isAssignedToSpecialist(childId, specialistId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Bạn không có quyền ghi chú về trẻ này' });
        }

        if (!content) {
            return res.status(400).json({ error: 'Nội dung ghi chú không được để trống' });
        }

        // Tạo ghi chú (giả sử có model Note)
        /*const note = await Note.create({
            childId,
            specialistId,
            content,
            noteType: noteType || 'general',
            createdAt: new Date()
        });
        */
        res.status(201).json(note);
    } catch (err) {
        console.error('Lỗi tạo ghi chú:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ' });
    }
};