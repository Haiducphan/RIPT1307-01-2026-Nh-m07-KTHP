const { Router } = require('express');
const authRoutes = require('./auth.routes');
const borrowRequestRoutes = require('./borrowRequests.routes');
const equipmentRoutes = require('./equipment.routes');
const statisticsRoutes = require('./statistics.routes');
const { sendReturnReminders, sendOverdueWarnings } = require('../services/emailScheduler.service');

const router = Router();

router.use('/auth', authRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/borrow-requests', borrowRequestRoutes);
router.use('/statistics', statisticsRoutes);

router.get('/test/reminder', async (req, res) => {
  await sendReturnReminders();
  res.json({ message: 'done' });
});

router.get('/test/overdue', async (req, res) => {
  await sendOverdueWarnings();
  res.json({ message: 'done' });
});

module.exports = router;