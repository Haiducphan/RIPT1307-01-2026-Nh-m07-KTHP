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
  const newDevice = {
    ...req.body,
    id: `d${Date.now()}`
  };

  devices.unshift(newDevice);
  res.json(newDevice);
}

function updateDevice(req, res) {
  const index = devices.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ message: 'Device not found' });
    return;
  }

  devices[index] = {
    ...devices[index],
    ...req.body
  };
  res.json(devices[index]);
}

function deleteDevice(req, res) {
  const index = devices.findIndex((item) => item.id === req.params.id);

  if (index >= 0) {
    devices.splice(index, 1);
  }

  res.json({ success: true });
}

module.exports = {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice
};
