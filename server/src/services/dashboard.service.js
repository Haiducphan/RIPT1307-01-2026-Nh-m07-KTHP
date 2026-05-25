const { Op, Sequelize } = require('sequelize');
const BorrowRequest = require('../models/borrowRequest.model');
const Equipment = require('../models/equipment.model');
const Student = require('../models/student.model');

// Thống kê theo thiết bị
async function getDeviceStats(targetMonth, targetYear) {
  // Lấy tổng quan kho
  const totalDeviceTypes = await Equipment.count();
  const sumTotal = await Equipment.sum('totalQuantity') || 0;
  const sumBorrowing = await Equipment.sum('borrowingQuantity') || 0;
  const usageRate = sumTotal > 0 ? ((sumBorrowing / sumTotal) * 100).toFixed(1) : 0;

  // Lấy Top 5 thiết bị mượn nhiều nhất trong tháng
  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  const topDevices = await BorrowRequest.findAll({
    attributes: [
      'equipmentId',
      [Sequelize.fn('COUNT', Sequelize.col('BorrowRequest.id')), 'totalBorrows']
    ],
    where: {
      status: { [Op.notIn]: ['pending', 'rejected', 'cancelled', 'cancelled_noshow'] },
      borrowDate: { [Op.between]: [startDate, endDate] }
    },
    include: [{ model: Equipment, as: 'equipment', attributes: ['name', 'availableQuantity'] }],
    group: ['equipmentId', 'equipment.id'],
    order: [[Sequelize.literal('totalBorrows'), 'DESC']],
    limit: 5
  });

  return {
    overview: { totalDeviceTypes, sumTotal, sumBorrowing, usageRate },
    topDevices
  };
}

// Thống kê theo yêu cầu
async function getRequestStats(targetMonth, targetYear) {
  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);
  
  const whereCondition = { created_at: { [Op.between]: [startDate, endDate] } };

  // Phân bổ trạng thái
  const statusDistribution = await BorrowRequest.findAll({
    attributes: ['status', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
    where: whereCondition,
    group: ['status']
  });

  // Tính tỷ lệ duyệt / từ chối
  let totalRequests = 0, approved = 0, rejected = 0;
  statusDistribution.forEach(item => {
    const count = parseInt(item.dataValues.count);
    totalRequests += count;
    if (['approved', 'borrowing', 'returned_ontime', 'returned_late', 'overdue'].includes(item.status)) approved += count;
    if (item.status === 'rejected') rejected += count;
  });

  const approvalRate = totalRequests > 0 ? ((approved / totalRequests) * 100).toFixed(1) : 0;
  const rejectionRate = totalRequests > 0 ? ((rejected / totalRequests) * 100).toFixed(1) : 0;

  // Danh sách đang quá hạn
  const overdueList = await BorrowRequest.findAll({
    where: { status: 'overdue' },
    include: [
      { model: Student, as: 'student', attributes: ['fullName', 'studentCode'] },
      { model: Equipment, as: 'equipment', attributes: ['name'] }
    ],
    attributes: ['id', 'lateDays', 'returnDate']
  });

  return {
    totalRequests, approvalRate, rejectionRate,
    statusDistribution, overdueList
  };
}

// Thống kê theo sinh viên
async function getStudentStats() {
  const totalStudents = await Student.count();
  
  const currentlyBorrowing = await BorrowRequest.count({
    distinct: true,
    col: 'studentId',
    where: { status: 'borrowing' }
  });

  const everOverdue = await BorrowRequest.count({
    distinct: true,
    col: 'studentId',
    where: { status: { [Op.in]: ['returned_late', 'overdue'] } }
  });

  // Top 5 sinh viên mượn nhiều nhất
  const topStudents = await Student.findAll({
    attributes: ['id', 'fullName', 'trustScore', 'totalBorrowed', 'totalLate'],
    order: [['totalBorrowed', 'DESC']],
    limit: 5
  });

  return {
    totalStudents, currentlyBorrowing, everOverdue, topStudents
  };
}

// Thống kê theo thời gian
async function getTimeStats() {
  const today = new Date();
  const twelveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 11, 1);

  const trendData = await BorrowRequest.findAll({
    attributes: [
      [Sequelize.fn('MONTH', Sequelize.col('borrow_date')), 'month'],
      [Sequelize.fn('YEAR', Sequelize.col('borrow_date')), 'year'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_requests']
    ],
    where: {
      borrowDate: { [Op.gte]: twelveMonthsAgo }
    },
    group: ['year', 'month'],
    order: [['year', 'ASC'], ['month', 'ASC']]
  });

  return trendData;
}

module.exports = {
  getDeviceStats, getRequestStats, getStudentStats, getTimeStats
};