const { Op } = require('sequelize');
const Equipment = require('../models/equipment.model');
const EquipmentImage = require('../models/equipmentImages.model');
const sequelize = require('../config/database'); // Cần để dùng Transaction

const fs = require('fs');
const path = require('path');

// Xử lý danh sách thiết bị
async function listEquipment({ tier, conditionStatus, page = 1, limit = 12, includeInactive = false } = {}) {
  const where = {};

  if (!includeInactive) {
    where.isActive = true; 
  }
  
  if (tier) where.tier = tier;
  if (conditionStatus) where.conditionStatus = conditionStatus;

  const offset = (page - 1) * limit;

  const { count, rows } = await Equipment.findAndCountAll({
    where,
    include: ['images'],
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

// Xử lý lấy thiết bị theo ID
async function getEquipmentById(id, { includeDeleted = false } = {}) {
  const where = { id };
  if (!includeDeleted) where.is_active = true; 
  return Equipment.findOne({ 
    where,
    include: ['images']
  });
}

// Xử lý tạo thiết bị
async function createEquipment(payload, files) {

  if (!payload.code || !payload.name || !payload.categoryId || !payload.tier) {
    const err = new Error('Thiếu trường bắt buộc: code, name, categoryId, tier');
    err.status = 400;
    throw err;
  }

  const transaction = await sequelize.transaction();

  try {
    const equipment = await Equipment.create({
      code: payload.code,
      name: payload.name,
      categoryId: payload.categoryId,
      tier: payload.tier,
      conditionStatus: payload.conditionStatus || 'good',
      totalQuantity: payload.totalQuantity || 0,
      availableQuantity: payload.totalQuantity || 0,
      borrowingQuantity: 0,
      brokenQuantity: 0,
      description: payload.description,
      createdBy: payload.createdBy
    }, { transaction });

    if (files && files.length > 0) {
      const imageData = files.map((file, index) => ({
        equipmentId: equipment.id,
        imageUrl: `/uploads/equipment/${file.filename}`, 
        isPrimary: index === 0 ? true : false,
        sortOrder: index
      }));

      await EquipmentImage.bulkCreate(imageData, { transaction });
    }

    await transaction.commit();

    return await Equipment.findByPk(equipment.id, {
      include: ['images']
    });

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// Xử lý cập nhật thiết bị
async function updateEquipment(id, payload, files) {
  const equipment = await Equipment.findOne({ where: { id, is_active: true } });
  if (!equipment) return null;

  const transaction = await sequelize.transaction();

  try {
    // Cập nhật thông tin chữ
    await equipment.update({
      code: payload.code !== undefined ? payload.code : equipment.code,
      name: payload.name !== undefined ? payload.name : equipment.name,
      categoryId: payload.categoryId !== undefined ? payload.categoryId : equipment.categoryId,
      tier: payload.tier !== undefined ? payload.tier : equipment.tier,
      conditionStatus: payload.conditionStatus !== undefined ? payload.conditionStatus : equipment.conditionStatus,
      description: payload.description !== undefined ? payload.description : equipment.description,
    }, { transaction });

    // Xử lý ảnh mới
    if (files && files.length > 0) {
      const currentImagesCount = await EquipmentImage.count({ where: { equipmentId: id }, transaction });

      const imageData = files.map((file, index) => ({
        equipmentId: id,
        imageUrl: `/uploads/equipment/${file.filename}`, 
        isPrimary: (currentImagesCount === 0 && index === 0) ? true : false, 
        sortOrder: currentImagesCount + index
      }));

      await EquipmentImage.bulkCreate(imageData, { transaction });
    }

    // Xử lý ảnh bị xóa
    if (payload.deletedImageIds) {
      let idsToDelete = typeof payload.deletedImageIds === 'string' 
                        ? payload.deletedImageIds.split(',') 
                        : payload.deletedImageIds;
      
      if(idsToDelete.length > 0) {
        await EquipmentImage.destroy({ 
            where: { id: idsToDelete, equipmentId: id }, 
            transaction 
        });
      }
    }

    await transaction.commit();
    return getEquipmentById(id);

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// Xử lý xoá thiết bị
async function softDeleteEquipment(id) {
  const equipment = await Equipment.findOne({ where: { id, isActive: true } });
  if (!equipment) return null;
  return equipment.update({ isActive: false }); 
}


// Xứ lý cập nhật số lượng thiết bị trong kho
async function updateStock(id, { totalQuantity, availableQuantity }) {
  const equipment = await Equipment.findOne({ where: { id, isActive: true } });
  
  if (!equipment) {
    const err = new Error('Thiết bị không tồn tại hoặc đã ngừng sử dụng');
    err.status = 404;
    throw err;
  }

  if (totalQuantity !== undefined && totalQuantity < 0) {
    const err = new Error('Tong so luong khong duoc am');
    err.status = 400;
    throw err;
  }

  if (availableQuantity !== undefined && availableQuantity < 0) {
    const err = new Error('So luong con lai khong duoc am');
    err.status = 400;
    throw err;
  }

  if (availableQuantity !== undefined && totalQuantity !== undefined && availableQuantity > totalQuantity) {
    const err = new Error('So luong con lai khong duoc lon hon tong so luong');
    err.status = 400;
    throw err;
  }

  await equipment.update({
    ...(totalQuantity !== undefined && { totalQuantity }),
    ...(availableQuantity !== undefined && { availableQuantity })
  });

  return equipment;
}


module.exports = {
  listEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  softDeleteEquipment,
  updateStock
};