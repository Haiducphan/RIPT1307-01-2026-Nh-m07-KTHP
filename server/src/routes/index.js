const { Router } = require('express');
const authRoutes = require('./auth.routes');
const borrowRequestRoutes = require('./borrowRequests.routes');
const deviceRoutes = require('./devices.routes');
const statisticRoutes = require('./statistics.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/devices', deviceRoutes);
router.use('/borrow-requests', borrowRequestRoutes);
router.use('/statistics', statisticRoutes);

module.exports = router;
