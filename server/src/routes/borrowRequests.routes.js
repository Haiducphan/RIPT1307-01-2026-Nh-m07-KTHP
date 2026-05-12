const { Router } = require('express');
const {
  approveBorrowRequest,
  createBorrowRequest,
  getBorrowRequests,
  getMyBorrowRequests,
  markReturned,
  rejectBorrowRequest
} = require('../controllers/borrowRequests.controller');

const router = Router();

router.get('/', getBorrowRequests);
router.get('/my', getMyBorrowRequests);
router.post('/', createBorrowRequest);
router.patch('/:id/approve', approveBorrowRequest);
router.patch('/:id/reject', rejectBorrowRequest);
router.patch('/:id/return', markReturned);

module.exports = router;
