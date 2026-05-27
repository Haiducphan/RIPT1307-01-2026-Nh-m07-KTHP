const { Op } = require('sequelize');
const BorrowRequest = require('../models/borrowRequest.model');
const Equipment = require('../models/equipment.models');
const User = require('../models/user.models');
const Student = require('../models/student.model');
const EquipmentImage = require('../models/equipmentImage.model');
const { sendEmail } = require('./email.service');

const TIER_MIN_SCORE = { S: 90, A: 80, B: 65, C: 50 };

async function createBorrowRequest({ studentId, equipmentId, quantity, borrowDate, returnDate, purpose, eventName }) {
  const equipment = await Equipment.findOne({ where: { id: equipmentId, isDeleted: false } });
  if (!equipment) {
    const err = new Error('Thiet bi khong ton tai');
    err.status = 404;
    throw err;
  }

  if (equipment.availableQuantity < quantity) {
    const err = new Error(`Khong du so luong. Con lai: ${equipment.availableQuantity}`);
    err.status = 400;
    throw err;
  }

  const student = await User.findByPk(studentId);
  if (!student) {
    const err = new Error('Sinh vien khong ton tai');
    err.status = 404;
    throw err;
  }

  const minScore = TIER_MIN_SCORE[equipment.tier] ?? 0;
  if (student.trustScore < minScore) {
    const err = new Error(
      `Can dat ${minScore} diem uy tin de muon thiet bi hang ${equipment.tier}. Hien tai: ${student.trustScore}`
    );
    err.status = 403;
    throw err;
  }

  const count = await BorrowRequest.count();
  const requestCode = `REQ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  const request = await BorrowRequest.create({
    requestCode,
    studentId,
    equipmentId,
    quantity,
    borrowDate,
    returnDate,
    purpose,
    eventName,
    status: 'pending'
  });

  return request;
}

async function listBorrowRequests({ userId, studentId, status, page = 1, limit = 20 } = {}) {
  const where = {};

  if (userId) {
    const student = await Student.findOne({ where: { userId } });
    if (!student) return { total: 0, page: Number(page), totalPages: 0, data: [] };
    where.studentId = student.id;
  } else if (studentId) {
    where.studentId = studentId;
  }

  if (status) where.status = status;

  const offset = (page - 1) * limit;
  const { count, rows } = await BorrowRequest.findAndCountAll({
    where,
    include: [
      {
        model: Equipment,
        as: 'equipment',
        attributes: ['id', 'name', 'tier'],
        include: [
          {
            model: EquipmentImage,
            as: 'images',
            attributes: ['id', 'equipmentId', 'imageUrl', 'isPrimary', 'sortOrder']
          }
        ]
      }
    ],
    order: [['created_at', 'DESC']],
    limit: Number(limit),
    offset
  });

  return { total: count, page: Number(page), totalPages: Math.ceil(count / limit), data: rows };
}

async function returnBorrowRequest(id, adminId, returnCondition) {
  const request = await BorrowRequest.findOne({ where: { id, status: 'borrowing' } });
  if (!request) {
    const err = new Error('Khong tim thay don hoac thiet bi chua duoc ban giao');
    err.status = 404;
    throw err;
  }

  const today = new Date().toISOString().slice(0, 10);
  const isLate = today > request.returnDate;
  const lateDays = isLate
    ? Math.floor((new Date(today) - new Date(request.returnDate)) / (1000 * 60 * 60 * 24))
    : 0;

  await request.update({
    status: isLate ? 'returned_late' : 'returned_ontime',
    actualReturnDate: today,
    returnCondition: returnCondition || 'perfect',
    returnCheckedBy: adminId,
    lateDays
  });

  const equipment = await Equipment.findByPk(request.equipmentId);
  if (equipment) {
    await equipment.update({
      availableQuantity: equipment.availableQuantity + request.quantity,
      borrowingQuantity: equipment.borrowingQuantity - request.quantity
    });
  }

  return request;
}

async function approveBorrowRequestService(id, adminId) {
  const request = await BorrowRequest.findOne({ where: { id, status: 'pending' } });
  if (!request) {
    const err = new Error('Khong tim thay don hoac don khong o trang thai pending');
    err.status = 404;
    throw err;
  }

  await request.update({
    status: 'approved',
    approvedBy: adminId,
    approvedAt: new Date()
  });

  const student = await User.findByPk(request.studentId);
  if (student) {
    await sendEmail({
      userId: student.id,
      borrowRequestId: request.id,
      templateCode: 'request_approved',
      toEmail: student.email,
      variables: {
        email: student.email,
        request_code: request.requestCode
      }
    });
  }

  return request;
}

async function rejectBorrowRequestService(id, adminId, reason) {
  const request = await BorrowRequest.findOne({ where: { id, status: 'pending' } });
  if (!request) {
    const err = new Error('Khong tim thay don hoac don khong o trang thai pending');
    err.status = 404;
    throw err;
  }

  await request.update({
    status: 'rejected',
    approvedBy: adminId,
    approvedAt: new Date()
  });

  const student = await User.findByPk(request.studentId);
  if (student) {
    await sendEmail({
      userId: student.id,
      borrowRequestId: request.id,
      templateCode: 'request_rejected',
      toEmail: student.email,
      variables: {
        email: student.email,
        request_code: request.requestCode,
        reason: reason || 'Khong co ly do'
      }
    });
  }

  return request;
}

module.exports = {
  createBorrowRequest,
  listBorrowRequests,
  returnBorrowRequest,
  approveBorrowRequestService,
  rejectBorrowRequestService
};