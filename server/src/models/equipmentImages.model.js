const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Equipment = require('./equipment.model');

// Model equipmentImage  
const EquipmentImage = sequelize.define(
  'EquipmentImage',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    equipmentId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    tableName: 'equipment_images',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  }
);

// Thiết lập mối quan hệ
Equipment.hasMany(EquipmentImage, { foreignKey: 'equipmentId', as: 'images' });
EquipmentImage.belongsTo(Equipment, { foreignKey: 'equipmentId' });

module.exports = EquipmentImage;