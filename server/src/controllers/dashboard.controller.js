const dashboardService = require('../services/dashboard.service');

// Hàm hỗ trợ lấy tháng/năm an toàn
const getMonthYear = (req) => {
  let targetMonth = parseInt(req.query.month);
  let targetYear = parseInt(req.query.year);

  if (isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12) {
    targetMonth = new Date().getMonth() + 1;
  }
  
  if (isNaN(targetYear) || targetYear < 2000) {
    targetYear = new Date().getFullYear();
  }

  return { targetMonth, targetYear };
};

// Lấy thống kê thiết bị
async function getDeviceStats(req, res) {
  try {
    const { targetMonth, targetYear } = getMonthYear(req);
    const data = await dashboardService.getDeviceStats(targetMonth, targetYear);
    res.json({ message: 'Success', data });
  } catch (error) {
    console.error('getDeviceStats Error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê thiết bị', error: error.message });
  }
}

// Lấy thống kê yêu cầu
async function getRequestStats(req, res) {
  try {
    const { targetMonth, targetYear } = getMonthYear(req);
    const data = await dashboardService.getRequestStats(targetMonth, targetYear);
    res.json({ message: 'Success', data });
  } catch (error) {
    console.error('getRequestStats Error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê yêu cầu', error: error.message });
  }
}

// Lấy thống kê sinh viên
async function getStudentStats(req, res) {
  try {
    const data = await dashboardService.getStudentStats();
    res.json({ message: 'Success', data });
  } catch (error) {
    console.error('getStudentStats Error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê sinh viên', error: error.message });
  }
}

// Lấy thống kê thời gian
async function getTimeStats(req, res) {
  try {
    const data = await dashboardService.getTimeStats();
    res.json({ message: 'Success', data });
  } catch (error) {
    console.error('getTimeStats Error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê thời gian', error: error.message });
  }
}

module.exports = {
  getDeviceStats, getRequestStats, getStudentStats, getTimeStats
};