const nodemailer = require('nodemailer');
const EmailTemplate = require('../models/emailTemplate.model');
const EmailLog = require('../models/emailLog.model'); // THÊM MỚI: Gọi model EmailLog

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD
  }
});

// Hàm biên dịch giao diện
function compileTemplate(htmlBody, placeholders) {
  let compiled = htmlBody;
  for (const key in placeholders) {
    compiled = compiled.replace(new RegExp(`{{${key}}}`, 'g'), placeholders[key]);
  }
  return compiled;
}

// Hàm gửi email tự động
async function sendDynamicEmail(templateCode, toEmail, placeholders, userId = null, borrowRequestId = null) {
  let subject = '';
  let htmlContent = '';

  try {
    // Tìm mẫu thư trong DB theo code
    const template = await EmailTemplate.findOne({ where: { code: templateCode, isActive: true } });
    if (!template) {
      console.error(`Không tìm thấy mẫu email có mã: ${templateCode}`);
      return false;
    }

    // Biên dịch tiêu đề và nội dung thư
    subject = compileTemplate(template.subject, placeholders);
    htmlContent = compileTemplate(template.body, placeholders);

    // Tiến hành gửi mail
    const info = await transporter.sendMail({
      from: `"Hệ thống Quản lý Thiết bị" <${process.env.MAIL_USER}>`,
      to: toEmail,
      subject: subject,
      html: htmlContent
    });

    console.log(`[EMAIL] Đã gửi thư thành công tới ${toEmail}`);

    // Ghi Log thành công vào database
    await EmailLog.create({
      userId: userId,
      borrowRequestId: borrowRequestId,
      templateCode: templateCode,
      toEmail: toEmail,
      subject: subject,
      body: htmlContent,
      status: 'sent',
      sentAt: new Date()
    });

    return true;

  } catch (error) {
    console.error(`[EMAIL ERROR] Lỗi gửi mail tới ${toEmail}:`, error.message);

    // Ghi log thất bại vào DB để Admin kiểm tra
    try {
      await EmailLog.create({
        userId: userId,
        borrowRequestId: borrowRequestId,
        templateCode: templateCode,
        toEmail: toEmail,
        subject: subject || 'Lỗi biên dịch template',
        body: htmlContent || '',
        status: 'failed',
        errorMessage: error.message,
        sentAt: new Date()
      });
    } catch (logError) {
      console.error('[EMAIL LOG ERROR] Không thể ghi log thất bại:', logError.message);
    }

    return false;
  }
}

module.exports = { sendDynamicEmail };