const handleDatabaseError = (err, res) => {
    if (err.message.includes('kết nối đến database')) {
        return res.status(503).json({ 
            error: 'Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau.' 
        });
    }
    
    if (err.code === 'ETIMEOUT' || err.code === 'ECONNRESET') {
        return res.status(504).json({ 
            error: 'Kết nối đến cơ sở dữ liệu bị timeout. Vui lòng thử lại.' 
        });
    }
    
    return res.status(500).json({ 
        error: 'Đã xảy ra lỗi máy chủ' 
    });
};

module.exports = { handleDatabaseError };