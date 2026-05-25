const cron = require('node-cron');
const { Op } = require('sequelize');
const BorrowRequest = require('../models/borrowRequest.model');
const Student = require('../models/student.model');
const TrustScoreLog = require('../models/trustScoreLog.model'); 
const { calculateRank } = require('../utils/trustScore.util');
const sequelize = require('../config/database');

// Xử lý kiểm tra quá hạn
async function checkOverdueRequests() {
  console.log('[CRON] Bắt đầu quét đơn quá hạn...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const transaction = await sequelize.transaction();

  try {
    // Tìm các đơn đang mượn (borrowing) hoặc đã quá hạn (overdue) có hạn trả (returnDate) nhỏ hơn hôm nay
    const overdueRequests = await BorrowRequest.findAll({
      where: {
        status: { [Op.in]: ['borrowing', 'overdue'] },
        returnDate: { [Op.lt]: today }
      },
      transaction
    });

    for (const request of overdueRequests) {
      // Tính số ngày trễ tổng cộng để lưu vào Database báo cáo Admin
      const returnDate = new Date(request.returnDate);
      const diffTime = Math.abs(today - returnDate);
      const lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

      await request.update({ 
        status: 'overdue',
        lateDays: lateDays
      }, { transaction });

      // Xử lý trừ điểm uy tín sinh viên
      const student = await Student.findByPk(request.studentId, { transaction });
      if (student) {
        
        const penalty = 3; 
        
        const scoreBefore = student.trustScore;
        const rankBefore = student.trustRank;
        
        let scoreAfter = scoreBefore - penalty;
        if (scoreAfter < 0) scoreAfter = 0;

        const rankAfter = calculateRank(scoreAfter);

        // Cập nhật sinh viên
        await student.update({
          trustScore: scoreAfter,
          trustRank: rankAfter
        }, { transaction });

        // Ghi log lịch sử điểm
        await TrustScoreLog.create({
          studentId: student.id,
          borrowRequestId: request.id,
          delta: -penalty,
          scoreBefore: scoreBefore,
          scoreAfter: scoreAfter,
          rankBefore: rankBefore,
          rankAfter: rankAfter,
          reason: 'late_return', 
          createdBy: 1 
        }, { transaction });
      }
    }

    await transaction.commit();
    console.log(`[CRON] Quét xong. Đã xử lý ${overdueRequests.length} đơn quá hạn.`);
  } catch (error) {
    await transaction.rollback();
    console.error('[CRON] Lỗi khi quét quá hạn:', error.message);
  }
}

// Cài đặt lịch chạy: '0 0 * * *' nghĩa là chạy vào 00:00 mỗi ngày
function startCronJobs() {
  cron.schedule('0 0 * * *', () => {
    checkOverdueRequests();
  });
  console.log('Cronjob quét quá hạn đã được kích hoạt.');
}

module.exports = { startCronJobs, checkOverdueRequests };