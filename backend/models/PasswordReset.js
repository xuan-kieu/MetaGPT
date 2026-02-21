const { getConnection, sql } = require('../config/database');

class PasswordReset {
    /**
     * Tạo bản ghi reset password
     * @param {string} userId
     * @param {string} token
     * @param {Date} expiresAt
     * @returns {Promise<string>} id của bản ghi
     */
    static async create(userId, token, expiresAt) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('user_id', sql.UniqueIdentifier, userId)
            .input('token', sql.NVarChar, token)
            .input('expires_at', sql.DateTimeOffset, expiresAt)
            .query(`
                INSERT INTO password_resets (id, user_id, token, expires_at)
                OUTPUT INSERTED.id
                VALUES (NEWID(), @user_id, @token, @expires_at)
            `);
        return result.recordset[0].id;
    }

    /**
     * Tìm token còn hiệu lực (chưa dùng, chưa hết hạn)
     * @param {string} token
     * @returns {Promise<object|null>}
     */
    static async findValidToken(token) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('token', sql.NVarChar, token)
            .query(`
                SELECT id, user_id, expires_at
                FROM password_resets
                WHERE token = @token AND used = 0 AND expires_at > SYSDATETIMEOFFSET()
            `);
        return result.recordset[0] || null;
    }

    /**
     * Đánh dấu token đã được sử dụng
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    static async markAsUsed(id) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('UPDATE password_resets SET used = 1 WHERE id = @id');
        return result.rowsAffected[0] > 0;
    }

    /**
     * Xóa tất cả token cũ của user (dùng khi reset thành công)
     * @param {string} userId
     */
    static async deleteByUser(userId) {
        const pool = await getConnection();
        await pool.request()
            .input('user_id', sql.UniqueIdentifier, userId)
            .query('DELETE FROM password_resets WHERE user_id = @user_id');
    }
}

module.exports = PasswordReset;