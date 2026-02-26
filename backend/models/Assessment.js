const { getConnection, sql } = require('../config/database');

class Assessment {
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
     * Lấy danh sách đánh giá của một trẻ
     * @param {string} childId
     * @returns {Promise<Array>}
     */
    static async findByChild(childId) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('child_id', sql.UniqueIdentifier, childId)
                .query(`
                    SELECT a.*, u.full_name as started_by_name
                    FROM assessments a
                    LEFT JOIN users u ON a.started_by = u.id
                    WHERE a.child_id = @child_id
                    ORDER BY a.started_at DESC
                `);
            
            // Tự động Parse JSON khi lấy dữ liệu ra
            return result.recordset.map(assessment => ({
                ...assessment,
                report_json: this.#parseJSON(assessment.report_json),
                adaptive_flow: this.#parseJSON(assessment.adaptive_flow)
            }));
        } catch (error) {
            console.error(`Lỗi Assessment.findByChild (${childId}):`, error.message);
            throw error;
        }
    }

    /**
     * Tìm đánh giá theo id
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    static async findById(id) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .query(`
                    SELECT a.*, c.full_name as child_name, c.birth_date,
                           u.full_name as started_by_name
                    FROM assessments a
                    JOIN children c ON a.child_id = c.id
                    LEFT JOIN users u ON a.started_by = u.id
                    WHERE a.id = @id
                `);
            
            const assessment = result.recordset[0];
            if (!assessment) return null;

            assessment.report_json = this.#parseJSON(assessment.report_json);
            assessment.adaptive_flow = this.#parseJSON(assessment.adaptive_flow);

            return assessment;
        } catch (error) {
            console.error(`Lỗi Assessment.findById (${id}):`, error.message);
            throw error;
        }
    }

    /**
     * Lấy tất cả đánh giá (admin)
     * @returns {Promise<Array>}
     */
    static async findAll() {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query(`
                    SELECT a.*, c.full_name as child_name, u.full_name as started_by_name
                    FROM assessments a
                    JOIN children c ON a.child_id = c.id
                    LEFT JOIN users u ON a.started_by = u.id
                    ORDER BY a.started_at DESC
                `);
            
            return result.recordset.map(assessment => ({
                ...assessment,
                report_json: this.#parseJSON(assessment.report_json),
                adaptive_flow: this.#parseJSON(assessment.adaptive_flow)
            }));
        } catch (error) {
            console.error('Lỗi Assessment.findAll:', error.message);
            throw error;
        }
    }

    /**
     * Tạo đánh giá mới
     * @param {Object} data
     * @returns {Promise<string>} ID của assessment
     */
    static async create(data) {
        try {
            const { child_id, started_by, status = 'in_progress', adaptive_flow } = data;
            const pool = await getConnection();
            
            // Xử lý object thành string trước khi lưu
            const flowString = typeof adaptive_flow === 'object' ? JSON.stringify(adaptive_flow) : adaptive_flow;

            const result = await pool.request()
                .input('child_id', sql.UniqueIdentifier, child_id)
                .input('started_by', sql.UniqueIdentifier, started_by)
                .input('status', sql.NVarChar(20), status)
                .input('adaptive_flow', sql.NVarChar(sql.MAX), flowString || null)
                .query(`
                    INSERT INTO assessments (id, child_id, started_by, status, adaptive_flow)
                    OUTPUT INSERTED.id
                    VALUES (NEWID(), @child_id, @started_by, @status, @adaptive_flow)
                `);
            
            return result.recordset[0].id;
        } catch (error) {
            console.error('Lỗi Assessment.create:', error.message);
            throw error;
        }
    }

    /**
     * Cập nhật đánh giá (Dynamic Update an toàn)
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

            if (data.completed_at !== undefined) {
                updates.push('completed_at = @completed_at');
                request.input('completed_at', sql.DateTimeOffset, data.completed_at);
            }
            if (data.status !== undefined) {
                updates.push('status = @status');
                request.input('status', sql.NVarChar(20), data.status);
            }
            if (data.overall_risk_score !== undefined) {
                updates.push('overall_risk_score = @overall_risk_score');
                request.input('overall_risk_score', sql.Decimal(5, 2), data.overall_risk_score);
            }
            if (data.risk_level !== undefined) {
                updates.push('risk_level = @risk_level');
                request.input('risk_level', sql.NVarChar(20), data.risk_level);
            }
            if (data.report_json !== undefined) {
                updates.push('report_json = @report_json');
                const reportString = typeof data.report_json === 'object' ? JSON.stringify(data.report_json) : data.report_json;
                request.input('report_json', sql.NVarChar(sql.MAX), reportString);
            }
            if (data.adaptive_flow !== undefined) {
                updates.push('adaptive_flow = @adaptive_flow');
                const flowString = typeof data.adaptive_flow === 'object' ? JSON.stringify(data.adaptive_flow) : data.adaptive_flow;
                request.input('adaptive_flow', sql.NVarChar(sql.MAX), flowString);
            }

            if (updates.length === 0) return true;

            const query = `
                UPDATE assessments
                SET ${updates.join(', ')}
                WHERE id = @id
            `;
            
            const result = await request.query(query);
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error(`Lỗi Assessment.update (${id}):`, error.message);
            throw error;
        }
    }

    /**
     * Lấy tất cả game sessions của assessment
     * @param {string} assessmentId
     * @returns {Promise<Array>}
     */
    static async getGameSessions(assessmentId) {
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
            
            // Xử lý parse JSON cho dữ liệu của game_sessions
            return result.recordset.map(session => ({
                ...session,
                raw_data_json: this.#parseJSON(session.raw_data_json),
                result_scores: this.#parseJSON(session.result_scores)
            }));
        } catch (error) {
            console.error(`Lỗi Assessment.getGameSessions (${assessmentId}):`, error.message);
            throw error;
        }
    }

    /**
     * Lấy thống kê đánh giá theo mức độ nguy cơ
     * @returns {Promise<Array>}
     */
    static async getRiskLevelStats() {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query(`
                    SELECT 
                        ISNULL(risk_level, N'Chưa xác định') as risk_level,
                        COUNT(*) as count
                    FROM assessments
                    GROUP BY risk_level
                `);
            return result.recordset;
        } catch (error) {
            console.error('Lỗi Assessment.getRiskLevelStats:', error.message);
            throw error;
        }
    }

    /**
     * Đếm tổng số đánh giá
     * @returns {Promise<number>}
     */
    static async count() {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query('SELECT COUNT(*) as total FROM assessments');
            return result.recordset[0].total;
        } catch (error) {
            console.error('Lỗi Assessment.count:', error.message);
            throw error;
        }
    }

    /**
     * Lấy đánh giá gần đây
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    static async getRecent(limit = 10) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('limit', sql.Int, limit)
                .query(`
                    SELECT TOP (@limit) 
                        a.*, 
                        c.full_name as child_name,
                        u.full_name as started_by_name
                    FROM assessments a
                    JOIN children c ON a.child_id = c.id
                    LEFT JOIN users u ON a.started_by = u.id
                    ORDER BY a.started_at DESC
                `);
            
            return result.recordset.map(assessment => ({
                ...assessment,
                report_json: this.#parseJSON(assessment.report_json),
                adaptive_flow: this.#parseJSON(assessment.adaptive_flow)
            }));
        } catch (error) {
            console.error('Lỗi Assessment.getRecent:', error.message);
            throw error;
        }
    }
}

module.exports = Assessment;