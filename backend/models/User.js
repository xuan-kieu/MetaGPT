const { getConnection, sql } = require('../config/database');

class User {
    static async findByEmail(email) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(`
                SELECT id, username, password_hash, email, phone, full_name, role, created_at
                FROM users WHERE email = @email
            `);
        return result.recordset[0] || null;
    }

    static async findById(id) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query(`
                SELECT id, username, email, phone, full_name, role, created_at
                FROM users WHERE id = @id
            `);
        return result.recordset[0] || null;
    }

    static async findAll() {
        const pool = await getConnection();
        const result = await pool.request()
            .query(`
                SELECT id, username, email, phone, full_name, role, created_at
                FROM users ORDER BY created_at DESC
            `);
        return result.recordset;
    }

    static async create(userData) {
        const { username, password_hash, email, phone, full_name, role } = userData;
        const pool = await getConnection();
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password_hash', sql.NVarChar, password_hash)
            .input('email', sql.NVarChar, email)
            .input('phone', sql.NVarChar, phone || null)
            .input('full_name', sql.NVarChar, full_name)
            .input('role', sql.NVarChar, role)
            .query(`
                INSERT INTO users (id, username, password_hash, email, phone, full_name, role)
                OUTPUT INSERTED.id
                VALUES (NEWID(), @username, @password_hash, @email, @phone, @full_name, @role)
            `);
        return result.recordset[0].id;
    }

    static async update(id, userData) {
        const { username, email, phone, full_name, role } = userData;
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .input('username', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .input('phone', sql.NVarChar, phone)
            .input('full_name', sql.NVarChar, full_name)
            .input('role', sql.NVarChar, role)
            .query(`
                UPDATE users
                SET username = @username, email = @email, phone = @phone,
                    full_name = @full_name, role = @role, updated_at = SYSDATETIMEOFFSET()
                WHERE id = @id
            `);
        return result.rowsAffected[0] > 0;
    }

    static async delete(id) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('DELETE FROM users WHERE id = @id');
        return result.rowsAffected[0] > 0;
    }

    static async findByUsername(username) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT id, username, email, phone, full_name, role, created_at
                FROM users WHERE username = @username
            `);
        return result.recordset[0] || null;
    }

    static async findByIdWithPassword(id) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query(`
                SELECT id, username, email, phone, full_name, role, password_hash, created_at
                FROM users WHERE id = @id
            `);
        return result.recordset[0] || null;
    }

    // Hàm phục vụ adminController.getSystemStats
    static async count() {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT COUNT(*) as total FROM users');
        return result.recordset[0].total;
    }
}

module.exports = User;