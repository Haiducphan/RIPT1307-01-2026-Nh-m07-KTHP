const { Router } = require('express');
const {
  createDevice,
  deleteDevice,
  getDeviceById,
  getDevices,
  updateDevice
} = require('../controllers/devices.controller');
const { authenticateJWT, authorizeRole } = require('../middleware/auth.middleware');

const router = Router();

router.get('/', getDevices);
router.get('/:id', getDeviceById);
router.post('/', authenticateJWT, authorizeRole('admin'), createDevice);
router.put('/:id', authenticateJWT, authorizeRole('admin'), updateDevice);
router.delete('/:id', authenticateJWT, authorizeRole('admin'), deleteDevice);

module.exports = router;
