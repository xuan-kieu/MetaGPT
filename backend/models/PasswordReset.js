const { getConnection, sql } = require('../config/database');

class PasswordReset {
    /**
     * Tạo bản ghi reset password
     */
    static async create(userId, token, expiresAt) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('user_id', sql.UniqueIdentifier, userId)
            .input('token', sql.NVarChar(255), token)
            .input('expires_at', sql.DateTimeOffset, expiresAt)
            .query(`
                INSERT INTO password_resets (id, user_id, token, expires_at)
                OUTPUT INSERTED.id, INSERTED.user_id, INSERTED.token, INSERTED.expires_at, INSERTED.created_at
                VALUES (NEWID(), @user_id, @token, @expires_at)
            `);
        
        const newRecord = result.recordset[0];
        
        // Vô hiệu hóa các token cũ của user này
        await this.invalidateOldTokens(userId, newRecord.id);
        
        return newRecord;
    }

    /**
     * Vô hiệu hóa các token cũ còn hiệu lực
     */
    static async invalidateOldTokens(userId, excludeTokenId = null) {
        const pool = await getConnection();
        const request = pool.request()
            .input('user_id', sql.UniqueIdentifier, userId);
        
        let query = `
            UPDATE password_resets 
            SET used = 1, used_at = SYSDATETIMEOFFSET() 
            WHERE user_id = @user_id 
                AND used = 0 
                AND expires_at > SYSDATETIMEOFFSET()
        `;
        
        if (excludeTokenId) {
            query += ` AND id != @exclude_id`;
            request.input('exclude_id', sql.UniqueIdentifier, excludeTokenId);
        }
        
        const result = await request.query(query);
        return result.rowsAffected[0];
    }

    /**
     * Tìm token kèm thông tin User (Tối ưu hóa JOIN)
     */
    static async findValidTokenWithUser(token) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('token', sql.NVarChar(255), token)
            .query(`
                SELECT 
                    pr.id as reset_id,
                    pr.user_id,
                    pr.token,
                    pr.expires_at,
                    u.email,
                    u.full_name
                FROM password_resets pr WITH (NOLOCK)
                INNER JOIN users u WITH (NOLOCK) ON pr.user_id = u.id
                WHERE pr.token = @token 
                    AND pr.used = 0 
                    AND pr.expires_at > SYSDATETIMEOFFSET()
            `);
        return result.recordset[0] || null;
    }

    /**
     * Chống Spam: Kiểm tra yêu cầu gần đây
     */
    static async hasRecentRequest(userId, minutes = 5) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('user_id', sql.UniqueIdentifier, userId)
            .input('minutes', sql.Int, minutes)
            .query(`
                SELECT TOP 1 1
                FROM password_resets WITH (NOLOCK)
                WHERE user_id = @user_id
                    AND created_at > DATEADD(minute, -@minutes, SYSDATETIMEOFFSET())
            `);
        return result.recordset.length > 0;
    }
}

module.exports = PasswordReset;