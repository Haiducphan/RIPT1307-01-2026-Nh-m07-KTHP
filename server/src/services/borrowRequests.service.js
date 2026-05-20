const { Op } = require('sequelize');
const BorrowRequest = require('../models/borrowRequest.models');
const Equipment = require('../models/equipment.models');
const User = require('../models/user.models');

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

async function listBorrowRequests({ studentId, status, page = 1, limit = 20 } = {}) {
  const where = {};
  if (studentId) where.studentId = studentId;
  if (status) where.status = status;

  const offset = (page - 1) * limit;
  const { count, rows } = await BorrowRequest.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: Number(limit),
    offset
  });

  return { total: count, page: Number(page), totalPages: Math.ceil(count / limit), data: rows };
}

module.exports = { createBorrowRequest, listBorrowRequests };