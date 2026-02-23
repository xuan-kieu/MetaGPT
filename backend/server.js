require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getConnection } = require('./config/database');
const { verifyConnection } = require('./utils/emailService');

// Import routes
const authRoutes = require('./routes/authRoutes');
const specialistRoutes = require('./routes/specialistRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
    origin: [
      'http://localhost:5173',
      'https://meta-gpt-psi.vercel.app'
    ],
    credentials: true
  }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/specialist', specialistRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint không tồn tại' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Lỗi server:', err);
    res.status(500).json({ 
        error: 'Đã có lỗi xảy ra',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Khởi động server và kiểm tra kết nối
const startServer = async () => {
    try {
        // Kiểm tra kết nối database
        await getConnection();
        console.log('✅ Kết nối database thành công');

        // TẠM TẮT EMAIL VERIFY
        // const emailOk = await verifyConnection();
        console.log("⏭ Bỏ qua kiểm tra email khi khởi động");

        // Khởi động server
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server đang chạy tại port ${PORT}`);
            console.log(`📝 Môi trường: ${process.env.NODE_ENV}`);
            console.log(`🔗 Client URL: ${process.env.CLIENT_URL}`);
        });
    } catch (error) {
        console.error('❌ Không thể khởi động server:', error);
        process.exit(1);
    }
};
startServer();