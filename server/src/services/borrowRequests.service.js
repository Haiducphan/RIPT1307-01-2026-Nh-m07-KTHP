const BorrowRequest = require('../models/borrowRequest.model');
const Equipment = require('../models/equipment.model');
const Student = require('../models/student.model'); 
const User = require('../models/user.model');
const sequelize = require('../config/database');

const emailService = require('./email.service');

// Xử lý xét duyệt đơn
async function approveRequest(requestId, adminId) {
  const transaction = await sequelize.transaction();

  try {
    const request = await BorrowRequest.findOne({ 
      where: { id: requestId, status: 'pending' },
      transaction 
    });

    if (!request) {
      throw { status: 404, message: 'Không tìm thấy đơn mượn hoặc đơn đã được xử lý' };
    }

    const equipment = await Equipment.findOne({ 
      where: { id: request.equipmentId, isActive: true }, 
      transaction 
    });

    if (!equipment || equipment.availableQuantity < request.quantity) {
      throw { status: 400, message: 'Thiết bị không tồn tại hoặc không đủ số lượng để duyệt' };
    }

    await equipment.decrement('availableQuantity', { 
      by: request.quantity, 
      transaction 
    });

    const pickupDeadline = new Date();
    pickupDeadline.setHours(pickupDeadline.getHours() + 48); 

    await request.update({
      status: 'approved',
      approvedBy: adminId,
      approvedAt: new Date(),
      pickupDeadline: pickupDeadline
    }, { transaction });

    await transaction.commit();

    // Gửi email đến sinh viên
    try {
      const studentInfo = await Student.findByPk(request.studentId, {
        include: [{ model: User, as: 'user' }]
      });
      
      if (studentInfo && studentInfo.user) {
        const targetEmail = studentInfo.user.email; 

        await emailService.sendDynamicEmail('request_approved', targetEmail, {
          name: studentInfo.fullName,
          request_code: request.requestCode
        });
      }
    } catch (emailErr) {
      console.error('Lỗi khi kích hoạt gửi email duyệt đơn:', emailErr.message);
    }

    return request;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

//  Xử lý từ chối đơn
async function rejectRequest(requestId, adminId, reason) {
  const request = await BorrowRequest.findOne({ where: { id: requestId, status: 'pending' } });
  
  if (!request) {
    throw { status: 404, message: 'Không tìm thấy đơn mượn hoặc đơn đã được xử lý' };
  }

  await request.update({
    status: 'rejected',
    rejectedBy: adminId,
    rejectedAt: new Date(),
    rejectionReason: reason || 'Không đủ điều kiện mượn'
  });

  // Gửi email đến sinh viên
  try {
    const studentInfo = await Student.findByPk(request.studentId, {
      include: [{ model: User, as: 'user' }]
    });
    
    if (studentInfo && studentInfo.user) {
      const targetEmail = studentInfo.user.email; 

      await emailService.sendDynamicEmail('request_rejected', targetEmail, {
        name: studentInfo.fullName,
        request_code: request.requestCode,
        reason: reason || 'Không đủ điều kiện mượn'
      });
    }
  } catch (emailErr) {
    console.error('Lỗi khi kích hoạt gửi email từ chối:', emailErr.message);
  }
  
  return request;
}

// Xử lý bàn giao thiết bị cho sinh viên
async function handoverRequest(requestId, adminId) {
  const request = await BorrowRequest.findOne({ 
    where: { id: requestId, status: 'approved' } 
  });

  if (!request) {
    throw { status: 404, message: 'Không tìm thấy đơn mượn hoặc đơn chưa được duyệt/đã bàn giao' };
  }

  // Cập nhật trạng thái thành Đang mượn (borrowing)
  await request.update({
    status: 'borrowing',
    handedOverAt: new Date(),
    handedOverBy: adminId
  });

  return request;
}

module.exports = { approveRequest, rejectRequest, handoverRequest };