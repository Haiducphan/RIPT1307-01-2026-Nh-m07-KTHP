const studentService = require('../services/student.service');

// Phục hồi / Cộng (hoặc Trừ) điểm uy tín thủ công
async function restoreTrustScore(req, res) {
  try {
    const studentId = req.params.id;
    const { pointsToAdd, reason } = req.body;
    const adminId = req.user.id;

    if (pointsToAdd === undefined || isNaN(parseInt(pointsToAdd))) {
      return res.status(400).json({ message: 'Vui lòng nhập số điểm hợp lệ (pointsToAdd)' });
    }

    const result = await studentService.restoreTrustScoreService(
      studentId, 
      parseInt(pointsToAdd), 
      reason, 
      adminId
    );

    return res.json({ 
      message: 'Cập nhật điểm uy tín sinh viên thành công', 
      newScore: result.newScore, 
      newRank: result.newRank 
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('restoreTrustScore error:', error.message);
    return res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật điểm uy tín' });
  }
}

// Khoá / Mở khoá mượn đồ thủ công
async function toggleManualLock(req, res) {
  try {
    const studentId = req.params.id;
    const { isLocked, lockDays, isPermanent, reason } = req.body;

    if (isLocked === undefined) {
      return res.status(400).json({ message: 'Vui lòng cung cấp trạng thái đóng/mở khoá (isLocked)' });
    }

    const updatedStudent = await studentService.toggleManualLockService(studentId, { 
      isLocked, 
      lockDays, 
      isPermanent, 
      reason 
    });
    
    const successMessage = isLocked === false 
      ? 'Đã mở khoá tính năng mượn đồ thành công' 
      : 'Đã khoá tính năng mượn đồ thành công';

    return res.json({ message: successMessage, student: updatedStudent });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('toggleManualLock error:', error.message);
    return res.status(500).json({ message: 'Lỗi hệ thống khi xử lý khoá tài khoản' });
  }
}

// Lấy danh sách sinh viên
async function getStudents(req, res) {
  try {
    const { page, limit, search } = req.query;
    const result = await studentService.getStudentsService({ page, limit, search });
    return res.json(result);
  } catch (error) {
    console.error('getStudents error:', error.message);
    return res.status(500).json({ message: 'Lỗi hệ thống khi tải danh sách sinh viên' });
  }
}

// Xem chi tiết lịch sử điểm uy tín
async function getTrustScoreLogs(req, res) {
  try {
    const studentId = req.params.id;
    const logs = await studentService.getTrustScoreLogsService(studentId);
    return res.json({ message: 'Thành công', data: logs });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('getTrustScoreLogs error:', error.message);
    return res.status(500).json({ message: 'Lỗi hệ thống khi tải lịch sử điểm' });
  }
}

// Sinh viên xem lịch sử biến động điểm uy tín của chính mình
async function getMyTrustScoreLogs(req, res) {
  try {
    const logs = await studentService.getMyTrustScoreLogsService(req.user.id);
    return res.json({ message: 'Thành công', data: logs });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('getMyTrustScoreLogs error:', error.message);
    return res.status(500).json({ message: 'Lỗi hệ thống khi tải lịch sử điểm' });
  }
}

// Cập nhật ảnh đại diện cho sinh viên
async function updateMyAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn một bức ảnh để tải lên' });
    }

    const fileUrl = `/uploads/avatars/${req.file.filename}`;
    const userId = req.user.id;

    const updatedStudent = await studentService.updateAvatarService(userId, fileUrl);
    
    return res.json({ 
      message: 'Cập nhật ảnh đại diện thành công', 
      avatarUrl: updatedStudent.avatarUrl 
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('Lỗi cập nhật avatar:', error.message);
    return res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật ảnh đại diện' });
  }
}

module.exports = { 
  restoreTrustScore, 
  toggleManualLock,
  getStudents,
  getTrustScoreLogs,
  getMyTrustScoreLogs,
  updateMyAvatar, 
};
