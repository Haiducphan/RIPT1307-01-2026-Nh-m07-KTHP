const { Op } = require('sequelize');
const Equipment = require('../models/equipment.model');
const EquipmentImage = require('../models/equipmentImages.model');
const sequelize = require('../config/database'); 
const auditLogService = require('./auditLog.service'); // Tích hợp ghi log

// Lấy danh sách thiết bị
async function listEquipment({ tier, conditionStatus, page = 1, limit = 12, includeInactive = false } = {}) {
  const where = {};
  if (!includeInactive) where.isActive = true; 
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

// Lấy thiết bị theo ID
async function getEquipmentById(id, { includeDeleted = false } = {}) {
  const where = { id };
  if (!includeDeleted) where.isActive = true;

  return Equipment.findOne({ 
    where,
    include: ['images']
  });
}

// Tạo thiết bị mới kèm ảnh
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

    // Xử lý lưu ảnh
    if (files && files.length > 0) {
      const imageData = files.map((file, index) => ({
        equipmentId: equipment.id,
        imageUrl: `/uploads/equipment/${file.filename}`, 
        isPrimary: index === 0 ? true : false,
        sortOrder: index
      }));
      await EquipmentImage.bulkCreate(imageData, { transaction });
    }

    // Ghi Log lịch sử
    await auditLogService.logAdminAction({
      userId: payload.createdBy,
      action: 'create_equipment',
      entityType: 'equipment',
      entityId: equipment.id,
      newValue: { code: equipment.code, name: equipment.name, total: equipment.totalQuantity }
    }, transaction);

    await transaction.commit();

    return await Equipment.findByPk(equipment.id, { include: ['images'] });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// Cập nhật thiết bị
async function updateEquipment(id, payload, files, adminId) {
  const equipment = await Equipment.findOne({ where: { id, isActive: true } });
  if (!equipment) return null;

  const transaction = await sequelize.transaction();

  try {
    const oldData = { ...equipment.toJSON() };

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
      let idsToDelete = typeof payload.deletedImageIds === 'string' ? payload.deletedImageIds.split(',') : payload.deletedImageIds;
      if(idsToDelete.length > 0) {
        await EquipmentImage.destroy({ where: { id: idsToDelete, equipmentId: id }, transaction });
      }
    }

    await auditLogService.logAdminAction({
      userId: adminId,
      action: 'update_equipment',
      entityType: 'equipment',
      entityId: id,
      oldValue: { name: oldData.name, tier: oldData.tier },
      newValue: { name: equipment.name, tier: equipment.tier }
    }, transaction);

    await transaction.commit();
    return getEquipmentById(id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// Xoá mềm thiết bị
async function softDeleteEquipment(id, adminId) {
  const equipment = await Equipment.findOne({ where: { id, isActive: true } });
  if (!equipment) return null;
  
  await equipment.update({ isActive: false }); 

  await auditLogService.logAdminAction({
    userId: adminId,
    action: 'delete_equipment',
    entityType: 'equipment',
    entityId: id,
    oldValue: { isActive: true },
    newValue: { isActive: false }
  });

  return equipment;
}

// Cập nhật kho thủ công
async function updateStock(id, { totalQuantity }, adminId) {
  const equipment = await Equipment.findOne({ where: { id, isActive: true } });
  if (!equipment) throw { status: 404, message: 'Thiết bị không tồn tại' };
  if (totalQuantity !== undefined && totalQuantity < 0) throw { status: 400, message: 'Tổng số lượng không được âm' };

  if (totalQuantity !== undefined) {
    const currentBorrowing = equipment.borrowingQuantity || 0;
    const currentBroken = equipment.brokenQuantity || 0;
    const newAvailableQuantity = totalQuantity - currentBorrowing - currentBroken;

    if (newAvailableQuantity < 0) {
      throw { status: 400, message: `Không thể giảm vì đang có ${currentBorrowing} máy được mượn và ${currentBroken} máy hỏng.` };
    }

    const oldTotal = equipment.totalQuantity;
    await equipment.update({ totalQuantity, availableQuantity: newAvailableQuantity });

    await auditLogService.logAdminAction({
      userId: adminId,
      action: 'update_stock',
      entityType: 'equipment',
      entityId: id,
      oldValue: { totalQuantity: oldTotal },
      newValue: { totalQuantity }
    });
  }

  return equipment;
}

module.exports = {
  listEquipment, 
  getEquipmentById, 
  createEquipment, 
  updateEquipment, 
  softDeleteEquipment, 
  updateStock,
};