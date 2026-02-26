const { getConnection, sql } = require('../config/database');

class Game {
    /**
     * Lấy tất cả games
     * @returns {Promise<Array>}
     */
    static async findAll() {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query(`
                    SELECT * FROM games 
                    ORDER BY min_age_months, name
                `);
            return result.recordset;
        } catch (error) {
            console.error('Lỗi Game.findAll:', error.message);
            throw error;
        }
    }

    /**
     * Tìm game theo ID
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    static async findById(id) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT * FROM games WHERE id = @id');
            return result.recordset[0] || null;
        } catch (error) {
            console.error(`Lỗi Game.findById (${id}):`, error.message);
            throw error;
        }
    }

    /**
     * Tìm game theo code
     * @param {string} code
     * @returns {Promise<Object|null>}
     */
    static async findByCode(code) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('code', sql.NVarChar(20), code)
                .query('SELECT * FROM games WHERE code = @code');
            return result.recordset[0] || null;
        } catch (error) {
            console.error(`Lỗi Game.findByCode (${code}):`, error.message);
            throw error;
        }
    }

    /**
     * Tạo game mới
     * @param {Object} data
     * @returns {Promise<number>} ID của game mới
     */
    static async create(data) {
        try {
            // Gán null mặc định cho các trường nếu bị thiếu
            const { 
                code, name, description = null, instructions = null, 
                min_age_months, max_age_months, 
                target_duration_seconds = null, media_url = null, is_gateway = 0 
            } = data;
            
            const pool = await getConnection();
            const result = await pool.request()
                .input('code', sql.NVarChar(20), code)
                .input('name', sql.NVarChar(100), name)
                .input('description', sql.NVarChar(sql.MAX), description)
                .input('instructions', sql.NVarChar(sql.MAX), instructions)
                .input('min_age_months', sql.Int, min_age_months)
                .input('max_age_months', sql.Int, max_age_months)
                .input('target_duration_seconds', sql.Int, target_duration_seconds)
                .input('media_url', sql.NVarChar(sql.MAX), media_url)
                .input('is_gateway', sql.Bit, is_gateway)
                .query(`
                    INSERT INTO games (code, name, description, instructions, min_age_months,
                                       max_age_months, target_duration_seconds, media_url, is_gateway)
                    OUTPUT INSERTED.id
                    VALUES (@code, @name, @description, @instructions, @min_age_months,
                            @max_age_months, @target_duration_seconds, @media_url, @is_gateway)
                `);
            
            return result.recordset[0].id;
        } catch (error) {
            console.error('Lỗi Game.create:', error.message);
            throw error;
        }
    }

    /**
     * Cập nhật game (Sử dụng Dynamic Query an toàn)
     * @param {number} id
     * @param {Object} data
     * @returns {Promise<boolean>}
     */
    static async update(id, data) {
        try {
            const pool = await getConnection();
            const request = pool.request();
            request.input('id', sql.Int, id);

            const updates = [];

            // Kiểm tra từng trường, nếu có gửi lên thì mới đưa vào câu UPDATE
            if (data.code !== undefined) {
                updates.push('code = @code');
                request.input('code', sql.NVarChar(20), data.code);
            }
            if (data.name !== undefined) {
                updates.push('name = @name');
                request.input('name', sql.NVarChar(100), data.name);
            }
            if (data.description !== undefined) {
                updates.push('description = @description');
                request.input('description', sql.NVarChar(sql.MAX), data.description);
            }
            if (data.instructions !== undefined) {
                updates.push('instructions = @instructions');
                request.input('instructions', sql.NVarChar(sql.MAX), data.instructions);
            }
            if (data.min_age_months !== undefined) {
                updates.push('min_age_months = @min_age_months');
                request.input('min_age_months', sql.Int, data.min_age_months);
            }
            if (data.max_age_months !== undefined) {
                updates.push('max_age_months = @max_age_months');
                request.input('max_age_months', sql.Int, data.max_age_months);
            }
            if (data.target_duration_seconds !== undefined) {
                updates.push('target_duration_seconds = @target_duration_seconds');
                request.input('target_duration_seconds', sql.Int, data.target_duration_seconds);
            }
            if (data.media_url !== undefined) {
                updates.push('media_url = @media_url');
                request.input('media_url', sql.NVarChar(sql.MAX), data.media_url);
            }
            if (data.is_gateway !== undefined) {
                updates.push('is_gateway = @is_gateway');
                request.input('is_gateway', sql.Bit, data.is_gateway);
            }

            if (updates.length === 0) return true; // Không có gì để cập nhật

            const query = `
                UPDATE games
                SET ${updates.join(', ')}
                WHERE id = @id
            `;

            const result = await request.query(query);
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error(`Lỗi Game.update (${id}):`, error.message);
            throw error;
        }
    }

    /**
     * Xóa game
     * @param {number} id
     * @returns {Promise<boolean>}
     */
    static async delete(id) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query('DELETE FROM games WHERE id = @id');
            
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error(`Lỗi Game.delete (${id}):`, error.message);
            throw error;
        }
    }

    /**
     * Lấy danh sách kỹ năng của game
     * @param {number} gameId
     * @returns {Promise<Array>}
     */
    static async getSkills(gameId) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('game_id', sql.Int, gameId)
                .query(`
                    SELECT s.*, gs.weight, gs.skill_type
                    FROM game_skills gs
                    JOIN skills s ON gs.skill_id = s.id
                    WHERE gs.game_id = @game_id
                `);
            return result.recordset;
        } catch (error) {
            console.error(`Lỗi Game.getSkills (${gameId}):`, error.message);
            throw error;
        }
    }

    /**
     * Thêm kỹ năng cho game
     * @param {number} gameId
     * @param {number} skillId
     * @param {Object} data
     * @returns {Promise<boolean>}
     */
    static async addSkill(gameId, skillId, data = {}) {
        try {
            const { weight = 1.0, skill_type = 'primary' } = data;
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('game_id', sql.Int, gameId)
                .input('skill_id', sql.Int, skillId)
                .input('weight', sql.Decimal(3, 2), weight)
                .input('skill_type', sql.NVarChar(10), skill_type)
                .query(`
                    INSERT INTO game_skills (game_id, skill_id, weight, skill_type)
                    VALUES (@game_id, @skill_id, @weight, @skill_type)
                `);
            
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error(`Lỗi Game.addSkill (${gameId}, ${skillId}):`, error.message);
            throw error;
        }
    }

    /**
     * Xóa kỹ năng khỏi game
     * @param {number} gameId
     * @param {number} skillId
     * @returns {Promise<boolean>}
     */
    static async removeSkill(gameId, skillId) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('game_id', sql.Int, gameId)
                .input('skill_id', sql.Int, skillId)
                .query('DELETE FROM game_skills WHERE game_id = @game_id AND skill_id = @skill_id');
            
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error(`Lỗi Game.removeSkill (${gameId}, ${skillId}):`, error.message);
            throw error;
        }
    }

    /**
     * Tìm games phù hợp với độ tuổi
     * @param {number} ageMonths
     * @returns {Promise<Array>}
     */
    static async findByAge(ageMonths) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('age_months', sql.Int, ageMonths)
                .query(`
                    SELECT * FROM games
                    WHERE min_age_months <= @age_months 
                         AND max_age_months >= @age_months
                    ORDER BY min_age_months
                `);
            return result.recordset;
        } catch (error) {
            console.error(`Lỗi Game.findByAge (${ageMonths}):`, error.message);
            throw error;
        }
    }
}

module.exports = Game;