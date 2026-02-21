const { getConnection, sql } = require('../config/database');

class Child {
    /**
     * Lấy danh sách trẻ mà chuyên gia được phép xem
     * @param {string} specialistId
     * @returns {Promise<Array>}
     */
    static async findBySpecialist(specialistId) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('specialist_id', sql.UniqueIdentifier, specialistId)
            .query(`
                SELECT DISTINCT c.*
                FROM children c
                LEFT JOIN child_guardians cg ON c.id = cg.child_id
                WHERE cg.user_id = @specialist_id AND cg.relationship = 'specialist'
                   OR c.created_by = @specialist_id
                ORDER BY c.created_at DESC
            `);
        return result.recordset;
    }

    /**
     * Kiểm tra xem chuyên gia có được phép truy cập trẻ không
     * @param {string} childId
     * @param {string} specialistId
     * @returns {Promise<boolean>}
     */
    static async isAssignedToSpecialist(childId, specialistId) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('child_id', sql.UniqueIdentifier, childId)
            .input('specialist_id', sql.UniqueIdentifier, specialistId)
            .query(`
                SELECT 1
                FROM children c
                LEFT JOIN child_guardians cg ON c.id = cg.child_id
                WHERE c.id = @child_id
                  AND (cg.user_id = @specialist_id OR c.created_by = @specialist_id)
            `);
        return result.recordset.length > 0;
    }

    /**
     * Tìm trẻ theo id
     * @param {string} id
     * @returns {Promise<object|null>}
     */
    static async findById(id) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('SELECT * FROM children WHERE id = @id');
        return result.recordset[0] || null;
    }

    /**
     * Lấy tất cả trẻ (admin)
     * @returns {Promise<Array>}
     */
    static async findAll() {
        const pool = await getConnection();
        const result = await pool.request()
            .query('SELECT * FROM children ORDER BY created_at DESC');
        return result.recordset;
    }

    /**
     * Tạo trẻ mới
     * @param {Object} childData
     * @param {string} createdBy (userId)
     * @returns {Promise<string>}
     */
    static async create(childData, createdBy) {
        const { full_name, birth_date, gender, region, primary_language, notes, parent_id } = childData;
        const pool = await getConnection();
        const result = await pool.request()
            .input('full_name', sql.NVarChar, full_name)
            .input('birth_date', sql.Date, birth_date)
            .input('gender', sql.NVarChar, gender)
            .input('region', sql.NVarChar, region || null)
            .input('primary_language', sql.NVarChar, primary_language || 'vi')
            .input('notes', sql.NVarChar, notes || null)
            .input('parent_id', sql.UniqueIdentifier, parent_id || null)
            .input('created_by', sql.UniqueIdentifier, createdBy)
            .query(`
                INSERT INTO children (id, full_name, birth_date, gender, region, primary_language, notes, parent_id, created_by)
                OUTPUT INSERTED.id
                VALUES (NEWID(), @full_name, @birth_date, @gender, @region, @primary_language, @notes, @parent_id, @created_by)
            `);
        return result.recordset[0].id;
    }

    /**
     * Cập nhật thông tin trẻ
     * @param {string} id
     * @param {Object} childData
     * @returns {Promise<boolean>}
     */
    static async update(id, childData) {
        const { full_name, birth_date, gender, region, primary_language, notes, parent_id } = childData;
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .input('full_name', sql.NVarChar, full_name)
            .input('birth_date', sql.Date, birth_date)
            .input('gender', sql.NVarChar, gender)
            .input('region', sql.NVarChar, region)
            .input('primary_language', sql.NVarChar, primary_language)
            .input('notes', sql.NVarChar, notes)
            .input('parent_id', sql.UniqueIdentifier, parent_id)
            .query(`
                UPDATE children
                SET full_name = @full_name, birth_date = @birth_date, gender = @gender,
                    region = @region, primary_language = @primary_language, notes = @notes,
                    parent_id = @parent_id, updated_at = SYSDATETIMEOFFSET()
                WHERE id = @id
            `);
        return result.rowsAffected[0] > 0;
    }

    /**
     * Xóa trẻ
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    static async delete(id) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('DELETE FROM children WHERE id = @id');
        return result.rowsAffected[0] > 0;
    }
}

module.exports = Child;