const nodemailer = require('nodemailer');

// Khởi tạo người đưa thư
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD
  }
});

// Hàm gửi email dùng chung
async function sendEmail(toEmail, subject, htmlContent) {
  try {
    const info = await transporter.sendMail({
      from: `"Hệ thống Quản lý Thiết bị" <${process.env.MAIL_USER}>`,
      to: toEmail,
      subject: subject,
      html: htmlContent
    });
    console.log('Email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Lỗi gửi email:', error);
    return false;
  }
}

// Mẫu Email Từ chối
async function sendRejectionEmail(studentEmail, studentName, requestCode, reason) {
  const subject = `[CLB] Thông báo từ chối đơn mượn thiết bị ${requestCode}`;
  const htmlContent = `
    <h3>Xin chào ${studentName},</h3>
    <p>Rất tiếc, đơn mượn thiết bị mã <b>${requestCode}</b> của bạn đã bị từ chối.</p>
    <p><b>Lý do:</b> ${reason}</p>
    <p>Vui lòng liên hệ Admin nếu bạn có thắc mắc.</p>
    <br><p>Trân trọng,</p>
  `;
  return sendEmail(studentEmail, subject, htmlContent);
}

// Mẫu Email Duyệt đơn
async function sendApprovalEmail(studentEmail, studentName, requestCode) {
  const subject = `[CLB] Đơn mượn thiết bị ${requestCode} đã được duyệt`;
  const htmlContent = `
    <h3>Xin chào ${studentName},</h3>
    <p>Đơn mượn thiết bị mã <b>${requestCode}</b> của bạn đã được duyệt thành công!</p>
    <p>Vui lòng đến phòng CLB để nhận thiết bị trong vòng <b>48 giờ</b> tới.</p>
    <p>Nếu bạn không đến nhận, hệ thống sẽ tự hủy đơn và trừ điểm uy tín của bạn.</p>
    <br><p>Trân trọng,</p>
  `;
  return sendEmail(studentEmail, subject, htmlContent);
}

module.exports = {
  sendRejectionEmail,
  sendApprovalEmail
};