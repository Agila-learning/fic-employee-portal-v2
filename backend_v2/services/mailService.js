const nodemailer = require('nodemailer');

/**
 * Shared Email Helper
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {Array} attachments - Optional list of attachments objects ({ filename, path })
 */
const sendEmail = async (to, subject, text, attachments = []) => {
    try {
        console.log(`[MAIL-SERVICE] Attempting to send email to ${to}...`);
        
        // Use SMTP settings from environment variables
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_PORT == 465, 
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Verify connection before sending
        await transporter.verify();
        console.log('[MAIL-SERVICE] SMTP Connection verified successfully');

        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'FIC Admin'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
            to,
            subject,
            text,
            attachments
        });
        
        console.log(`[MAIL-SERVICE] Success: Message sent to ${to}. ID: ${info.messageId}`);
    } catch (error) {
        console.error('[MAIL-SERVICE] CRITICAL ERROR sending email:', error.message);
        console.error('[MAIL-SERVICE] Full Error Details:', error);
    }
};

module.exports = { sendEmail };
