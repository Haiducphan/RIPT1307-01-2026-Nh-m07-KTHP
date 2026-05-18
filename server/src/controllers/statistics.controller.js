const { borrowRequests } = require('../models/mockData');
const deviceService = require('../services/device.service');

async function getTopBorrowedDevices(req, res) {
  try {
    const limit = Number(req.query.limit || 5);
    const counts = new Map();

    borrowRequests.forEach((item) => {
      if (item.status === 'returned' || item.status === 'borrowed') {
        counts.set(item.deviceId, (counts.get(item.deviceId) || 0) + item.quantity);
      }
    });

    const devices = await deviceService.listDevices();
    const data = devices
      .map((device) => ({
        deviceId: device.id,
        deviceName: device.name,
        borrowCount: counts.get(device.id) || 0
      }))
      .sort((a, b) => b.borrowCount - a.borrowCount)
      .slice(0, limit);

    res.json(data);
  } catch (error) {
    console.error('getTopBorrowedDevices error:', error.message);
    res.status(500).json({ message: 'Failed to load statistics' });
  }
}

module.exports = {
  getTopBorrowedDevices
};
