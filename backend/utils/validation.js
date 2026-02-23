const { body, validationResult } = require('express-validator');

/**
 * Middleware xử lý kết quả validation
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Dữ liệu không hợp lệ',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

/**
 * Validation rules cho đăng ký
 */
const registerValidation = [
    body('username')
    .isLength({ min: 3, max: 50 }).withMessage('Username phải từ 3-50 ký tự')
    .matches(/^[\p{L}0-9_\s]+$/u)
    .withMessage('Username không chứa ký tự đặc biệt'),
    
    body('email')
        .isEmail().withMessage('Email không hợp lệ')
        .normalizeEmail(),
    
    body('password')
        .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Mật khẩu phải chứa ít nhất 1 chữ và 1 số'),
    
    body('phone')
        .optional()
        .matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/).withMessage('Số điện thoại không hợp lệ'),
    
    body('full_name')
        .notEmpty().withMessage('Họ tên không được để trống')
        .isLength({ max: 100 }).withMessage('Họ tên không được quá 100 ký tự'),
    
    body('role')
        .optional()
        .isIn(['parent', 'teacher', 'specialist', 'admin']).withMessage('Vai trò không hợp lệ'),
    
    handleValidationErrors
];

/**
 * Validation rules cho đăng nhập
 */
const loginValidation = [
    body('email')
        .isEmail().withMessage('Email không hợp lệ')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Mật khẩu không được để trống'),
    
    handleValidationErrors
];

/**
 * Validation rules cho quên mật khẩu
 */
const forgotPasswordValidation = [
    body('email')
        .isEmail().withMessage('Email không hợp lệ')
        .normalizeEmail(),
    
    handleValidationErrors
];

/**
 * Validation rules cho đặt lại mật khẩu
 */
const resetPasswordValidation = [
    body('token')
        .notEmpty().withMessage('Token không được để trống'),
    
    body('newPassword')
        .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Mật khẩu phải chứa ít nhất 1 chữ và 1 số'),
    
    handleValidationErrors
];

/**
 * Validation rules cho cập nhật profile
 */
const updateProfileValidation = [
    body('full_name')
        .optional()
        .isLength({ max: 100 }).withMessage('Họ tên không được quá 100 ký tự'),
    
    body('phone')
        .optional()
        .matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/).withMessage('Số điện thoại không hợp lệ'),
    
    handleValidationErrors
];

/**
 * Validation rules cho đổi mật khẩu
 */
const changePasswordValidation = [
    body('currentPassword')
        .notEmpty().withMessage('Mật khẩu hiện tại không được để trống'),
    
    body('newPassword')
        .isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Mật khẩu mới phải chứa ít nhất 1 chữ và 1 số')
        .custom((value, { req }) => {
            if (value === req.body.currentPassword) {
                throw new Error('Mật khẩu mới không được trùng với mật khẩu hiện tại');
            }
            return true;
        }),
    
    handleValidationErrors
];

/**
 * Validation rules cho tạo child
 */
const createChildValidation = [
    body('full_name')
        .notEmpty().withMessage('Tên trẻ không được để trống')
        .isLength({ max: 100 }).withMessage('Tên trẻ không được quá 100 ký tự'),
    
    body('birth_date')
        .isDate().withMessage('Ngày sinh không hợp lệ')
        .custom(value => {
            const birthDate = new Date(value);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age > 18) {
                throw new Error('Tuổi không phù hợp (tối đa 18 tuổi)');
            }
            return true;
        }),
    
    body('gender')
        .optional()
        .isIn(['male', 'female', 'other']).withMessage('Giới tính không hợp lệ'),
    
    body('primary_language')
        .optional()
        .isLength({ max: 50 }).withMessage('Ngôn ngữ không được quá 50 ký tự'),
    
    handleValidationErrors
];

/**
 * Hàm validation đơn giản (không dùng middleware)
 */
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePhone = (phone) => {
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    return phoneRegex.test(phone);
};

const validatePassword = (password) => {
    return password && password.length >= 6;
};

const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    return usernameRegex.test(username);
};

module.exports = {
    // Middleware validation
    registerValidation,
    loginValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    updateProfileValidation,
    changePasswordValidation,
    createChildValidation,
    handleValidationErrors,
    
    // Simple validation functions
    validateEmail,
    validatePhone,
    validatePassword,
    validateUsername
};