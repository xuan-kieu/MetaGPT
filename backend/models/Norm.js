const { getConnection, sql } = require('../config/database');

class Norm {
    /**
     * Lấy tất cả norms (Thêm NOLOCK để tối ưu đọc)
     */
    static async findAll() {
        const pool = await getConnection();
        const result = await pool.request()
            .query(`
                SELECT n.*, s.name as skill_name, s.code as skill_code, s.domain,
                       ag.name as age_group_name, ag.min_months, ag.max_months
                FROM norms n WITH (NOLOCK)
                JOIN skills s WITH (NOLOCK) ON n.skill_id = s.id
                JOIN age_groups ag WITH (NOLOCK) ON n.age_group_id = ag.id
                ORDER BY ag.min_months, s.domain, s.name
            `);
        return result.recordset;
    }

    /**
     * Tìm norm theo ID
     */
    static async findById(id) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT n.*, s.name as skill_name, ag.name as age_group_name
                FROM norms n WITH (NOLOCK)
                JOIN skills s WITH (NOLOCK) ON n.skill_id = s.id
                JOIN age_groups ag WITH (NOLOCK) ON n.age_group_id = ag.id
                WHERE n.id = @id
            `);
        return result.recordset[0] || null;
    }

    /**
     * Tạo norm mới
     */
    static async create(data) {
        const { skill_id, age_group_id, mean, std_dev, sample_size } = data;
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('skill_id', sql.Int, skill_id)
            .input('age_group_id', sql.Int, age_group_id)
            .input('mean', sql.Decimal(6, 3), mean)
            .input('std_dev', sql.Decimal(6, 3), std_dev)
            .input('sample_size', sql.Int, sample_size || null)
            .query(`
                INSERT INTO norms (skill_id, age_group_id, mean, std_dev, sample_size)
                OUTPUT INSERTED.id
                VALUES (@skill_id, @age_group_id, @mean, @std_dev, @sample_size)
            `);
        
        return result.recordset[0].id;
    }

    /**
     * Tìm nhanh theo Skill và AgeGroup (Dùng cho kiểm tra trùng lặp)
     */
    static async findBySkillAndAgeGroup(skillId, ageGroupId) {
        const pool = await getConnection();
        const result = await pool.request()
            .input('skill_id', sql.Int, skillId)
            .input('age_group_id', sql.Int, ageGroupId)
            .query(`
                SELECT TOP 1 id, mean, std_dev 
                FROM norms WITH (NOLOCK)
                WHERE skill_id = @skill_id AND age_group_id = @age_group_id
            `);
        return result.recordset[0] || null;
    }
}

module.exports = Norm;