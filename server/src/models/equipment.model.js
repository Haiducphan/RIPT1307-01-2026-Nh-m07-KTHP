const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Admin = require('./admin.model');
const Category = require('./category.model');

const Equipment = sequelize.define('Equipment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: false }, // ID của Admin tạo
  categoryId: { type: DataTypes.INTEGER },
  code: { type: DataTypes.STRING(50), unique: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT },
  totalQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  availableQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  borrowingQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  brokenQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  conditionStatus: { 
    type: DataTypes.ENUM('good', 'fair', 'damaged'), 
    allowNull: false, 
    defaultValue: 'good' 
  },
  tier: { 
    type: DataTypes.ENUM('S', 'A', 'B', 'C'), 
    allowNull: false, 
    defaultValue: 'C' 
  },
  isActive: { 
    type: DataTypes.BOOLEAN, 
    allowNull: false, 
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'equipment',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Thiết lập mối quan hệ
Equipment.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Equipment.belongsTo(Admin, { foreignKey: 'createdBy', as: 'creator' });

module.exports = Equipment;