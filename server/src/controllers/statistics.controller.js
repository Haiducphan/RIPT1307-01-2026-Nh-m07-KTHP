const { borrowRequests, devices } = require('../models/mockData');

function getTopBorrowedDevices(req, res) {
  const month = req.query.month;
  const counts = new Map();

  borrowRequests
    .filter((item) => !month || item.borrowDate?.startsWith(month))
    .forEach((item) => {
      counts.set(item.deviceId, (counts.get(item.deviceId) || 0) + item.quantity);
    });

  const data = devices
    .map((device) => ({
      deviceId: device.id,
      deviceName: device.name,
      borrowCount: counts.get(device.id) || 0
    }))
    .sort((a, b) => b.borrowCount - a.borrowCount);

  res.json(data);
}

module.exports = {
  getTopBorrowedDevices
};
