const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TrustScoreLog = sequelize.define(
  'TrustScoreLog',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    studentId: { type: DataTypes.INTEGER, allowNull: false },
    borrowRequestId: { type: DataTypes.INTEGER, allowNull: true },
    delta: { type: DataTypes.INTEGER, allowNull: false },
    scoreBefore: { type: DataTypes.INTEGER, allowNull: false },
    scoreAfter: { type: DataTypes.INTEGER, allowNull: false },
    rankBefore: { type: DataTypes.STRING(20), allowNull: true },
    rankAfter: { type: DataTypes.STRING(20), allowNull: true },
    reason: { type: DataTypes.STRING(50), allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true }
  },
  {
    tableName: 'trust_score_logs',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  }
);

module.exports = TrustScoreLog;