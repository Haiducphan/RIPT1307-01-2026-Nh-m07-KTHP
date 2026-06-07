const notificationService = require('../services/notification.service');

// Lấy danh sách thông báo
async function getMyNotifications(req, res) {
  try {
    const userId = req.user.id;
    const notifications = await notificationService.getUserNotifications(userId);
    res.json({ message: 'Success', data: notifications });
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thông báo' });
  }
}

// Đánh dấu thông báo đã đọc
async function markRead(req, res) {
  try {
    const userId = req.user.id;
    await notificationService.markAsRead(req.params.id, userId);
    res.json({ message: 'Đã đánh dấu đọc' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật thông báo' });
  }
}

module.exports = { getMyNotifications, markRead };