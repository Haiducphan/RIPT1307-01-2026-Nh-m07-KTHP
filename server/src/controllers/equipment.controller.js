const equipmentService = require('../services/equipment.service');

// Lấy danh sách thiết bị
async function getDevices(req, res) {
  try {
    const includeInactive = req.user?.role === 'admin' && String(req.query.includeInactive) === 'true';
    const { tier, conditionStatus, page, limit } = req.query;
    const result = await equipmentService.listEquipment(
      { tier, conditionStatus, page, limit, includeInactive }
    );
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi tải danh sách thiết bị' });
  }
}

// Lấy chi tiết một thiết bị
async function getDeviceById(req, res) {
  try {
    const includeDeleted = req.user?.role === 'admin' && String(req.query.includeDeleted) === 'true';
    const equipment = await equipmentService.getEquipmentById(req.params.id, { includeDeleted });
    if (!equipment) return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    return res.json(equipment);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi tải chi tiết thiết bị' });
  }
}

// Thêm thiết bị mới
async function createDevice(req, res) {
  try {
    const files = req.files || [];
    const payload = {
      ...req.body,
      createdBy: req.user.id
    };

    const newEquipment = await equipmentService.createEquipment(payload, files);
    res.status(201).json({ message: 'Thêm thiết bị thành công', data: newEquipment });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('createDevice error:', error.message);
    res.status(500).json({ message: 'Lỗi khi tạo thiết bị mới' });
  }
}

// Sửa thông tin thiết bị (Bao gồm cả upload/xoá ảnh)
async function updateDevice(req, res) {
  try {
    const files = req.files || [];
    const equipment = await equipmentService.updateEquipment(req.params.id, req.body, files, req.user.id);
    if (!equipment) return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    return res.json({ message: 'Cập nhật thành công', data: equipment });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('updateDevice error:', error.message);
    return res.status(500).json({ message: 'Lỗi khi cập nhật thiết bị' });
  }
}

// Bật/Tắt trạng thái thiết bị
async function toggleStatus(req, res) {
  try {
    const toggled = await equipmentService.toggleEquipmentStatus(req.params.id, req.user.id);
    res.json({ message: `Đã ${toggled.isActive ? 'khôi phục' : 'ẩn'} thiết bị thành công`, data: toggled });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('toggleStatus error:', error.message);
    res.status(500).json({ message: 'Lỗi khi thay đổi trạng thái thiết bị' });
  }
}

// Xoá thiết bị (Dùng chung logic ẩn thiết bị)
async function deleteDevice(req, res) {
  try {
    const equipment = await equipmentService.softDeleteEquipment(req.params.id, req.user.id);
    if (!equipment) return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    return res.json({ success: true, message: 'Xóa (ẩn) thiết bị thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi xóa thiết bị' });
  }
}

// Cập nhật số lượng
async function updateStock(req, res) {
  try {
    const { totalQuantity } = req.body;
    if (totalQuantity === undefined) return res.status(400).json({ message: 'Cần nhập totalQuantity' });

    const equipment = await equipmentService.updateStock(req.params.id, { totalQuantity }, req.user.id);
    return res.json({ message: 'Cập nhật kho thành công', equipment });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: 'Lỗi khi cập nhật số lượng' });
  }
}

module.exports = {
  getDevices, getDeviceById, createDevice, updateDevice, deleteDevice, updateStock, toggleStatus
};