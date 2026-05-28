const { Router } = require('express');
const authRoutes = require('./auth.routes');
const borrowRequestRoutes = require('./borrowRequests.routes');
const equipmentRoutes = require('./equipment.routes');
const statisticsRoutes = require('./statistics.routes');
const studentRoutes = require('./student.routes');


const router = Router();

router.use('/auth', authRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/borrow-requests', borrowRequestRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/students', studentRoutes);

module.exports = router;