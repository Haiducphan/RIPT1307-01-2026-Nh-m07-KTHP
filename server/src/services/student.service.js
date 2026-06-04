const Student = require('../models/student.model');
const User = require('../models/user.model');
const TrustScoreLog = require('../models/trustScoreLog.model');
const BorrowRequest = require('../models/borrowRequest.model');
const { calculateRank } = require('../utils/trustScore.util');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

// Phục hồi hoặc trừ điểm uy tín thủ công từ Admin
async function restoreTrustScoreService(studentId, pointsToAdd, reason, adminId) {
  const transaction = await sequelize.transaction();
  try {
    const student = await Student.findByPk(studentId, { transaction });
    if (!student) {
      throw { status: 404, message: 'Không tìm thấy hồ sơ sinh viên' };
    }

    // Tính toán điểm mới trong khoảng [0, 100]
    let newScore = student.trustScore + pointsToAdd;
    if (newScore > 100) newScore = 100;
    if (newScore < 0) newScore = 0;
    
    const newRank = calculateRank(newScore);
    const logReason = pointsToAdd >= 0 ? 'admin_manual_add' : 'admin_manual_deduct';

    // Ghi log biến động vào bảng trust_score_logs
    await TrustScoreLog.create({
      studentId: student.id,
      delta: pointsToAdd,
      scoreBefore: student.trustScore,
      scoreAfter: newScore,
      rankBefore: student.trustRank,
      rankAfter: newRank,
      reason: logReason, 
      note: reason,      
      createdBy: adminId
    }, { transaction });

    // Cập nhật điểm và hạng mới cho sinh viên
    await student.update({ trustScore: newScore, trustRank: newRank }, { transaction });

    await transaction.commit();
    return { newScore, newRank };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

//Khoá hoặc mở khoá tính năng mượn đồ thủ công từ Admin
async function toggleManualLockService(studentId, { isLocked, lockDays, isPermanent, reason }) {
  const student = await Student.findByPk(studentId);
  if (!student) {
    throw { status: 404, message: 'Không tìm thấy hồ sơ sinh viên' };
  }

  if (isLocked === false) {
    // Admin chủ động mở khoá
    await student.update({
      borrowLocked: false,
      borrowLockUntil: null,
      borrowLockReason: null,
      isPermanentlyLocked: false,
      permanentLockReason: null
    });
  } else {
    // Admin chủ động khoá
    const updateData = { 
      borrowLocked: true, 
      borrowLockReason: reason || 'Admin khoá thủ công' 
    };
    
    if (isPermanent) {
      updateData.isPermanentlyLocked = true;
      updateData.permanentLockReason = reason || 'Khoá vĩnh viễn';
      updateData.borrowLockUntil = null;
    } else if (lockDays) {
      const lockDate = new Date();
      lockDate.setDate(lockDate.getDate() + parseInt(lockDays));
      updateData.borrowLockUntil = lockDate;
    }

    await student.update(updateData);
  }

  return student;
}



// Hàm tự động tính toán hình phạt khoá mượn đồ khi sinh viên bị tụt hạng
async function applyRankDropPenalty(student, oldRank, newRank, transaction) {
  const rankLevels = { diamond: 5, gold: 4, silver: 3, bronze: 2, pebble: 1 };

  // Nếu không tụt hạng (hoặc thăng hạng) thì không phạt
  if (rankLevels[newRank] >= rankLevels[oldRank]) return;

  const now = new Date();
  let isLocked = false;
  let lockDays = 0;
  let reason = '';
  let isPermanent = false;

  // Truy vấn số ngày phạt từ bảng System Settings
  const settingG2S = await SystemSetting.findOne({ where: { settingKey: 'PENALTY_GOLD_TO_SILVER_DAYS' } });
  const settingS2B = await SystemSetting.findOne({ where: { settingKey: 'PENALTY_SILVER_TO_BRONZE_DAYS' } });
  
  const goldToSilverDays = settingG2S ? parseInt(settingG2S.settingValue) : 3;
  const silverToBronzeDays = settingS2B ? parseInt(settingS2B.settingValue) : 7;

  if (oldRank === 'gold' && newRank === 'silver') {
    isLocked = true;
    lockDays = goldToSilverDays;
    reason = `Hệ thống tự động phạt: Tụt hạng từ Vàng xuống Bạc (Khoá ${lockDays} ngày)`;
  } else if (oldRank === 'silver' && newRank === 'bronze') {
    isLocked = true;
    lockDays = silverToBronzeDays;
    reason = `Hệ thống tự động phạt: Tụt hạng từ Bạc xuống Đồng (Khoá ${lockDays} ngày)`;
  } else if (newRank === 'pebble') {
    isLocked = true;
    isPermanent = true;
    reason = 'Hệ thống tự động phạt: Rơi xuống hạng Đá cuội (Ý thức quá kém)';
  }

  // Thực thi cập nhật lệnh khoá vào database
  if (isLocked) {
    const updateData = { borrowLocked: true, borrowLockReason: reason };

    if (isPermanent) {
      updateData.isPermanentlyLocked = true;
      updateData.permanentLockReason = reason;
      updateData.borrowLockUntil = null;
    } else {
      const lockDate = new Date();
      lockDate.setDate(now.getDate() + lockDays);
      updateData.borrowLockUntil = lockDate;
    }

    await student.update(updateData, { transaction });
  }
}

// Lấy danh sách sinh viên có phân trang và tìm kiếm
async function getStudentsService({ page = 1, limit = 10, search = '' }) {
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const offset = (parsedPage - 1) * parsedLimit;

  const whereClause = {};
  if (search) {
    whereClause[Op.or] = [
      { fullName: { [Op.like]: `%${search}%` } },
      { studentCode: { [Op.like]: `%${search}%` } },
      { '$user.email$': { [Op.like]: `%${search}%` } }
    ];
  }

  const { count, rows } = await Student.findAndCountAll({
    where: whereClause,
    distinct: true,
    subQuery: false,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'isActive'],
        required: false
      }
    ],
    order: [
      ['trustScore', 'ASC'],
      ['created_at', 'DESC']
    ],
    limit: parsedLimit,
    offset: offset
  });

  return {
    totalItems: count,
    totalPages: Math.ceil(count / parsedLimit),
    currentPage: parsedPage,
    limit: parsedLimit,
    data: rows.map((student) => {
      const plainStudent = student.get({ plain: true });
      const userEmail = plainStudent.user?.email || null;

      return {
        ...plainStudent,
        email: userEmail,
        userEmail
      };
    })
  };
}

