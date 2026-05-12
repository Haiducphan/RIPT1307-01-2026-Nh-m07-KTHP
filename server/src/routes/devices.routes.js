const { Router } = require('express');
const {
  createDevice,
  deleteDevice,
  getDeviceById,
  getDevices,
  updateDevice
} = require('../controllers/devices.controller');

const router = Router();

router.get('/', getDevices);
router.get('/:id', getDeviceById);
router.post('/', createDevice);
router.put('/:id', updateDevice);
router.delete('/:id', deleteDevice);

module.exports = router;
