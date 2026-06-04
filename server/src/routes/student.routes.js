const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { authenticateJWT, authorizeRole } = require('../middleware/auth.middleware');
const uploadAvatar = require('../middleware/uploadAvatar.middleware');


router.patch('/me/avatar', authenticateJWT, uploadAvatar.single('avatar'), studentController.updateMyAvatar);
router.get('/me/trust-score-logs', authenticateJWT, authorizeRole('student'), studentController.getMyTrustScoreLogs);
router.get('/', authenticateJWT, authorizeRole('admin'), studentController.getStudents);
router.get('/:id/trust-score-logs', authenticateJWT, authorizeRole('admin'), studentController.getTrustScoreLogs);
router.patch('/:id/restore-score', authenticateJWT, authorizeRole('admin'), studentController.restoreTrustScore);
router.patch('/:id/toggle-lock', authenticateJWT, authorizeRole('admin'), studentController.toggleManualLock);

module.exports = router;
