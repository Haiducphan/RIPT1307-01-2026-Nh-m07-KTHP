const sequelize = require('./database');
const Equipment = require('../models/equipment.model');

async function syncDatabase() {
  await sequelize.authenticate();
  console.log('Ket noi Database thanh cong!');

  await Equipment.sync({ alter: true });
  console.log('Sync Equipment table thanh cong!');
}

module.exports = { syncDatabase };