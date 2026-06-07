const emailTemplateService = require('../services/emailTemplate.service');

// Lấy danh sách các mẫu email
async function getTemplates(req, res) {
  try {
    const templates = await emailTemplateService.getAllTemplates();
    res.json({ message: 'Thành công', data: templates });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách mẫu email' });
  }
}

// Lấy mẫu của một email
async function getTemplateById(req, res) {
  try {
    const template = await emailTemplateService.getTemplateById(req.params.id);
    if (!template) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json({ message: 'Thành công', data: template });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy chi tiết mẫu email' });
  }
}

// Sửa mẫu email
async function updateTemplate(req, res) {
  try {
    const updatedTemplate = await emailTemplateService.updateTemplate(req.params.id, req.body, req.user.id);
    res.json({ message: 'Cập nhật mẫu thư thành công', data: updatedTemplate });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi cập nhật mẫu email' });
  }
}

module.exports = { getTemplates, getTemplateById, updateTemplate };