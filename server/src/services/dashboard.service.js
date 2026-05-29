const { Op, Sequelize } = require('sequelize');
const BorrowRequest = require('../models/borrowRequest.model');
const Equipment = require('../models/equipment.model');
const Student = require('../models/student.model');

// Thống kê theo thiết bị
async function getDeviceStats(targetMonth, targetYear) {
  const totalDeviceTypes = await Equipment.count({ where: { isActive: true } });
  const sumTotal = await Equipment.sum('totalQuantity', { where: { isActive: true } }) || 0;
  const sumBorrowing = await Equipment.sum('borrowingQuantity', { where: { isActive: true } }) || 0;

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  const topDevices = await BorrowRequest.findAll({
    attributes: [
      'equipmentId',
      [Sequelize.fn('COUNT', Sequelize.col('BorrowRequest.id')), 'totalBorrows']
    ],
    where: {
      status: { [Op.notIn]: ['pending', 'rejected', 'cancelled', 'cancelled_noshow'] },
      created_at: { [Op.between]: [startDate, endDate] }
    },
    include: [{ model: Equipment, as: 'equipment', attributes: ['name', 'code', 'availableQuantity'] }],
    group: ['equipmentId', 'equipment.id'], 
    order: [[Sequelize.literal('totalBorrows'), 'DESC']],
    limit: 5
  });

  return { totalDeviceTypes, sumTotal, sumBorrowing, topDevices };
}

// Thống kê tỉ lệ yêu cầu (Để vẽ biểu đồ tròn)
async function getRequestStats(targetMonth, targetYear) {
  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  const totalRequests = await BorrowRequest.count({
    where: { created_at: { [Op.between]: [startDate, endDate] } }
  });

  const approvedCount = await BorrowRequest.count({
    where: {
      status: { [Op.notIn]: ['pending', 'rejected', 'cancelled'] },
      created_at: { [Op.between]: [startDate, endDate] }
    }
  });

  const rejectedCount = await BorrowRequest.count({
    where: {
      status: 'rejected',
      created_at: { [Op.between]: [startDate, endDate] }
    }
  });

  return { totalRequests, approvedCount, rejectedCount };
}

// Thống kê theo sinh viên
async function getStudentStats() {
  const totalStudents = await Student.count();
  
  const currentlyBorrowing = await BorrowRequest.count({
    distinct: true,
    col: 'studentId',
    where: { status: 'borrowing' }
  });

  const topStudents = await Student.findAll({
    attributes: ['id', 'fullName', 'studentCode', 'trustScore', 'totalBorrowed', 'totalLate'],
    order: [['totalBorrowed', 'DESC']],
    limit: 5
  });

  return { totalStudents, currentlyBorrowing, topStudents };
}

// Thống kê thời gian
async function getTimeStats() {
  const today = new Date();
  const twelveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 11, 1);

  const trendData = await BorrowRequest.findAll({
    attributes: [
      [Sequelize.fn('MONTH', Sequelize.col('created_at')), 'month'],
      [Sequelize.fn('YEAR', Sequelize.col('created_at')), 'year'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalRequests']
    ],
    where: {
      created_at: { [Op.gte]: twelveMonthsAgo }
    },
    group: [
      Sequelize.fn('YEAR', Sequelize.col('created_at')), 
      Sequelize.fn('MONTH', Sequelize.col('created_at'))
    ],
    order: [
      [Sequelize.fn('YEAR', Sequelize.col('created_at')), 'ASC'],
      [Sequelize.fn('MONTH', Sequelize.col('created_at')), 'ASC']
    ]
  });

  return trendData;
}

module.exports = { getDeviceStats, getRequestStats, getStudentStats, getTimeStats };