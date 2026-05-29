const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticateJWT, authorizeRole } = require('../middleware/auth.middleware');

router.use(authenticateJWT, authorizeRole('admin'));

router.get('/devices', dashboardController.getDeviceStats);
router.get('/requests', dashboardController.getRequestStats);
router.get('/students', dashboardController.getStudentStats);
router.get('/time-trend', dashboardController.getTimeStats);

module.exports = router;