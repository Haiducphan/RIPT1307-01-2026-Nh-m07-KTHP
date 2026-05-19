const equipmentService = require('../services/equipment.service');

async function getDevices(req, res) {
  try {
    const includeDeleted =
      req.user?.role === 'admin' && String(req.query.includeDeleted) === 'true';

    const { tier, conditionStatus, page, limit } = req.query;

    const result = await equipmentService.listEquipment({
      tier,
      conditionStatus,
      page,
      limit,
      includeDeleted
    });

    res.json(result);
  } catch (error) {
    console.error('getDevices error:', error.message);
    res.status(500).json({ message: 'Failed to load devices' });
  }
}

async function getDeviceById(req, res) {
  try {
    const includeDeleted =
      req.user?.role === 'admin' && String(req.query.includeDeleted) === 'true';

    const equipment = await equipmentService.getEquipmentById(req.params.id, { includeDeleted });

    if (!equipment) {
      res.status(404).json({ message: 'Device not found' });
      return;
    }

    res.json(equipment);
  } catch (error) {
    console.error('getDeviceById error:', error.message);
    res.status(500).json({ message: 'Failed to load device' });
  }
}

async function createDevice(req, res) {
  try {
    const equipment = await equipmentService.createEquipment({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json(equipment);
  } catch (error) {
    if (error.status === 400) {
      res.status(400).json({ message: error.message });
      return;
    }
    console.error('createDevice error:', error.message);
    res.status(500).json({ message: 'Failed to create device' });
  }
}

async function updateDevice(req, res) {
  try {
    const equipment = await equipmentService.updateEquipment(req.params.id, req.body || {});

    if (!equipment) {
      res.status(404).json({ message: 'Device not found' });
      return;
    }

    res.json(equipment);
  } catch (error) {
    if (error.status === 400) {
      res.status(400).json({ message: error.message });
      return;
    }
    console.error('updateDevice error:', error.message);
    res.status(500).json({ message: 'Failed to update device' });
  }
}

async function deleteDevice(req, res) {
  try {
    const equipment = await equipmentService.softDeleteEquipment(req.params.id);

    if (!equipment) {
      res.status(404).json({ message: 'Device not found' });
      return;
    }

    res.json({ success: true, device: equipment });
  } catch (error) {
    console.error('deleteDevice error:', error.message);
    res.status(500).json({ message: 'Failed to delete device' });
  }
}

module.exports = { getDevices, getDeviceById, createDevice, updateDevice, deleteDevice };