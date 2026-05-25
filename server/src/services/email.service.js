const nodemailer = require('nodemailer');
const EmailTemplate = require('../models/emailTemplate.model'); // Gọi model động

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
async function sendDynamicEmail(templateCode, toEmail, placeholders) {
  try {
    // Tìm mẫu thư trong DB theo code
    const template = await EmailTemplate.findOne({ where: { code: templateCode, isActive: true } });
    if (!template) {
      console.error(`Không tìm thấy mẫu email có mã: ${templateCode}`);
      return false;
    }

    // Biên dịch tiêu đề và nội dung thư
    const subject = compileTemplate(template.subject, placeholders);
    const htmlContent = compileTemplate(template.body, placeholders);

    // Tiến hành gửi mail
    const info = await transporter.sendMail({
      from: `"Hệ thống Quản lý Thiết bị" <${process.env.MAIL_USER}>`,
      to: toEmail,
      subject: subject,
      html: htmlContent
    });

    console.log(`[EMAIL] Đã gửi thư thành công: ${templateCode}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Thất bại khi gửi mẫu ${templateCode}:`, error.message);
    return false;
  }
}

module.exports = { sendDynamicEmail };