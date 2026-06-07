const sequelize = require('./database');
const Device = require('../models/device.model');

const DEFAULT_DEVICES = [
  {
    name: 'May chieu',
    category: 'Thiet bi trinh chieu',
    totalQuantity: 5,
    status: 'available',
    description: 'Dung cho phong hoc va su kien cau lac bo'
  },
  {
    name: 'Micro khong day',
    category: 'Am thanh',
    totalQuantity: 10,
    status: 'available'
  },
  {
    name: 'Loa keo',
    category: 'Am thanh',
    totalQuantity: 2,
    status: 'available'
  }
];

async function syncDatabase() {
  await sequelize.authenticate();
  console.log(' Ket noi Database thanh cong!');

  await Device.sync({ alter: true });

  const count = await Device.count();
  if (count === 0) {
    await Device.bulkCreate(DEFAULT_DEVICES);
    console.log(' Seeded default devices');
  }
}

module.exports = { syncDatabase };
