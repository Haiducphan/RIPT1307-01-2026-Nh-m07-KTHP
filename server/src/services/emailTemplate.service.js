const EmailTemplate = require('../models/emailTemplate.model');
const auditLogService = require('./auditLog.service');

// Lấy danh sách tất cả các mẫu email
async function getAllTemplates() {
  return await EmailTemplate.findAll();
}

// Lấy chi tiết 1 mẫu
async function getTemplateById(id) {
  return await EmailTemplate.findByPk(id);
}

// Cập nhật nội dung mẫu email (Admin sửa lỗi chính tả, thay đổi câu chữ)
async function updateTemplate(id, updateData, adminId) {
  const template = await EmailTemplate.findByPk(id);
  if (!template) throw { status: 404, message: 'Không tìm thấy mẫu email' };

  const oldData = { subject: template.subject, body: template.body };

  await template.update({
    subject: updateData.subject !== undefined ? updateData.subject : template.subject,
    body: updateData.body !== undefined ? updateData.body : template.body,
    updatedBy: adminId
  });

  // Ghi log hành động của Admin
  await auditLogService.logAdminAction({
    userId: adminId,
    action: 'update_email_template',
    entityType: 'email_template',
    entityId: template.id,
    oldValue: oldData,
    newValue: { subject: template.subject, body: template.body }
  });

  return template;
}

module.exports = { getAllTemplates, getTemplateById, updateTemplate };