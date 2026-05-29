const AuditLog = require('../models/auditLog.model');

// Lưu lịch sử hoạt động của Admin
async function logAdminAction({ userId, action, entityType, entityId, oldValue = null, newValue = null }, transaction = null) {
  try {
    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      oldValue,
      newValue
    }, { transaction });
  } catch (error) {
    console.error('[AUDIT LOG ERROR] Lỗi khi ghi log:', error.message);
  }
}

module.exports = { logAdminAction };