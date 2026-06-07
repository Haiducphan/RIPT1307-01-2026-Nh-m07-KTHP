const sequelize = require('./database');
const Equipment = require('../models/equipment.models');

async function syncDatabase() {
  await sequelize.authenticate();
  console.log('Ket noi Database thanh cong!');

}

module.exports = { syncDatabase };