const nodemailer = require('nodemailer');
const sequelize = require('../config/database');
const EmailLog = require('../models/emailLog.models');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

function fillTemplate(body, variables) {
  return Object.entries(variables).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, value ?? ''),
    body
  );
}

async function getTemplate(templateCode) {
  const [rows] = await sequelize.query(
    'SELECT subject, body FROM email_templates WHERE code = ? AND is_active = 1 LIMIT 1',
    { replacements: [templateCode] }
  );
  return rows[0] || null;
}

async function sendEmail({ userId, borrowRequestId, templateCode, toEmail, variables = {} }) {
  const template = await getTemplate(templateCode);
  if (!template) {
    console.error(`Template not found: ${templateCode}`);
    return;
  }

  const subject = fillTemplate(template.subject, variables);
  const body = fillTemplate(template.body, variables);

  let status = 'sent';
  try {
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: toEmail,
      subject,
      text: body
    });
  } catch (err) {
    console.error('Send email error:', err.message);
    status = 'failed';
  }

  await EmailLog.create({
    userId,
    borrowRequestId,
    templateCode,
    toEmail,
    subject,
    status,
    sentAt: status === 'sent' ? new Date() : null
  });
}

module.exports = { sendEmail };