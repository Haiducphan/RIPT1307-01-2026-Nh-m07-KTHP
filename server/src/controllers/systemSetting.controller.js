const systemSettingService = require('../services/systemSetting.service');

// Lấy danh sách cấu hình
async function getSettings(req, res) {
  try {
    const settings = await systemSettingService.getAllSettings();
    return res.json({ message: 'Thành công', data: settings });
  } catch (error) {
    console.error('getSettings error:', error.message);
    return res.status(500).json({ message: 'Lỗi hệ thống khi tải cấu hình' });
  }
}

// Cập nhật cấu hình
async function updateSetting(req, res) {
  try {
    const { key } = req.params;
    const { settingValue } = req.body;
    const adminId = req.user.id;

    if (settingValue === undefined || settingValue === '') {
      return res.status(400).json({ message: 'Vui lòng cung cấp giá trị mới (settingValue)' });
    }

    const updatedSetting = await systemSettingService.updateSetting(key, settingValue, adminId);
    
    return res.json({ 
      message: 'Cập nhật cấu hình thành công', 
      data: updatedSetting 
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('updateSetting error:', error.message);
    return res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật cấu hình' });
  }
}

module.exports = { 
  getSettings, 
  updateSetting 
};