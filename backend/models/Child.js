const { getConnection, sql } = require('../config/database');

class Child {
    /**
     * Lấy danh sách trẻ mà chuyên gia được phép xem
     * @param {string} specialistId
     * @returns {Promise<Array>}
     */
    static async findBySpecialist(specialistId) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('specialist_id', sql.UniqueIdentifier, specialistId)
                .query(`
                    SELECT DISTINCT c.*, u.full_name as parent_name
                    FROM children c
                    LEFT JOIN child_guardians cg ON c.id = cg.child_id
                    LEFT JOIN users u ON c.parent_id = u.id
                    WHERE (cg.user_id = @specialist_id AND cg.relationship = 'specialist')
                       OR c.created_by = @specialist_id
                    ORDER BY c.created_at DESC
                `);
            return result.recordset;
        } catch (error) {
            console.error(`Lỗi Child.findBySpecialist (${specialistId}):`, error.message);
            throw error;
        }
    }

    /**
     * Kiểm tra xem chuyên gia có được phép truy cập trẻ không
     * @param {string} childId
     * @param {string} specialistId
     * @returns {Promise<boolean>}
     */
    static async isAssignedToSpecialist(childId, specialistId) {
        try {
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
        } catch (error) {
            console.error(`Lỗi Child.isAssignedToSpecialist (${childId}, ${specialistId}):`, error.message);
            throw error;
        }
    }

    /**
     * Tìm trẻ theo id
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    static async findById(id) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .query(`
                    SELECT c.*, u.full_name as parent_name
                    FROM children c
                    LEFT JOIN users u ON c.parent_id = u.id
                    WHERE c.id = @id
                `);
            return result.recordset[0] || null;
        } catch (error) {
            console.error(`Lỗi Child.findById (${id}):`, error.message);
            throw error;
        }
    }

    /**
     * Lấy tất cả trẻ (admin)
     * @returns {Promise<Array>}
     */
    static async findAll() {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query(`
                    SELECT c.*, u.full_name as parent_name
                    FROM children c
                    LEFT JOIN users u ON c.parent_id = u.id
                    ORDER BY c.created_at DESC
                `);
            return result.recordset;
        } catch (error) {
            console.error('Lỗi Child.findAll:', error.message);
            throw error;
        }
    }

    /**
     * Tạo trẻ mới
     * @param {Object} childData
     * @param {string} createdBy (userId)
     * @returns {Promise<string>}
     */
    static async create(childData, createdBy) {
        try {
            const { full_name, birth_date, gender, region, primary_language, notes, parent_id } = childData;
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('full_name', sql.NVarChar(100), full_name)
                .input('birth_date', sql.Date, birth_date)
                .input('gender', sql.NVarChar(10), gender || null)
                .input('region', sql.NVarChar(50), region || null)
                .input('primary_language', sql.NVarChar(50), primary_language || 'vi')
                .input('notes', sql.NVarChar(sql.MAX), notes || null)
                .input('parent_id', sql.UniqueIdentifier, parent_id || null)
                .input('created_by', sql.UniqueIdentifier, createdBy)
                .query(`
                    INSERT INTO children (id, full_name, birth_date, gender, region, primary_language, notes, parent_id, created_by)
                    OUTPUT INSERTED.id
                    VALUES (NEWID(), @full_name, @birth_date, @gender, @region, @primary_language, @notes, @parent_id, @created_by)
                `);
            
            return result.recordset[0].id;
        } catch (error) {
            console.error('Lỗi Child.create:', error.message);
            throw error;
        }
    }

    /**
     * Cập nhật thông tin trẻ (Sử dụng Dynamic Query an toàn)
     * @param {string} id
     * @param {Object} childData
     * @returns {Promise<boolean>}
     */
    static async update(id, childData) {
        try {
            const pool = await getConnection();
            const request = pool.request();
            request.input('id', sql.UniqueIdentifier, id);

            const updates = [];

            // Kiểm tra và chỉ thêm vào các trường được gửi lên
            if (childData.full_name !== undefined) {
                updates.push('full_name = @full_name');
                request.input('full_name', sql.NVarChar(100), childData.full_name);
            }
            if (childData.birth_date !== undefined) {
                updates.push('birth_date = @birth_date');
                request.input('birth_date', sql.Date, childData.birth_date);
            }
            if (childData.gender !== undefined) {
                updates.push('gender = @gender');
                request.input('gender', sql.NVarChar(10), childData.gender);
            }
            if (childData.region !== undefined) {
                updates.push('region = @region');
                request.input('region', sql.NVarChar(50), childData.region);
            }
            if (childData.primary_language !== undefined) {
                updates.push('primary_language = @primary_language');
                request.input('primary_language', sql.NVarChar(50), childData.primary_language);
            }
            if (childData.notes !== undefined) {
                updates.push('notes = @notes');
                request.input('notes', sql.NVarChar(sql.MAX), childData.notes);
            }
            if (childData.parent_id !== undefined) {
                updates.push('parent_id = @parent_id');
                request.input('parent_id', sql.UniqueIdentifier, childData.parent_id);
            }

            if (updates.length === 0) return true; // Không có dữ liệu nào cần cập nhật

            const query = `
                UPDATE children
                SET ${updates.join(', ')}
                WHERE id = @id
            `;
            
            const result = await request.query(query);
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error(`Lỗi Child.update (${id}):`, error.message);
            throw error;
        }
    }

    /**
     * Xóa trẻ
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    static async delete(id) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .query('DELETE FROM children WHERE id = @id');
            
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error(`Lỗi Child.delete (${id}):`, error.message);
            throw error;
        }
    }

    /**
     * Lấy danh sách guardians của trẻ
     * @param {string} childId
     * @returns {Promise<Array>}
     */
    static async getGuardians(childId) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('child_id', sql.UniqueIdentifier, childId)
                .query(`
                    SELECT u.*, cg.relationship, cg.is_primary, cg.professional_notes
                    FROM child_guardians cg
                    JOIN users u ON cg.user_id = u.id
                    WHERE cg.child_id = @child_id
                `);
            return result.recordset;
        } catch (error) {
            console.error(`Lỗi Child.getGuardians (${childId}):`, error.message);
            throw error;
        }
    }

    /**
     * Thêm guardian cho trẻ
     * @param {string} childId
     * @param {string} userId
     * @param {Object} data
     * @returns {Promise<boolean>}
     */
    static async addGuardian(childId, userId, data = {}) {
        try {
            const { relationship, is_primary = 0, professional_notes } = data;
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('child_id', sql.UniqueIdentifier, childId)
                .input('user_id', sql.UniqueIdentifier, userId)
                .input('relationship', sql.NVarChar(50), relationship || null)
                .input('is_primary', sql.Bit, is_primary)
                .input('professional_notes', sql.NVarChar(sql.MAX), professional_notes || null)
                .query(`
                    INSERT INTO child_guardians (child_id, user_id, relationship, is_primary, professional_notes)
                    VALUES (@child_id, @user_id, @relationship, @is_primary, @professional_notes)
                `);
            
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error(`Lỗi Child.addGuardian (${childId}, ${userId}):`, error.message);
            throw error;
        }
    }

    /**
     * Xóa guardian khỏi trẻ
     * @param {string} childId
     * @param {string} userId
     * @returns {Promise<boolean>}
     */
    static async removeGuardian(childId, userId) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('child_id', sql.UniqueIdentifier, childId)
                .input('user_id', sql.UniqueIdentifier, userId)
                .query('DELETE FROM child_guardians WHERE child_id = @child_id AND user_id = @user_id');
            
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error(`Lỗi Child.removeGuardian (${childId}, ${userId}):`, error.message);
            throw error;
        }
    }

    /**
     * Đếm tổng số trẻ
     * @returns {Promise<number>}
     */
    static async count() {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query('SELECT COUNT(*) as total FROM children');
            return result.recordset[0].total;
        } catch (error) {
            console.error('Lỗi Child.count:', error.message);
            throw error;
        }
    }
}

module.exports = Child;