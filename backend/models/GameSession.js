const { getConnection, sql } = require('../config/database');

class GameSession {
    /**
     * Helper nội bộ: Parse JSON an toàn
     */
    static #parseJSON(data) {
        if (!data) return null;
        try {
            return typeof data === 'string' ? JSON.parse(data) : data;
        } catch (e) {
            return data;
        }
    }

    /**
     * Lấy danh sách game sessions theo assessment
     * @param {string} assessmentId
     * @returns {Promise<Array>}
     */
    static async findByAssessment(assessmentId) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('assessment_id', sql.UniqueIdentifier, assessmentId)
                .query(`
                    SELECT gs.*, g.name as game_name, g.code as game_code
                    FROM game_sessions gs
                    JOIN games g ON gs.game_id = g.id
                    WHERE gs.assessment_id = @assessment_id
                    ORDER BY gs.sequence_order
                `);
            
            // Parse JSON cho toàn bộ danh sách
            return result.recordset.map(session => ({
                ...session,
                raw_data_json: this.#parseJSON(session.raw_data_json),
                result_scores: this.#parseJSON(session.result_scores)
            }));
        } catch (error) {
            console.error('Lỗi GameSession.findByAssessment:', error.message);
            throw error;
        }
    }

    /**
     * Tìm game session theo id
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    static async findById(id) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .query(`
                    SELECT gs.*, g.name as game_name
                    FROM game_sessions gs
                    JOIN games g ON gs.game_id = g.id
                    WHERE gs.id = @id
                `);
            
            const session = result.recordset[0];
            if (!session) return null;

            // Parse JSON để trả về Object thay vì chuỗi
            session.raw_data_json = this.#parseJSON(session.raw_data_json);
            session.result_scores = this.#parseJSON(session.result_scores);

            return session;
        } catch (error) {
            console.error(`Lỗi GameSession.findById (${id}):`, error.message);
            throw error;
        }
    }

    /**
     * Tạo game session mới
     * @param {Object} data
     * @returns {Promise<string>} ID của game session
     */
    static async create(data) {
        try {
            const { assessment_id, game_id, sequence_order, status = 'completed' } = data;
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('assessment_id', sql.UniqueIdentifier, assessment_id)
                .input('game_id', sql.Int, game_id)
                .input('sequence_order', sql.Int, sequence_order)
                .input('status', sql.NVarChar(20), status)
                .query(`
                    INSERT INTO game_sessions (id, assessment_id, game_id, sequence_order, status)
                    OUTPUT INSERTED.id
                    VALUES (NEWID(), @assessment_id, @game_id, @sequence_order, @status)
                `);
            
            return result.recordset[0].id;
        } catch (error) {
            console.error('Lỗi GameSession.create:', error.message);
            throw error;
        }
    }

    /**
     * Cập nhật game session (Sử dụng Dynamic Query)
     * @param {string} id
     * @param {Object} data
     * @returns {Promise<boolean>}
     */
    static async update(id, data) {
        try {
            const pool = await getConnection();
            const request = pool.request();
            request.input('id', sql.UniqueIdentifier, id);

            const updates = [];

            // Chỉ thêm vào câu lệnh SQL những trường có gửi dữ liệu lên (khác undefined)
            if (data.started_at !== undefined) {
                updates.push('started_at = @started_at');
                request.input('started_at', sql.DateTimeOffset, data.started_at);
            }
            if (data.ended_at !== undefined) {
                updates.push('ended_at = @ended_at');
                request.input('ended_at', sql.DateTimeOffset, data.ended_at);
            }
            if (data.status !== undefined) {
                updates.push('status = @status');
                request.input('status', sql.NVarChar(20), data.status);
            }
            if (data.raw_data_json !== undefined) {
                updates.push('raw_data_json = @raw_data_json');
                const rawData = typeof data.raw_data_json === 'object' ? JSON.stringify(data.raw_data_json) : data.raw_data_json;
                request.input('raw_data_json', sql.NVarChar(sql.MAX), rawData);
            }
            if (data.result_scores !== undefined) {
                updates.push('result_scores = @result_scores');
                const resultScores = typeof data.result_scores === 'object' ? JSON.stringify(data.result_scores) : data.result_scores;
                request.input('result_scores', sql.NVarChar(sql.MAX), resultScores);
            }

            // Nếu không có trường nào cần cập nhật thì bỏ qua
            if (updates.length === 0) return true;

            const query = `
                UPDATE game_sessions
                SET ${updates.join(', ')}
                WHERE id = @id
            `;

            const result = await request.query(query);
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error(`Lỗi GameSession.update (${id}):`, error.message);
            throw error;
        }
    }

    /**
     * Lấy metrics của game session
     * @param {string} gameSessionId
     * @returns {Promise<Array>}
     */
    static async getMetrics(gameSessionId) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('game_session_id', sql.UniqueIdentifier, gameSessionId)
                .query(`
                    SELECT * FROM game_session_metrics 
                    WHERE game_session_id = @game_session_id
                    ORDER BY captured_at
                `);
            return result.recordset;
        } catch (error) {
            console.error(`Lỗi GameSession.getMetrics (${gameSessionId}):`, error.message);
            throw error;
        }
    }

    /**
     * Thêm metric cho game session
     * @param {Object} data
     * @returns {Promise<string>} ID của metric
     */
    static async addMetric(data) {
        try {
            const { game_session_id, metric_key, metric_value, unit } = data;
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('game_session_id', sql.UniqueIdentifier, game_session_id)
                .input('metric_key', sql.NVarChar(50), metric_key)
                .input('metric_value', sql.Decimal(10, 3), metric_value)
                .input('unit', sql.NVarChar(20), unit || null)
                .query(`
                    INSERT INTO game_session_metrics (id, game_session_id, metric_key, metric_value, unit)
                    OUTPUT INSERTED.id
                    VALUES (NEWID(), @game_session_id, @metric_key, @metric_value, @unit)
                `);
            
            return result.recordset[0].id;
        } catch (error) {
            console.error('Lỗi GameSession.addMetric:', error.message);
            throw error;
        }
    }

    /**
     * Cập nhật kết quả game session
     * @param {string} id
     * @param {Object} resultScores
     * @returns {Promise<boolean>}
     */
    static async updateResults(id, resultScores) {
        try {
            const pool = await getConnection();
            // Đảm bảo dữ liệu được stringify trước khi lưu
            const scoresString = typeof resultScores === 'object' ? JSON.stringify(resultScores) : resultScores;
            
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .input('result_scores', sql.NVarChar(sql.MAX), scoresString)
                .query('UPDATE game_sessions SET result_scores = @result_scores WHERE id = @id');
            
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error(`Lỗi GameSession.updateResults (${id}):`, error.message);
            throw error;
        }
    }

    /**
     * Lấy tất cả media files của game session
     * @param {string} gameSessionId
     * @returns {Promise<Array>}
     */
    static async getMediaFiles(gameSessionId) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('game_session_id', sql.UniqueIdentifier, gameSessionId)
                .query(`
                    SELECT * FROM media_files 
                    WHERE game_session_id = @game_session_id
                    ORDER BY uploaded_at
                `);
            return result.recordset;
        } catch (error) {
            console.error(`Lỗi GameSession.getMediaFiles (${gameSessionId}):`, error.message);
            throw error;
        }
    }
}

module.exports = GameSession;