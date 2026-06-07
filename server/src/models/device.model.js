const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DEVICE_STATUSES = ['available', 'unavailable', 'maintenance'];

const Device = sequelize.define(
  'Device',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ''
    },
    totalQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM(...DEVICE_STATUSES),
      allowNull: false,
      defaultValue: 'available'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    tableName: 'devices',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

module.exports = Device;
module.exports.DEVICE_STATUSES = DEVICE_STATUSES;
