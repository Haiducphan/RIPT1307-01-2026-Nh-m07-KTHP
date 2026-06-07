const cron = require('node-cron');
const { Op } = require('sequelize');
const BorrowRequest = require('../models/borrowRequest.model');
const Student = require('../models/student.model');
const User = require('../models/user.models');
const TrustScoreLog = require('../models/trustScoreLog.model');
const { calculateRank } = require('../utils/trustScore.util');
const sequelize = require('../config/database');
const emailService = require('./email.service');

// cronjob chạy hằng ngày
async function runDailyTasks() {
  console.log('[CRON] Bắt đầu chạy cỗ máy tuần tra tự động...');
  const now = new Date();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Tính mốc để quét nhắc nhở trả đồ trước 2 ngày
  const inTwoDays = new Date(today);
  inTwoDays.setDate(inTwoDays.getDate() + 2);

  const transaction = await sequelize.transaction();

  try {
    // Quét đơn bom hàng
    const noshowRequests = await BorrowRequest.findAll({
      where: {
        status: 'approved',
        pickupDeadline: { [Op.lt]: now }
      },
      transaction
    });

    for (const request of noshowRequests) {
      await request.update({ status: 'cancelled_noshow' }, { transaction });

      const student = await Student.findByPk(request.studentId, { include: [{ model: User, as: 'user' }], transaction });
      if (student) {
        const penalty = 10;
        const scoreBefore = student.trustScore;
        const rankBefore = student.trustRank;
        
        let scoreAfter = Math.max(0, scoreBefore - penalty);
        const rankAfter = calculateRank(scoreAfter);

        await student.update({ trustScore: scoreAfter, trustRank: rankAfter }, { transaction });

        await TrustScoreLog.create({
          studentId: student.id,
          borrowRequestId: request.id,
          delta: -penalty,
          scoreBefore, scoreAfter, rankBefore, rankAfter,
          reason: 'noshow',
          createdBy: 1
        }, { transaction });

        if (student.user && student.user.email) {
          await emailService.sendDynamicEmail(
            'trust_point_deducted', 
            student.user.email, 
            {
              name: student.fullName,
              request_code: request.requestCode,
              delta: penalty,
              reason: 'Không đến nhận thiết bị đúng hạn (Bom hàng)'
            },
            student.userId,
            request.id
          );
        }
      }
    }

    // Gửi email nhắc nhở trước 2 ngày
    const reminderRequests = await BorrowRequest.findAll({
      where: {
        status: 'borrowing',
        returnDate: inTwoDays
      },
      transaction
    });

    for (const request of reminderRequests) {
      const student = await Student.findByPk(
        request.studentId, 
        { include: [{ model: User, as: 'user' }], 
        transaction 
      });
      if (student && student.user && student.user.email) {
        await emailService.sendDynamicEmail(
          'return_reminder', 
          student.user.email, 
          {
            name: student.fullName,
            request_code: request.requestCode,
            return_date: request.returnDate,
          },
          student.userId,
          request.id
        );
      }
    }

    // Quét và trừ điểm quá hạn (trừ 3 điểm mỗi ngày)
    const overdueRequests = await BorrowRequest.findAll({
      where: {
        status: { [Op.in]: ['borrowing', 'overdue'] },
        returnDate: { [Op.lt]: today }
      },
      transaction
    });

    for (const request of overdueRequests) {
      // Tính số ngày trễ để lưu vào đơn mượn
      const returnDateObj = new Date(request.returnDate);
      const diffTime = Math.abs(today - returnDateObj);
      const lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      await request.update({ status: 'overdue', lateDays }, { transaction });

      const student = await Student.findByPk(request.studentId, { include: [{ model: User, as: 'user' }], transaction });
      if (student) {
        const penalty = 3;
        const scoreBefore = student.trustScore;
        const rankBefore = student.trustRank;
        
        let scoreAfter = Math.max(0, scoreBefore - penalty);
        const rankAfter = calculateRank(scoreAfter);

        await student.update({ trustScore: scoreAfter, trustRank: rankAfter }, { transaction });

        await TrustScoreLog.create({
          studentId: student.id,
          borrowRequestId: request.id,
          delta: -penalty,
          scoreBefore, scoreAfter, rankBefore, rankAfter,
          reason: 'late_return',
          createdBy: 1
        }, { transaction });

        // Gửi email cảnh báo trừ điểm hàng ngày
        if (student.user && student.user.email) {
          await emailService.sendDynamicEmail(
            'trust_point_deducted', 
            student.user.email, 
            {
              name: student.fullName,
              request_code: request.requestCode,
              delta: penalty,
              reason: `Quá hạn trả thiết bị ${lateDays} ngày`
            },
            student.userId,
            request.id
          );
        }
      }
    }

    await transaction.commit();
    console.log(`[CRON] Xong! Xử lý: 
      ${noshowRequests.length} đơn Bom, 
      ${reminderRequests.length} Nhắc nhở, 
      ${overdueRequests.length} Quá hạn.
    `);
  } catch (error) {
    await transaction.rollback();
    console.error('[CRON] Lỗi khi chạy hệ thống tự động:', error.message);
  }
}

// Kích hoạt chạy vào 00:00 hàng ngày
function startCronJobs() {
  cron.schedule('0 0 * * *', () => {
    runDailyTasks();
  });
  console.log('Hệ thống Cronjob đa nhiệm đã được kích hoạt.');
}

module.exports = { startCronJobs, runDailyTasks };