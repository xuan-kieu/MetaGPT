const sql = require('mssql');
require('dotenv').config();

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: true, // Bật nếu dùng Azure SQL
        trustServerCertificate: true // Tắt kiểm tra chứng chỉ cho local dev
    }
};

let pool = null;

/**
 * Lấy kết nối pool (singleton)
 * @returns {Promise<sql.ConnectionPool>}
 */
async function getConnection() {
    try {
        if (pool) {
            console.log('Sử dụng lại kết nối pool hiện có');
            return pool;
        }
        pool = await sql.connect(config);
        console.log('Kết nối SQL Server thành công');
        return pool;
    } catch (err) {
        console.error('Lỗi kết nối database:', err);
        throw err;
    }
}

module.exports = {
    getConnection,
    sql
};