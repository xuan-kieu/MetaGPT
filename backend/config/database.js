const sql = require('mssql');
require('dotenv').config();

    const config = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: process.env.DB_SERVER,
        database: process.env.DB_NAME,
        port: 1433,
        options: {
            encrypt: true,                 // BẮT BUỘC với AWS
            trustServerCertificate: true
        }
    };

let pool = null;

async function getConnection() {
    try {
        if (pool && pool.connected) {
            return pool;
        }

        console.log('🔄 Đang kết nối đến AWS RDS SQL Server...');

        pool = await sql.connect(config);

        console.log('✅ Kết nối AWS SQL Server thành công!');
        return pool;

    } catch (err) {
        console.error('❌ Lỗi kết nối database:', err.message);
        throw err;
    }
}

module.exports = { getConnection, sql };