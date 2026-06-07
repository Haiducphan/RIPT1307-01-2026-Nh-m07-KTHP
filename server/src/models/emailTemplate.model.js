const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Admin = require('./admin.model');

const EmailTemplate = sequelize.define('EmailTemplate', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  code: { 
    type: DataTypes.STRING(100), 
    allowNull: false, 
    unique: true 
  },
  name: { 
    type: DataTypes.STRING(255), 
    allowNull: false 
  },
  subject: { 
    type: DataTypes.STRING(255), 
    allowNull: false 
  },
  body: { 
    type: DataTypes.TEXT, 
    allowNull: false 
  },
  isActive: { 
    type: DataTypes.BOOLEAN, 
    allowNull: false, 
    defaultValue: true 
  },
  updatedBy: { 
    type: DataTypes.INTEGER 
  }
}, {
  tableName: 'email_templates',
  underscored: true,
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at'
});

// Thiết lập mối quan hệ
EmailTemplate.belongsTo(Admin, { foreignKey: 'updatedBy', as: 'editor' });

module.exports = EmailTemplate;