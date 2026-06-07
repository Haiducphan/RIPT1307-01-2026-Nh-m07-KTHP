const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model');

const AuditLog = sequelize.define('AuditLog', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  userId: { 
    type: DataTypes.INTEGER 
  },
  action: { 
    type: DataTypes.STRING(100), 
    allowNull: false 
  },
  entityType: { 
    type: DataTypes.STRING(50) 
  },
  entityId: { 
    type: DataTypes.INTEGER 
  },
  oldValue: { 
    type: DataTypes.JSON 
  },
  newValue: { 
    type: DataTypes.JSON 
  },
  ipAddress: { 
    type: DataTypes.STRING(45) 
  },
  userAgent: { 
    type: DataTypes.STRING(255) 
  }
}, {
  tableName: 'audit_logs',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Thiết lập mối quan hệ
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'actor' });

module.exports = AuditLog;