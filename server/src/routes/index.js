const { Router } = require('express');
const authRoutes = require('./auth.routes');
const borrowRequestRoutes = require('./borrowRequests.routes');
const equipmentRoutes = require('./equipment.routes');
const categoryRoutes = require('./category.routes');
const dashboardRoutes = require('./dashboard.routes');
const studentRoutes = require('./student.routes');
const notificationRoutes = require('./notification.routes');
const systemSettingRoutes = require('./systemSetting.routes');
const emailTemplateRoutes = require('./emailTemplate.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/borrow-requests', borrowRequestRoutes);
router.use('/categories', categoryRoutes);
router.use('/stats', dashboardRoutes);
router.use('/students', studentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', systemSettingRoutes);
router.use('/email-templates', emailTemplateRoutes);

// Test thử Cronjob
const { runDailyTasks } = require('../services/cron.service');
const { authenticateJWT, authorizeRole } = require('../middleware/auth.middleware');

// API Ẩn: Ép chạy Cronjob quét quá hạn
router.post('/test/run-cron-overdue', authenticateJWT, authorizeRole('admin'), async (req, res) => {
  try {
    // Chạy hàm quét mà không cần đợi lịch
    await runDailyTasks(); 
    res.json({ message: 'Đã kích hoạt quét đơn quá hạn thành công! Vui lòng kiểm tra Terminal hoặc Database.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi chạy Cronjob' });
  }
});
// Hết test

module.exports = router;
