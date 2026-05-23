const { borrowRequests } = require('../models/mockData');
const equipmentService = require('../services/equipment.service');

function getBorrowRequests(_req, res) {
  res.json(borrowRequests);
}

function getMyBorrowRequests(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthenticated' });
  res.json(borrowRequests.filter((item) => String(item.studentId) === String(userId)));
}

async function createBorrowRequest(req, res) {
  try {
    const equipment = await equipmentService.getEquipmentById(req.body.deviceId);
    if (!equipment) {
      return res.status(404).json({ message: 'Device not found' });
    }

    if (equipment.availableQuantity < 1) {
      return res.status(400).json({ message: 'Device is not available for borrowing' });
    }

    const userId = req.user?.id || 'u1';
    const userName = req.user?.fullName || 'Nguyen Van A';

    const newRequest = {
      id: `br${Date.now()}`,
      studentId: String(userId),
      studentName: userName,
      deviceId: equipment.id,
      deviceName: equipment.name,
      quantity: Number(req.body.quantity || 1),
      borrowDate: req.body.borrowDate,
      returnDate: req.body.returnDate,
      status: 'pending',
      note: req.body.note
    };

    borrowRequests.unshift(newRequest);
    res.status(201).json(newRequest);
  } catch (error) {
    console.error('createBorrowRequest error:', error.message);
    res.status(500).json({ message: 'Failed to create borrow request' });
  }
}

async function approveBorrowRequest(req, res) {
  try {
    const request = borrowRequests.find((item) => item.id === req.params.id);

    if (!request) {
      res.status(404).json({ message: 'Borrow request not found' });
      return;
    }

    const equipment = await equipmentService.getEquipmentById(request.deviceId);
    if (!equipment) {
      res.status(404).json({ message: 'Device not found' });
      return;
    }

    if (equipment.availableQuantity < request.quantity) {
      res.status(400).json({ message: 'Not enough device quantity' });
      return;
    }

    request.status = 'borrowed';
    res.json(request);
  } catch (error) {
    console.error('approveBorrowRequest error:', error.message);
    res.status(500).json({ message: 'Failed to approve borrow request' });
  }
}

function rejectBorrowRequest(req, res) {
  const request = borrowRequests.find((item) => item.id === req.params.id);

  if (!request) {
    res.status(404).json({ message: 'Borrow request not found' });
    return;
  }

  request.status = 'rejected';
  res.json(request);
}

function markReturned(req, res) {
  const request = borrowRequests.find((item) => item.id === req.params.id);

  if (!request) {
    res.status(404).json({ message: 'Borrow request not found' });
    return;
  }

  request.status = 'returned';
  request.actualReturnDate = new Date().toISOString().slice(0, 10);
  res.json(request);
}

module.exports = {
  getBorrowRequests,
  getMyBorrowRequests,
  createBorrowRequest,
  approveBorrowRequest,
  rejectBorrowRequest,
  markReturned
};