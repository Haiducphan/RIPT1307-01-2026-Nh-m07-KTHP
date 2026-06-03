const sequelize = require('./database');
const { DataTypes } = require('sequelize');

// Require tất cả các Model của hệ thống
const User = require('../models/user.model');
const Admin = require('../models/admin.model');
const Student = require('../models/student.model');
const Category = require('../models/category.model');
const Equipment = require('../models/equipment.model');
const EquipmentImage = require('../models/equipmentImages.model');
const BorrowRequest = require('../models/borrowRequest.model');
const TrustScoreLog = require('../models/trustScoreLog.model');
const AuditLog = require('../models/auditLog.model');
const EmailLog = require('../models/emailLog.model');
const EmailTemplate = require('../models/emailTemplate.model');
const Notification = require('../models/notification.model');
const SystemSetting = require('../models/systemSetting.model');

async function ensureAdminAvatarColumn() {
  const queryInterface = sequelize.getQueryInterface();
  const adminsTable = await queryInterface.describeTable('admins');

  if (!adminsTable.avatar_url) {
    await queryInterface.addColumn('admins', 'avatar_url', {
      type: DataTypes.STRING(500),
      allowNull: true
    });
    console.log('Đã bổ sung cột avatar_url cho bảng admins.');
  }
}

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Kết nối Database thành công!');
    
    await sequelize.sync(); 
    await ensureAdminAvatarColumn();
    console.log('Sync toàn bộ Database thành công!');

    // Khởi tạo cấu hình hệ thống mặc định
    const settingsCount = await SystemSetting.count();
    if (settingsCount === 0) {
      await SystemSetting.bulkCreate([
        { settingKey: 'pickup_deadline_hours', settingValue: '48', description: 'Số giờ sinh viên có để đến nhận đồ sau khi được duyệt' },
        { settingKey: 'late_penalty_per_day', settingValue: '3', description: 'Số điểm trừ mỗi ngày trả trễ' },
        { settingKey: 'noshow_penalty', settingValue: '10', description: 'Số điểm trừ khi không đến nhận đồ (tự bom)' },
        { settingKey: 'cancel_approved_penalty', settingValue: '3', description: 'Số điểm trừ khi huỷ sau khi đã duyệt' },
        { settingKey: 'minor_damage_penalty', settingValue: '10', description: 'Số điểm trừ khi làm hỏng nhẹ' },
        { settingKey: 'major_damage_penalty', settingValue: '30', description: 'Số điểm trừ khi làm mất hoặc hỏng nặng' },
        { settingKey: 'return_bonus', settingValue: '2', description: 'Số điểm cộng khi trả đúng hạn, đồ hoàn hảo' },
        { settingKey: 'streak_3_bonus', settingValue: '5', description: 'Số điểm thưởng khi đạt chuỗi tốt 3 lần' },
        { settingKey: 'streak_5_bonus', settingValue: '7', description: 'Số điểm thưởng khi đạt chuỗi tốt 5 lần' },
        { settingKey: 'lock_gold_to_silver_days', settingValue: '3', description: 'Số ngày khoá mượn khi tụt từ Vàng xuống Bạc' },
        { settingKey: 'lock_silver_to_bronze_days', settingValue: '7', description: 'Số ngày khoá mượn khi tụt từ Bạc xuống Đồng' },
        { settingKey: 'return_reminder_days', settingValue: '2', description: 'Nhắc trả trước bao nhiêu ngày' }
      ]);
      console.log('Đã tạo 12 dữ liệu System Settings mặc định!');
    }

  } catch (error) {
    console.error('Lỗi khi sync database:', error);
    throw error;
  }
}

module.exports = { syncDatabase };
