const { Router } = require('express');
const {
  approveBorrowRequest,
  createBorrowRequest,
  getBorrowRequests,
  getMyBorrowRequests,
  markReturned,
  handoverBorrowRequest,
  rejectBorrowRequest
} = require('../controllers/borrowRequests.controller');
const { authenticateJWT, authorizeRole } = require('../middleware/auth.middleware');

const router = Router();

router.get('/', authenticateJWT, authorizeRole('admin'), getBorrowRequests);
router.get('/my', authenticateJWT, authorizeRole('student'), getMyBorrowRequests);
router.post('/', authenticateJWT, authorizeRole('student'), createBorrowRequest);
router.patch('/:id/approve', authenticateJWT, authorizeRole('admin'), approveBorrowRequest);
router.patch('/:id/reject', authenticateJWT, authorizeRole('admin'), rejectBorrowRequest);
router.patch('/:id/handover', authenticateJWT, authorizeRole('admin'), handoverBorrowRequest);
router.patch('/:id/return', authenticateJWT, authorizeRole('admin'), markReturned);

module.exports = router;
