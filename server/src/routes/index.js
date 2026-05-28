const { Router } = require('express');
const authRoutes = require('./auth.routes');
const borrowRequestRoutes = require('./borrowRequests.routes');
const equipmentRoutes = require('./equipment.routes');
const statisticsRoutes = require('./statistics.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/borrow-requests', borrowRequestRoutes);
router.use('/statistics', statisticsRoutes);

module.exports = router;