const BorrowRequest = require('../models/borrowRequest.model');
const Equipment = require('../models/equipment.model');
const Student = require('../models/student.model');
const borrowRequestService = require('../services/borrowRequests.service'); 

// Lấy danh sách đơn mượn
async function getBorrowRequests(req, res) {
  try {
    const requests = await BorrowRequest.findAll({
      include: [{ model: Equipment, as: 'equipment' }],
      order: [['created_at', 'DESC']]
    });
    res.json(requests);
  } catch (error) {
    console.error('getBorrowRequests error:', error.message);
    res.status(500).json({ message: 'Lỗi khi tải danh sách đơn mượn' });
  }
}

// Lấy đơn mượn của tôi (sinh viên)
async function getMyBorrowRequests(req, res) {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ message: 'Unauthenticated' });

    const requests = await BorrowRequest.findAll({
      where: { studentId },
      include: [{ model: Equipment, as: 'equipment' }],
      order: [['created_at', 'DESC']]
    });
    res.json(requests);
  } catch (error) {
    console.error('getMyBorrowRequests error:', error.message);
    res.status(500).json({ message: 'Lỗi khi tải danh sách đơn của bạn' });
  }
}

// Tạo đơn mượn
async function createBorrowRequest(req, res) {
  try {
    const userId = req.user?.id;
    const { deviceId, quantity, borrowDate, returnDate, purpose } = req.body;

    const student = await Student.findOne({ where: { userId: userId } });
    if (!student) {
      return res.status(403).json({ message: 'Không tìm thấy hồ sơ sinh viên hợp lệ' });
    }

    const equipment = await Equipment.findOne({ where: { id: deviceId, isActive: true } });
    if (!equipment) {
      return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    }

    if (equipment.availableQuantity < (quantity || 1)) {
      return res.status(400).json({ message: 'Thiết bị không đủ số lượng sẵn có' });
    }

    const newRequest = await BorrowRequest.create({
      requestCode: `REQ-${Date.now()}`,
      studentId: student.id,
      equipmentId: equipment.id,
      quantity: quantity || 1,
      borrowDate,
      returnDate,
      purpose,
      status: 'pending' 
    });

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('createBorrowRequest error:', error.message);
    res.status(500).json({ message: 'Lỗi khi tạo đơn mượn' });
  }
}

// Xét duyệt đơn mượn
async function approveBorrowRequest(req, res) {
  try {
    const adminId = req.user.id;
    const request = await borrowRequestService.approveRequest(req.params.id, adminId);
    
    res.json({ message: 'Duyệt đơn thành công', request });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('approveBorrowRequest error:', error.message);
    res.status(500).json({ message: 'Lỗi server khi duyệt đơn' });
  }
}

// Từ chối đơn mượn
async function rejectBorrowRequest(req, res) {
  try {
    const adminId = req.user.id;
    const { reason } = req.body;
    
    const request = await borrowRequestService.rejectRequest(req.params.id, adminId, reason);
    
    res.json({ message: 'Đã từ chối đơn', request });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('rejectBorrowRequest error:', error.message);
    res.status(500).json({ message: 'Lỗi server khi từ chối đơn' });
  }
}

// Bàn giao thiết bị cho sinh viên
async function handoverBorrowRequest(req, res) {
  try {
    const adminId = req.user.id;
    // Gọi hàm handoverRequest từ Service
    const request = await borrowRequestService.handoverRequest(req.params.id, adminId);
    
    res.json({ message: 'Ghi nhận bàn giao thiết bị thành công', request });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('handoverBorrowRequest error:', error.message);
    res.status(500).json({ message: 'Lỗi server khi bàn giao thiết bị' });
  }
}

// Ghi nhận trả
async function markReturned(req, res) {
  try {
    const request = await BorrowRequest.findByPk(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy đơn mượn' });
    }

    await request.update({
      status: 'returned_ontime',
      actualReturnDate: new Date()
    });

    res.json({ message: 'Đã ghi nhận trả thiết bị', request });
  } catch (error) {
    console.error('markReturned error:', error.message);
    res.status(500).json({ message: 'Lỗi server khi ghi nhận trả' });
  }
}

module.exports = {
  getBorrowRequests,
  getMyBorrowRequests,
  createBorrowRequest,
  approveBorrowRequest,
  rejectBorrowRequest,
  handoverBorrowRequest,
  markReturned
};