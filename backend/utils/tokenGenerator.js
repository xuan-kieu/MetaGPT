const crypto = require('crypto');

/**
 * Tạo token ngẫu nhiên cho reset password
 * @param {number} length - Độ dài token (mặc định 32 bytes -> 64 ký tự hex)
 * @returns {string}
 */
const generateToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

/**
 * Tạo token có thể đọc được (dễ dán)
 * @param {number} length - Độ dài
 * @returns {string}
 */
const generateReadableToken = (length = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
        token += chars[Math.floor(Math.random() * chars.length)];
    }
    return token;
};

/**
 * Tạo JWT secret ngẫu nhiên (dùng cho cấu hình)
 * @returns {string}
 */
const generateJWTSecret = () => {
    return crypto.randomBytes(64).toString('hex');
};

module.exports = {
    generateToken,
    generateReadableToken,
    generateJWTSecret
};