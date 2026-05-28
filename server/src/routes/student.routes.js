const { Router } = require('express');
const { adjustTrustScore, lockBorrow, unlockBorrow } = require('../controllers/student.controller');
const { authenticateJWT, authorizeRole } = require('../middleware/auth.middleware');

const router = Router();

router.patch('/:id/trust-score', authenticateJWT, authorizeRole('admin'), adjustTrustScore);
router.patch('/:id/lock', authenticateJWT, authorizeRole('admin'), lockBorrow);
router.patch('/:id/unlock', authenticateJWT, authorizeRole('admin'), unlockBorrow);

module.exports = router;