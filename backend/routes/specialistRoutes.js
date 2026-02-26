// routes/specialistRoutes.js
const express = require('express');
const router = express.Router();
const specialistController = require('../controllers/specialistController');
const { authenticateToken, authorizeSpecialist } = require('../middleware/authMiddleware');

// Tất cả routes đều yêu cầu xác thực và role specialist hoặc admin
router.use(authenticateToken);
router.use(authorizeSpecialist);

// Dashboard stats
router.get('/dashboard/stats', specialistController.getDashboardStats);

// Children management
router.get('/children', specialistController.getChildren);
router.get('/children/:childId', specialistController.getChildDetail);
router.get('/children/:childId/notes', specialistController.getChildNotes);
router.post('/children/:childId/notes', specialistController.createQuickNote);

// Assessments management
router.get('/assessments', specialistController.getAllAssessments);
router.get('/assessments/:assessmentId', specialistController.getAssessmentDetail);

module.exports = router;