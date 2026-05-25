const sequelize = require('./database');

const User = require('../models/user.model');
const Student = require('../models/student.model');
const Category = require('../models/category.model');
const Equipment = require('../models/equipment.model');
const EquipmentImage = require('../models/equipmentImages.model');
const BorrowRequest = require('../models/borrowRequest.model');
const TrustScoreLog = require('../models/trustScoreLog.model');

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Ket noi Database thanh cong!');
    // Bỏ dùng {alter: true}
    await sequelize.sync(); 

    console.log('Sync toan bo Database thanh cong!');
  } catch (error) {
    console.error('Lỗi khi sync database:', error);
    throw error;
  }
}

module.exports = { syncDatabase };