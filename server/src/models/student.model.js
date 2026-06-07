const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define(
  'Student',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    fullName: { type: DataTypes.STRING(255), allowNull: true },
    studentCode: { type: DataTypes.STRING(50), allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    avatarUrl: { type: DataTypes.STRING(500), allowNull: true },
    className: { type: DataTypes.STRING(100), allowNull: true },
    trustScore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
    trustRank: { type: DataTypes.STRING(20), allowNull: true, defaultValue: 'gold' },
    goodReturnStreak: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    totalBorrowed: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    totalLate: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  },
  {
    tableName: 'students',
    underscored: true,
    timestamps: false
  }
);

module.exports = Student;