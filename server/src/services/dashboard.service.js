const { Op, Sequelize } = require('sequelize');
const BorrowRequest = require('../models/borrowRequest.model');
const Equipment = require('../models/equipment.model');
const Student = require('../models/student.model');

// Thống kê theo thiết bị
async function getDeviceStats(targetMonth, targetYear) {
  const totalDeviceTypes = await Equipment.count({ where: { isActive: true } });
  const sumTotal = await Equipment.sum('totalQuantity', { where: { isActive: true } }) || 0;
  const sumBorrowing = await Equipment.sum('borrowingQuantity', { where: { isActive: true } }) || 0;
  const sumUnavailable = await Equipment.sum('brokenQuantity', { where: { isActive: true } }) || 0;

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

  return { totalDeviceTypes, sumTotal, sumBorrowing, sumUnavailable, topDevices };
}

// Thống kê tỉ lệ yêu cầu (Để vẽ biểu đồ tròn)
async function getRequestStats(targetMonth, targetYear) {
  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  const totalRequests = await BorrowRequest.count({
    where: { created_at: { [Op.between]: [startDate, endDate] } }
  });

  const approvedStatuses = ['approved', 'borrowing', 'overdue', 'returned_ontime', 'returned_late'];
  const rejectedStatuses = ['rejected', 'cancelled', 'cancelled_noshow'];

  const approvedCount = await BorrowRequest.count({
    where: {
      status: { [Op.in]: approvedStatuses },
      created_at: { [Op.between]: [startDate, endDate] }
    }
  });

  const rejectedCount = await BorrowRequest.count({
    where: {
      status: { [Op.in]: rejectedStatuses },
      created_at: { [Op.between]: [startDate, endDate] }
    }
  });

  const pendingCount = await BorrowRequest.count({
    where: {
      status: 'pending',
      created_at: { [Op.between]: [startDate, endDate] }
    }
  });

  const borrowingCount = await BorrowRequest.count({
    where: {
      status: 'borrowing',
      created_at: { [Op.between]: [startDate, endDate] }
    }
  });

  const overdueCount = await BorrowRequest.count({
    where: {
      status: 'overdue',
      created_at: { [Op.between]: [startDate, endDate] }
    }
  });

  return { totalRequests, approvedCount, rejectedCount, pendingCount, borrowingCount, overdueCount };
}

// Thống kê theo sinh viên
async function getStudentStats() {
  const totalStudents = await Student.count();
  
  const currentlyBorrowing = await BorrowRequest.count({
    distinct: true,
    col: 'studentId',
    where: { status: { [Op.in]: ['borrowing', 'overdue'] } }
  });

  const completedStatuses = ['returned_ontime', 'returned_late'];
  const borrowedStatuses = ['approved', 'borrowing', 'overdue', ...completedStatuses];

  const borrowedStudents = await BorrowRequest.count({
    distinct: true,
    col: 'studentId',
    where: { status: { [Op.in]: borrowedStatuses } }
  });

  const lateStudents = await BorrowRequest.count({
    distinct: true,
    col: 'studentId',
    where: { status: 'returned_late' }
  });

  const studentActivityRows = await BorrowRequest.findAll({
    attributes: [
      'studentId',
      [Sequelize.fn('COUNT', Sequelize.col('BorrowRequest.id')), 'totalBorrowRequests'],
      [
        Sequelize.fn('SUM', Sequelize.literal("CASE WHEN `BorrowRequest`.`status` IN ('returned_ontime', 'returned_late') THEN 1 ELSE 0 END")),
        'completedReturns'
      ],
      [
        Sequelize.fn('SUM', Sequelize.literal("CASE WHEN `BorrowRequest`.`status` = 'returned_ontime' THEN 1 ELSE 0 END")),
        'onTimeReturns'
      ],
      [
        Sequelize.fn('SUM', Sequelize.literal("CASE WHEN `BorrowRequest`.`status` = 'returned_late' THEN 1 ELSE 0 END")),
        'lateReturns'
      ]
    ],
    include: [
      {
        model: Student,
        as: 'student',
        attributes: ['id', 'fullName', 'studentCode', 'trustScore', 'trustRank'],
        required: true
      }
    ],
    group: [
      Sequelize.col('BorrowRequest.student_id'),
      Sequelize.col('student.id'),
      Sequelize.col('student.full_name'),
      Sequelize.col('student.student_code'),
      Sequelize.col('student.trust_score'),
      Sequelize.col('student.trust_rank')
    ],
    order: [
      [Sequelize.literal('totalBorrowRequests'), 'DESC'],
      [Sequelize.literal('completedReturns'), 'DESC']
    ],
    limit: 5
  });

  const normalizedTopStudents = studentActivityRows.map((row) => {
    const plainRow = row.get({ plain: true });
    const student = plainRow.student || {};
    const completedReturns = Number(plainRow.completedReturns ?? 0);
    const onTimeReturns = Number(plainRow.onTimeReturns ?? 0);
    const lateReturns = Number(plainRow.lateReturns ?? 0);
    const totalBorrowRequests = Number(plainRow.totalBorrowRequests ?? 0);

    return {
      id: student.id,
      fullName: student.fullName,
      studentCode: student.studentCode,
      trustScore: student.trustScore,
      trustRank: student.trustRank,
      totalBorrowRequests,
      completedReturns,
      totalBorrowed: completedReturns,
      onTimeReturns,
      lateReturns,
      totalLate: lateReturns,
      onTimeRate: completedReturns > 0 ? (onTimeReturns / completedReturns) * 100 : null
    };
  });

  return { totalStudents, currentlyBorrowing, borrowedStudents, lateStudents, topStudents: normalizedTopStudents };
}

// Thống kê thời gian
async function getTimeStats(targetYear) {
  const startDate = new Date(targetYear, 0, 1);
  const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

  const trendData = await BorrowRequest.findAll({
    attributes: [
      [Sequelize.fn('MONTH', Sequelize.col('created_at')), 'month'],
      [Sequelize.fn('YEAR', Sequelize.col('created_at')), 'year'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalRequests']
    ],
    where: {
      created_at: { [Op.between]: [startDate, endDate] }
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
