const borrowRequestService = require('../services/borrowRequests.service');

async function getBorrowRequests(req, res) {
  try {
    const { status, page, limit } = req.query;
    const result = await borrowRequestService.listBorrowRequests({ status, page, limit });
    res.json(result);
  } catch (error) {
    console.error('getBorrowRequests error:', error.message);
    res.status(500).json({ message: 'Failed to load borrow requests' });
  }
}

async function getMyBorrowRequests(req, res) {
  try {
    const { status, page, limit } = req.query;
    const result = await borrowRequestService.listBorrowRequests({
      studentId: req.user.id,
      status,
      page,
      limit
    });
    res.json(result);
  } catch (error) {
    console.error('getMyBorrowRequests error:', error.message);
    res.status(500).json({ message: 'Failed to load borrow requests' });
  }
}

async function createBorrowRequest(req, res) {
  try {
    const { equipmentId, quantity, borrowDate, returnDate, purpose, eventName } = req.body;

    if (!equipmentId || !borrowDate || !returnDate) {
      return res.status(400).json({ message: 'Thieu truong bat buoc: equipmentId, borrowDate, returnDate' });
    }

    const request = await borrowRequestService.createBorrowRequest({
      studentId: req.user.id,
      equipmentId,
      quantity: Number(quantity || 1),
      borrowDate,
      returnDate,
      purpose,
      eventName
    });

    res.status(201).json(request);
  } catch (error) {
    if (error.status === 400 || error.status === 403 || error.status === 404) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error('createBorrowRequest error:', error.message);
    res.status(500).json({ message: 'Failed to create borrow request' });
  }
}

async function approveBorrowRequest(req, res) {
  res.status(501).json({ message: 'Chua implement' });
}

async function rejectBorrowRequest(req, res) {
  res.status(501).json({ message: 'Chua implement' });
}

async function markReturned(req, res) {
  res.status(501).json({ message: 'Chua implement' });
}

module.exports = {
  getBorrowRequests,
  getMyBorrowRequests,
  createBorrowRequest,
  approveBorrowRequest,
  rejectBorrowRequest,
  markReturned
};