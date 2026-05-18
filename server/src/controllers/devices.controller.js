const { devices } = require('../models/mockData');

function getDevices(_req, res) {
  res.json(devices);
}

function getDeviceById(req, res) {
  const device = devices.find((item) => item.id === req.params.id);

  if (!device) {
    res.status(404).json({ message: 'Device not found' });
    return;
  }

  res.json(device);
}

function createDevice(req, res) {
  const totalQuantity = Number(req.body.totalQuantity || 0);
  const newDevice = {
    ...req.body,
    id: `d${Date.now()}`,
    totalQuantity,
    availableQuantity:
      req.body.availableQuantity !== undefined
        ? Number(req.body.availableQuantity)
        : totalQuantity
  };

  devices.unshift(newDevice);
  res.status(201).json(newDevice);
}

function updateDevice(req, res) {
  const index = devices.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ message: 'Device not found' });
    return;
  }

  const { id: _id, ...updates } = req.body;
  devices[index] = {
    ...devices[index],
    ...updates,
    totalQuantity:
      updates.totalQuantity !== undefined
        ? Number(updates.totalQuantity)
        : devices[index].totalQuantity
  };
  res.json(devices[index]);
}

function deleteDevice(req, res) {
  const index = devices.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ message: 'Device not found' });
    return;
  }

  devices.splice(index, 1);
  res.json({ success: true });
}

module.exports = {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice
};
