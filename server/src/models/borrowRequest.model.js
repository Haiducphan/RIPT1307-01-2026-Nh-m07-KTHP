const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Equipment = require('./equipment.model'); 
const Student = require('./student.model');
const Admin = require('./admin.model');

const BorrowRequest = sequelize.define('BorrowRequest', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  requestCode: { type: DataTypes.STRING(50), unique: true },
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  equipmentId: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  borrowDate: { type: DataTypes.DATEONLY, allowNull: false },
  returnDate: { type: DataTypes.DATEONLY, allowNull: false },
  actualReturnDate: { type: DataTypes.DATEONLY },
  purpose: { type: DataTypes.TEXT },
  eventName: { type: DataTypes.STRING(255) },
  status: {
    type: DataTypes.ENUM(
      'pending', 'approved', 'rejected', 'borrowing', 
      'returned_ontime', 'returned_late', 'overdue', 
      'cancelled', 'cancelled_noshow'
    ),
    allowNull: false,
    defaultValue: 'pending'
  },
  // Duyệt
  approvedBy: { type: DataTypes.INTEGER },
  approvedAt: { type: DataTypes.DATE },
  pickupDeadline: { type: DataTypes.DATE },
  // Từ chối
  rejectedBy: { type: DataTypes.INTEGER },
  rejectedAt: { type: DataTypes.DATE },
  rejectionReason: { type: DataTypes.TEXT },
  // Bàn giao
  handedOverAt: { type: DataTypes.DATE },
  handedOverBy: { type: DataTypes.INTEGER },
  // Trả đồ
  returnCondition: { type: DataTypes.ENUM('perfect', 'minor_damage', 'major_damage', 'lost') },
  returnCheckedBy: { type: DataTypes.INTEGER },
  damageNote: { type: DataTypes.TEXT },
  // Thống kê
  trustScoreDelta: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  lateDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, {
  tableName: 'borrow_requests',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Thiết lập mối quan hệ
BorrowRequest.belongsTo(Equipment, { foreignKey: 'equipmentId', as: 'equipment' });
BorrowRequest.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
BorrowRequest.belongsTo(Admin, { foreignKey: 'approvedBy', as: 'approver' });
BorrowRequest.belongsTo(Admin, { foreignKey: 'rejectedBy', as: 'rejecter' });
BorrowRequest.belongsTo(Admin, { foreignKey: 'handedOverBy', as: 'handoverAdmin' });
BorrowRequest.belongsTo(Admin, { foreignKey: 'returnCheckedBy', as: 'returnChecker' });

module.exports = BorrowRequest;
