const { getPool } = require('../config/database');

async function withDatabase(callback) {
    try {
        const pool = await getPool();
        return await callback(pool);
    } catch (error) {
        console.error('Lỗi database:', error);
        throw error;
    }
}

module.exports = { withDatabase };