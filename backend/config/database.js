const sql = require('mssql');
require('dotenv').config();

// Cấu hình tối ưu cho SQL Server Express
const config = {
    // Thay vì dùng IP, ta dùng đường dẫn instance
    server: 'localhost\\SQLEXPRESS01', 
    database: 'ASD_Screening',
    user: 'sa',
    password: 'MatKhau@123456!',
    options: {
        encrypt: false,
        trustServerCertificate: true,
    }
};

let pool = null;

async function getConnection() {
    try {
        // Nếu đã có kết nối và vẫn đang mở thì dùng lại
        if (pool && pool.connected) {
            return pool;
        }
        
        console.log('🔄 Đang kết nối đến SQL Server (127.0.0.1:1433)...');
        
        pool = await sql.connect(config);
        
        console.log('✅ Kết nối SQL Server thành công!');
        return pool;
    } catch (err) {
        console.error('❌ Lỗi kết nối database:', err.message);
        
        // Giải thích lỗi phổ biến
        if (err.message.includes('Login failed')) {
            console.error('👉 Gợi ý: Kiểm tra lại User sa và Mật khẩu.');
        } else if (err.code === 'ETIMEOUT') {
            console.error('👉 Gợi ý: Kiểm tra xem SQL Server đã được Restart chưa.');
        }
        
        throw err;
    }
}

module.exports = {
    getConnection,
    sql
};