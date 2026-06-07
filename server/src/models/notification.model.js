const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.models');
const BorrowRequest = require('./borrowRequest.model');

const Notification = sequelize.define('Notification', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  userId: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  borrowRequestId: { 
    type: DataTypes.INTEGER 
  },
  type: {
    type: DataTypes.ENUM(
      'request_approved', 'request_rejected', 'pickup_reminder', 
      'return_reminder', 'overdue_warning', 'trust_point_added', 
      'trust_point_deducted', 'streak_bonus', 'account_locked', 
      'tier_changed', 'new_request', 'system_announcement'
    ),
    allowNull: false
  },
  title: { 
    type: DataTypes.STRING(255), 
    allowNull: false 
  },
  message: { 
    type: DataTypes.TEXT, 
    allowNull: false 
  },
  isRead: { 
    type: DataTypes.BOOLEAN, 
    allowNull: false, 
    defaultValue: false 
  },
  readAt: { 
    type: DataTypes.DATE 
  }
}, {
  tableName: 'notifications',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Thiết lập mối quan hệ
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
Notification.belongsTo(BorrowRequest, { foreignKey: 'borrowRequestId', as: 'borrowRequest' });

module.exports = Notification;