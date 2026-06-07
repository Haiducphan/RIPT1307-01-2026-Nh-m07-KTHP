const nodemailer = require('nodemailer');
const EmailTemplate = require('../models/emailTemplate.model');
const EmailLog = require('../models/emailLog.model'); // THÊM MỚI: Gọi model EmailLog

const DEFAULT_TEMPLATES = {
  forgot_password: {
    subject: 'Đặt lại mật khẩu BorrowIt',
    body: ''
  }
};

function getMailConfig() {
  const user = process.env.MAIL_USER || process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.MAIL_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const host = process.env.MAIL_HOST || process.env.SMTP_HOST;
  const port = Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 587);

  return { user, pass, host, port };
}

function createTransporter() {
  const { user, pass, host, port } = getMailConfig();
  const auth = { user, pass };

  if (host) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth
    });
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth
  });
}

const transporter = createTransporter();

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizePlaceholders(placeholders = {}) {
  const resetLink = placeholders.resetLink || placeholders.reset_link || '';
  const rawName = placeholders.name || placeholders.fullName || placeholders.full_name || 'bạn';
  const rawAppName = placeholders.appName || placeholders.app_name || 'Hệ thống Quản lý Thiết bị';
  const name = String(rawName).trim() || 'bạn';
  const appName = String(rawAppName).trim() || 'Hệ thống Quản lý Thiết bị';
  const year = placeholders.year || new Date().getFullYear();

  return {
    ...placeholders,
    resetLink,
    reset_link: resetLink,
    name,
    fullName: name,
    full_name: name,
    appName,
    app_name: appName,
    year
  };
}

// Hàm biên dịch giao diện
function compileTemplate(htmlBody, placeholders) {
  let compiled = htmlBody || '';
  const normalizedPlaceholders = normalizePlaceholders(placeholders);

  for (const key in normalizedPlaceholders) {
    const pattern = new RegExp(`{{\\s*${escapeRegExp(key)}\\s*}}`, 'g');
    compiled = compiled.replace(pattern, String(normalizedPlaceholders[key] ?? ''));
  }

  return compiled.replace(/{{\s*[^}]+\s*}}/g, '');
}

function buildForgotPasswordEmail(placeholders) {
  const normalizedPlaceholders = normalizePlaceholders(placeholders);
  const name = escapeHtml(normalizedPlaceholders.name);
  const resetLink = normalizedPlaceholders.resetLink;
  const safeResetLink = escapeHtml(resetLink);
  const appName = escapeHtml(normalizedPlaceholders.appName);
  const year = escapeHtml(normalizedPlaceholders.year);

  return {
    html: `
      <div style="margin:0;padding:0;background:#f4f7f5;font-family:Arial,'Segoe UI',sans-serif;color:#1f2933;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f4f7f5;margin:0;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4ebe5;">
                <tr>
                  <td style="padding:32px 32px 12px 32px;text-align:center;background:#2d4a3e;color:#ffffff;">
                    <div style="font-size:14px;letter-spacing:0;text-transform:uppercase;opacity:.82;">${appName}</div>
                    <h1 style="margin:12px 0 0 0;font-size:26px;line-height:1.3;font-weight:700;">Đặt lại mật khẩu</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">Xin chào ${name},</p>
                    <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;">Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản mượn thiết bị.</p>
                    <div style="text-align:center;margin:28px 0;">
                      <a href="${safeResetLink}" style="display:inline-block;background:#2d4a3e;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:10px;font-size:16px;font-weight:700;">Đặt lại mật khẩu</a>
                    </div>
                    <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#59636a;">Liên kết này sẽ hết hạn sau 15 phút.</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#59636a;">Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 32px;text-align:center;background:#f8faf8;color:#7b858c;font-size:12px;line-height:1.5;">
                    ${appName} &copy; ${year}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
    text: `Xin chào ${normalizedPlaceholders.name},\n\nBạn vừa yêu cầu đặt lại mật khẩu cho tài khoản mượn thiết bị.\nVui lòng mở email bằng ứng dụng hỗ trợ HTML và bấm nút Đặt lại mật khẩu.\n\nNếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email.\n\n${normalizedPlaceholders.appName}`
  };
}

// Hàm gửi email tự động
async function sendDynamicEmail(templateCode, toEmail, placeholders, userId = null, borrowRequestId = null) {
  let subject = '';
  let htmlContent = '';

  try {
    // Tìm mẫu thư trong DB theo code
    const dbTemplate = await EmailTemplate.findOne({ where: { code: templateCode, isActive: true } });
    const template = dbTemplate || DEFAULT_TEMPLATES[templateCode];

    if (!template) {
      console.error(`Không tìm thấy mẫu email có mã: ${templateCode}`);
      return false;
    }

    // Biên dịch tiêu đề và nội dung thư
    subject = compileTemplate(template.subject, placeholders);

    let textContent = '';
    if (templateCode === 'forgot_password') {
      const resetPasswordEmail = buildForgotPasswordEmail(placeholders);
      htmlContent = resetPasswordEmail.html;
      textContent = resetPasswordEmail.text;
    } else {
      htmlContent = compileTemplate(template.body, placeholders);
    }

    const mailConfig = getMailConfig();
    if (!mailConfig.user || !mailConfig.pass) {
      throw new Error('Thiếu cấu hình MAIL_USER/MAIL_PASSWORD hoặc SMTP_USER/SMTP_PASS để gửi email');
    }

    // Tiến hành gửi mail
    const info = await transporter.sendMail({
      from: `"Hệ thống Quản lý Thiết bị" <${mailConfig.user}>`,
      to: toEmail,
      subject: subject,
      html: htmlContent,
      text: textContent || undefined
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
