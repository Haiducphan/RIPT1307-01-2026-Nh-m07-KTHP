const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model');

const Admin = sequelize.define('Admin', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  fullName: { type: DataTypes.STRING(255), allowNull: false },
  phone: { type: DataTypes.STRING(20) }
}, {
  tableName: 'admins',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Thiết lập mối quan hệ
Admin.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = Admin;