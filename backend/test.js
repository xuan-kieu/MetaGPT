const { getConnection } = require('./config/database');

async function test() {
    try {
        const pool = await getConnection();
        console.log('✅ Test kết nối thành công!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Test thất bại:', err);
        process.exit(1);
    }
}

test();