const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model');
const BorrowRequest = require('./borrowRequest.model');

const EmailLog = sequelize.define('EmailLog', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  userId: { 
    type: DataTypes.INTEGER 
  },
  borrowRequestId: { 
    type: DataTypes.INTEGER 
  },
  templateCode: { 
    type: DataTypes.STRING(100) 
  },
  toEmail: { 
    type: DataTypes.STRING(255), 
    allowNull: false 
  },
  subject: { 
    type: DataTypes.STRING(255), 
    allowNull: false 
  },
  body: { 
    type: DataTypes.TEXT 
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  errorMessage: { 
    type: DataTypes.TEXT 
  },
  sentAt: { 
    type: DataTypes.DATE 
  }
}, {
  tableName: 'email_logs',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Thiết lập mối quan hệ
EmailLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
EmailLog.belongsTo(BorrowRequest, { foreignKey: 'borrowRequestId', as: 'borrowRequest' });

module.exports = EmailLog;