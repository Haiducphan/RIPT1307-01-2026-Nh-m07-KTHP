const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Admin = require('./admin.model');

const SystemSetting = sequelize.define('SystemSetting', {
  settingKey: { 
    type: DataTypes.STRING(100), 
    primaryKey: true, 
    allowNull: false 
  },
  settingValue: { 
    type: DataTypes.STRING(500), 
    allowNull: false 
  },
  description: { 
    type: DataTypes.TEXT 
  },
  updatedBy: { 
    type: DataTypes.INTEGER 
  }
}, {
  tableName: 'system_settings',
  underscored: true,
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at'
});

// Thiết lập mối quan hệ
SystemSetting.belongsTo(Admin, { foreignKey: 'updatedBy', as: 'editor' });

module.exports = SystemSetting;