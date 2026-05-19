const { Op } = require('sequelize');
const Equipment = require('../models/equipment.models');

async function listEquipment({ tier, conditionStatus, page = 1, limit = 12, includeDeleted = false } = {}) {
  const where = {};

  if (!includeDeleted) where.isDeleted = false;
  if (tier) where.tier = tier;
  if (conditionStatus) where.conditionStatus = conditionStatus;

  const offset = (page - 1) * limit;

  const { count, rows } = await Equipment.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: Number(limit),
    offset
  });

  return {
    total: count,
    page: Number(page),
    totalPages: Math.ceil(count / limit),
    data: rows
  };
}

async function getEquipmentById(id, { includeDeleted = false } = {}) {
  const where = { id };
  if (!includeDeleted) where.isDeleted = false;
  return Equipment.findOne({ where });
}

async function createEquipment(payload) {
  const { code, name, categoryId, tier, conditionStatus, totalQuantity, description, createdBy } = payload;

  if (!code || !name || !categoryId || !tier) {
    const err = new Error('Thiếu trường bắt buộc: code, name, categoryId, tier');
    err.status = 400;
    throw err;
  }

  return Equipment.create({
    code,
    name,
    categoryId,
    tier,
    conditionStatus: conditionStatus || 'good',
    totalQuantity: totalQuantity || 0,
    availableQuantity: totalQuantity || 0,
    borrowingQuantity: 0,
    brokenQuantity: 0,
    description,
    createdBy
  });
}

async function updateEquipment(id, payload) {
  const equipment = await Equipment.findOne({ where: { id, isDeleted: false } });
  if (!equipment) return null;
  return equipment.update(payload);
}

async function softDeleteEquipment(id) {
  const equipment = await Equipment.findOne({ where: { id, isDeleted: false } });
  if (!equipment) return null;
  return equipment.update({ isDeleted: true });
}

module.exports = {
  listEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  softDeleteEquipment
};