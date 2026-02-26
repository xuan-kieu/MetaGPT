const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: 1433,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

let pool;

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✅ Kết nối database thành công');
        return pool;
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối database:', err);
        throw err;
    });

module.exports = {
    sql,
    poolPromise
};  