const Notification = require('../models/notification.model');

// Hàm tạo thông báo mới
async function createNotification(data, transaction = null) {
  return await Notification.create(data, { transaction });
}

// Lấy danh sách thông báo của 1 user
async function getUserNotifications(userId) {
  return await Notification.findAll({
    where: { userId },
    order: [['created_at', 'DESC']],
    limit: 20 // Tạm thời lấy 20 thông báo gần nhất cho nhẹ
  });
}

// Đánh dấu đã đọc
async function markAsRead(notificationId, userId) {
  return await Notification.update(
    { isRead: true, readAt: new Date() },
    { where: { id: notificationId, userId } }
  );
}

module.exports = { createNotification, getUserNotifications, markAsRead };