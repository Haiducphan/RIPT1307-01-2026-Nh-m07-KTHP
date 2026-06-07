const SystemSetting = require('../models/systemSetting.model');
const auditLogService = require('./auditLog.service');

// Lấy toàn bộ cấu hình hệ thống
async function getAllSettings() {
  return await SystemSetting.findAll();
}

// Cập nhật một cấu hình cụ thể
async function updateSetting(settingKey, settingValue, adminId) {
  const setting = await SystemSetting.findByPk(settingKey);
  
  if (!setting) {
    throw { status: 404, message: `Không tìm thấy cấu hình với mã: ${settingKey}` };
  }

  const oldValue = setting.settingValue;
  
  await setting.update({ 
    settingValue: String(settingValue), 
    updatedBy: adminId 
  });

  // Ghi log hành động của Admin
  await auditLogService.logAdminAction({
    userId: adminId,
    action: 'update_system_setting',
    entityType: 'system_setting',
    entityId: null,
    oldValue: { settingKey: settingKey, settingValue: oldValue },
    newValue: { settingKey: settingKey, settingValue: String(settingValue) }
  });

  return setting;
}

module.exports = { 
  getAllSettings, 
  updateSetting 
};