const equipmentService = require('../services/equipment.service');

// Lấy thiết bị
async function getDevices(req, res) {
  try {
    const includeInactive =
      req.user?.role === 'admin' && String(req.query.includeInactive) === 'true';

    const { tier, conditionStatus, page, limit } = req.query;

    const result = await equipmentService.listEquipment({
      tier,
      conditionStatus,
      page,
      limit,
      includeInactive
    });

    return res.json(result);
  } catch (error) {
    console.error('getDevices error:', error.message);
    return res.status(500).json({ message: 'Failed to load devices' });
  }
}

// Lấy thiết bị theo ID
async function getDeviceById(req, res) {
  try {
    const includeDeleted =
      req.user?.role === 'admin' && String(req.query.includeDeleted) === 'true';

    const equipment = await equipmentService.getEquipmentById(req.params.id, { includeDeleted });

    if (!equipment) {
      return res.status(404).json({ message: 'Device not found' });
    }

    return res.json(equipment);
  } catch (error) {
    console.error('getDeviceById error:', error.message);
    return res.status(500).json({ message: 'Failed to load device' });
  }
}

// Tạo thiết bị
async function createDevice(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }

    const payload = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const files = req.files || [];

    const equipment = await equipmentService.createEquipment(payload, files);
    
    return res.status(201).json(equipment);
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ message: error.message });
    }
    console.error('createDevice error:', error.message);
    return res.status(500).json({ message: 'Failed to create device' });
  }
}

// Cập nhật thiết bị
async function updateDevice(req, res) {
  try {
    const files = req.files || [];
    
    const equipment = await equipmentService.updateEquipment(req.params.id, req.body, files);

    if (!equipment) {
      return res.status(404).json({ message: 'Device not found' });
    }

    return res.json(equipment);
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ message: error.message });
    }
    console.error('updateDevice error:', error.message);
    return res.status(500).json({ message: 'Failed to update device' });
  }
}

// Xoá thiết bị
async function deleteDevice(req, res) {
  try {
    const equipment = await equipmentService.softDeleteEquipment(req.params.id);

    if (!equipment) {
      return res.status(404).json({ message: 'Device not found' });
    }

    return res.json({ success: true, device: equipment });
  } catch (error) {
    console.error('deleteDevice error:', error.message);
    return res.status(500).json({ message: 'Failed to delete device' });
  }
}

// Cập nhật số lượng trong kho
async function updateStock(req, res) {
  try {
    const { totalQuantity, availableQuantity } = req.body;

    if (totalQuantity === undefined && availableQuantity === undefined) {
      return res.status(400).json({ message: 'Can nhap totalQuantity hoac availableQuantity' });
    }

    const equipment = await equipmentService.updateStock(req.params.id, { totalQuantity, availableQuantity });
    return res.json(equipment);
  } catch (error) {
    if (error.status === 400 || error.status === 404) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error('updateStock error:', error.message);
    return res.status(500).json({ message: 'Failed to update stock' });
  }
}

module.exports = { getDevices, getDeviceById, createDevice, updateDevice, deleteDevice, updateStock };