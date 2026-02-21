const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const specialistController = require('../controllers/specialistController');

// Tất cả routes đều yêu cầu xác thực và role specialist
router.use(authMiddleware);
router.use(requireRole(['specialist']));

// Danh sách trẻ của chuyên gia
router.get('/children', specialistController.getChildren);

// Chi tiết một trẻ
router.get('/children/:childId', specialistController.getChildDetail);

// Lịch sử đánh giá của trẻ
router.get('/children/:childId/assessments', specialistController.getChildAssessments);

// Xem báo cáo chi tiết của một đánh giá
router.get('/assessments/:assessmentId', specialistController.getAssessmentDetail);

// Ghi chú nhanh về trẻ
router.post('/children/:childId/notes', specialistController.createQuickNote);

module.exports = router;