// Lấy lịch sử biến động điểm uy tín của 1 sinh viên cụ thể
async function getTrustScoreLogsService(studentId) {
  const student = await Student.findByPk(studentId);
  if (!student) throw { status: 404, message: 'Không tìm thấy hồ sơ sinh viên' };

  return await TrustScoreLog.findAll({
    where: { studentId },
    include: [{ model: BorrowRequest, attributes: ['id', 'requestCode', 'status'], required: false }],
    order: [['created_at', 'DESC']]
  });
}

// Lấy lịch sử biến động điểm uy tín của sinh viên đang đăng nhập
async function getMyTrustScoreLogsService(userId) {
  const student = await Student.findOne({ where: { userId } });
  if (!student) throw { status: 404, message: 'Không tìm thấy hồ sơ sinh viên' };

  return getTrustScoreLogsService(student.id);
}

// Cập nhật Avatar cho sinh viên
async function updateAvatarService(userId, fileUrl) {
  const student = await Student.findOne({ where: { userId } });
  
  if (!student) {
    throw { status: 404, message: 'Không tìm thấy hồ sơ sinh viên' };
  }

  await student.update({ avatarUrl: fileUrl });
  
  return student;
}

module.exports = {
  restoreTrustScoreService,
  toggleManualLockService,
  applyRankDropPenalty,
  getStudentsService,
  getTrustScoreLogsService,
  getMyTrustScoreLogsService,
  updateAvatarService,
};
