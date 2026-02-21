const { getConnection, sql } = require('../config/database');

class GameSession {
    /**
     * Lấy danh sách game sessions theo assessment
     * @param {string} assessmentId
     * @returns {Promise<Array>}
     */
    static async findByAssessment(assessmentId) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('assessment_id', sql.UniqueIdentifier, assessmentId)
            .query(`
                SELECT * FROM game_sessions
                WHERE assessment_id = @assessment_id
                ORDER BY sequence_order
            `);
        return result.recordset;
    }

    /**
     * Tìm game session theo id
     * @param {string} id
     * @returns {Promise<object|null>}
     */
    static async findById(id) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('SELECT * FROM game_sessions WHERE id = @id');
        return result.recordset[0] || null;
    }

    /**
     * Tạo game session mới
     * @param {Object} data
     * @returns {Promise<string>}
     */
    static async create(data) {
        const { assessment_id, game_id, sequence_order, status = 'completed' } = data;
        const pool = await getConnection();
        const result = await pool.request()
            .input('assessment_id', sql.UniqueIdentifier, assessment_id)
            .input('game_id', sql.Int, game_id)
            .input('sequence_order', sql.Int, sequence_order)
            .input('status', sql.NVarChar, status)
            .query(`
                INSERT INTO game_sessions (id, assessment_id, game_id, sequence_order, status)
                OUTPUT INSERTED.id
                VALUES (NEWID(), @assessment_id, @game_id, @sequence_order, @status)
            `);
        return result.recordset[0].id;
    }

    /**
     * Cập nhật game session
     * @param {string} id
     * @param {Object} data
     * @returns {Promise<boolean>}
     */
    static async update(id, data) {
        const { started_at, ended_at, status, raw_data_json, result_scores } = data;
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .input('started_at', sql.DateTimeOffset, started_at)
            .input('ended_at', sql.DateTimeOffset, ended_at)
            .input('status', sql.NVarChar, status)
            .input('raw_data_json', sql.NVarChar, raw_data_json)
            .input('result_scores', sql.NVarChar, result_scores)
            .query(`
                UPDATE game_sessions
                SET started_at = @started_at, ended_at = @ended_at,
                    status = @status, raw_data_json = @raw_data_json,
                    result_scores = @result_scores, created_at = SYSDATETIMEOFFSET()
                WHERE id = @id
            `);
        return result.rowsAffected[0] > 0;
    }

    /**
     * Lấy metrics của game session
     * @param {string} gameSessionId
     * @returns {Promise<Array>}
     */
    static async getMetrics(gameSessionId) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('game_session_id', sql.UniqueIdentifier, gameSessionId)
            .query('SELECT * FROM game_session_metrics WHERE game_session_id = @game_session_id');
        return result.recordset;
    }

    /**
     * Thêm metric cho game session
     * @param {Object} data
     * @returns {Promise<string>}
     */
    static async addMetric(data) {
        const { game_session_id, metric_key, metric_value, unit } = data;
        const pool = await getConnection();
        const result = await pool.request()
            .input('game_session_id', sql.UniqueIdentifier, game_session_id)
            .input('metric_key', sql.NVarChar, metric_key)
            .input('metric_value', sql.Decimal(10,3), metric_value)
            .input('unit', sql.NVarChar, unit)
            .query(`
                INSERT INTO game_session_metrics (id, game_session_id, metric_key, metric_value, unit)
                OUTPUT INSERTED.id
                VALUES (NEWID(), @game_session_id, @metric_key, @metric_value, @unit)
            `);
        return result.recordset[0].id;
    }
}

module.exports = GameSession;