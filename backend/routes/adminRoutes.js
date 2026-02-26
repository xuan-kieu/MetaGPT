const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const adminController = require('../controllers/adminController');

// Tất cả routes đều yêu cầu xác thực và role admin
router.use(authenticateToken);
router.use(requireRole(['admin']));

// ===== User management =====
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// ===== Child management =====
router.get('/children', adminController.getAllChildren);
router.get('/children/:id', adminController.getChildById);
router.post('/children', adminController.createChild);
router.put('/children/:id', adminController.updateChild);
router.delete('/children/:id', adminController.deleteChild);

// ===== Norms management =====
router.get('/norms', adminController.getNorms);
router.get('/norms/:id', adminController.getNormById);
router.post('/norms', adminController.createNorm);
router.put('/norms/:id', adminController.updateNorm);
router.delete('/norms/:id', adminController.deleteNorm);

// ===== Games management =====
router.get('/games', adminController.getGames);
router.get('/games/:id', adminController.getGameById);
router.post('/games', adminController.createGame);
router.put('/games/:id', adminController.updateGame);
router.delete('/games/:id', adminController.deleteGame);

// ===== System stats =====
router.get('/stats', adminController.getSystemStats);

// ===== Skills and Age Groups (hỗ trợ cho Norms) =====
router.get('/skills', adminController.getSkills);
router.get('/age-groups', adminController.getAgeGroups);

module.exports = router;    