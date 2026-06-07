const { Router } = require('express');
const borrowReQuestController = require('../controllers/borrowRequests.controller');
const { authenticateJWT, authorizeRole } = require('../middleware/auth.middleware');

const router = Router();

router.get('/', authenticateJWT, authorizeRole('admin'), borrowReQuestController.getBorrowRequests);
router.get('/my', authenticateJWT, authorizeRole('student'), borrowReQuestController.getMyBorrowRequests);
router.post('/', authenticateJWT, authorizeRole('student'), borrowReQuestController.createBorrowRequest);
router.get('/overdue', authenticateJWT, authorizeRole('admin'), borrowReQuestController.getOverdueRequests);
router.patch('/:id/approve', authenticateJWT, authorizeRole('admin'), borrowReQuestController.approveBorrowRequest);
router.patch('/:id/reject', authenticateJWT, authorizeRole('admin'), borrowReQuestController.rejectBorrowRequest);
router.patch('/:id/handover', authenticateJWT, authorizeRole('admin'), borrowReQuestController.handoverBorrowRequest);
router.patch('/:id/return', authenticateJWT, authorizeRole('admin'), borrowReQuestController.markReturned);
router.patch('/:id/cancel', authenticateJWT, authorizeRole('student'), borrowReQuestController.cancelBorrowRequest);

module.exports = router;
