const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');

router.get('/my', authenticateJWT, notificationController.getMyNotifications);
router.patch('/:id/read', authenticateJWT, notificationController.markRead);

module.exports = router;