const nodemailer = require('nodemailer');
require('dotenv').config();

// Tạo transporter với cấu hình chuẩn cho Outlook
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

/**
 * Gửi email reset password
 * @param {string} to - Địa chỉ email người nhận
 * @param {string} token - Token reset password
 * @returns {Promise}
 */
const sendResetEmail = async (to, token) => {
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
        from: `"ASD-SCREEN AI" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Khôi phục mật khẩu - ASD-SCREEN AI',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4f46e5;">Khôi phục mật khẩu</h2>
                <p>Bạn đã yêu cầu khôi phục mật khẩu cho tài khoản ASD-SCREEN AI.</p>
                <p>Vui lòng click vào nút bên dưới để đặt lại mật khẩu. Link có hiệu lực trong 1 giờ.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" 
                       style="background-color: #4f46e5; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Đặt lại mật khẩu
                    </a>
                </div>
                <p>Hoặc copy link sau vào trình duyệt:</p>
                <p style="background-color: #f3f4f6; padding: 10px; word-break: break-all;">
                    ${resetLink}
                </p>
                <p>Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.</p>
                <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #6b7280; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

/**
 * Gửi email thông báo chung
 * @param {Object} options - { to, subject, html }
 * @returns {Promise}
 */
const sendEmail = async (options) => {
    const mailOptions = {
        from: `"ASD-SCREEN AI" <${process.env.EMAIL_USER}>`,
        ...options
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

/**
 * Kiểm tra kết nối email
 * @returns {Promise<boolean>}
 */
const verifyConnection = async () => {
    try {
        await transporter.verify();
        console.log('Email service is ready');
        return true;
    } catch (error) {
        console.error('Email service error:', error);
        return false;
    }
};

module.exports = {
    sendResetEmail,
    sendEmail,
    verifyConnection
};