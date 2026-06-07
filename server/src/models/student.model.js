const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  fullName: { type: DataTypes.STRING(255), allowNull: false },
  studentCode: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  phone: { type: DataTypes.STRING(20) },
  avatarUrl: { type: DataTypes.STRING(500) },
  className: { type: DataTypes.STRING(100) },
  trustScore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
  trustRank: {
    type: DataTypes.ENUM('diamond', 'gold', 'silver', 'bronze', 'pebble'), // Của bạn dùng 'pebble'
    allowNull: false,
    defaultValue: 'diamond'
  },
  borrowLocked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  borrowLockUntil: { type: DataTypes.DATE },
  borrowLockReason: { type: DataTypes.TEXT },
  isPermanentlyLocked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  permanentLockReason: { type: DataTypes.TEXT },
  goodReturnStreak: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  totalBorrowed: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  totalLate: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, {
  tableName: 'students',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  
});

const User = require('./user.models');
// Thiết lập mối quan hệ
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = Student;