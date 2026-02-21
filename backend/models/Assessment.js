const { getConnection, sql } = require('../config/database');

class Assessment {
    /**
     * Lấy danh sách đánh giá của một trẻ
     * @param {string} childId
     * @returns {Promise<Array>}
     */
    static async findByChild(childId) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('child_id', sql.UniqueIdentifier, childId)
            .query(`
                SELECT id, started_at, completed_at, status, overall_risk_score,
                       risk_level, developmental_age_estimate, created_at
                FROM assessments
                WHERE child_id = @child_id
                ORDER BY started_at DESC
            `);
        return result.recordset;
    }

    /**
     * Tìm đánh giá theo id
     * @param {string} id
     * @returns {Promise<object|null>}
     */
    static async findById(id) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('SELECT * FROM assessments WHERE id = @id');
        return result.recordset[0] || null;
    }

    /**
     * Lấy tất cả đánh giá (admin)
     * @returns {Promise<Array>}
     */
    static async findAll() {
        const pool = await getConnection();
        const result = await pool.request()
            .query('SELECT * FROM assessments ORDER BY started_at DESC');
        return result.recordset;
    }

    /**
     * Tạo đánh giá mới
     * @param {Object} data
     * @returns {Promise<string>}
     */
    static async create(data) {
        const { child_id, started_by, status = 'in_progress' } = data;
        const pool = await getConnection();
        const result = await pool.request()
            .input('child_id', sql.UniqueIdentifier, child_id)
            .input('started_by', sql.UniqueIdentifier, started_by)
            .input('status', sql.NVarChar, status)
            .query(`
                INSERT INTO assessments (id, child_id, started_by, status)
                OUTPUT INSERTED.id
                VALUES (NEWID(), @child_id, @started_by, @status)
            `);
        return result.recordset[0].id;
    }

    /**
     * Cập nhật đánh giá
     * @param {string} id
     * @param {Object} data
     * @returns {Promise<boolean>}
     */
    static async update(id, data) {
        const { completed_at, status, overall_risk_score, risk_level, developmental_age_estimate, report_json } = data;
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .input('completed_at', sql.DateTimeOffset, completed_at)
            .input('status', sql.NVarChar, status)
            .input('overall_risk_score', sql.Decimal(5,2), overall_risk_score)
            .input('risk_level', sql.NVarChar, risk_level)
            .input('developmental_age_estimate', sql.Int, developmental_age_estimate)
            .input('report_json', sql.NVarChar, report_json)
            .query(`
                UPDATE assessments
                SET completed_at = @completed_at, status = @status,
                    overall_risk_score = @overall_risk_score, risk_level = @risk_level,
                    developmental_age_estimate = @developmental_age_estimate,
                    report_json = @report_json, updated_at = SYSDATETIMEOFFSET()
                WHERE id = @id
            `);
        return result.rowsAffected[0] > 0;
    }
}

module.exports = Assessment;