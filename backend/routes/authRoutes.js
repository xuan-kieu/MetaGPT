const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');

// Validation rules
const loginValidation = [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').notEmpty().withMessage('Mật khẩu không được để trống')
];

const forgotPasswordValidation = [
    body('email').isEmail().withMessage('Email không hợp lệ')
];

const resetPasswordValidation = [
    body('token').notEmpty().withMessage('Token không được để trống'),
    body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự')
];

// Routes
router.post('/login', loginValidation, authController.login);
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

module.exports = router;