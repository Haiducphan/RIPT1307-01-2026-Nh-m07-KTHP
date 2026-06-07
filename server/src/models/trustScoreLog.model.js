const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('./student.model');
const Admin = require('./admin.model');
const BorrowRequest = require('./borrowRequest.model');

const TrustScoreLog = sequelize.define('TrustScoreLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  borrowRequestId: { type: DataTypes.INTEGER },
  delta: { type: DataTypes.INTEGER, allowNull: false },
  scoreBefore: { type: DataTypes.INTEGER, allowNull: false },
  scoreAfter: { type: DataTypes.INTEGER, allowNull: false },
  rankBefore: { type: DataTypes.ENUM('diamond', 'gold', 'silver', 'bronze', 'pebble'), allowNull: false },
  rankAfter: { type: DataTypes.ENUM('diamond', 'gold', 'silver', 'bronze', 'pebble'), allowNull: false },
  reason: {
    type: DataTypes.ENUM(
      'initial', 'return_ontime', 'streak_3', 'streak_5', 
      'admin_manual_add', 'cancel_approved', 'noshow', 
      'late_return', 'minor_damage', 'major_damage', 'admin_manual_deduct'
    ),
    allowNull: false
  },
  note: { type: DataTypes.STRING(500) },
  createdBy: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'trust_score_logs',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Thiết lập quan hệ
TrustScoreLog.belongsTo(Student, { foreignKey: 'studentId' });
TrustScoreLog.belongsTo(Admin, { foreignKey: 'createdBy', as: 'admin' });
TrustScoreLog.belongsTo(BorrowRequest, { foreignKey: 'borrowRequestId' });

module.exports = TrustScoreLog;