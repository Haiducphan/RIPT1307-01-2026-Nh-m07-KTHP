const { Router } = require('express');
const {
  createDevice,
  deleteDevice,
  getDeviceById,
  getDevices,
  updateDevice
} = require('../controllers/equipment.controller');
const {
  authenticateJWT,
  authorizeRole,
  optionalAuthenticateJWT
} = require('../middleware/auth.middleware');

const router = Router();

router.get('/', optionalAuthenticateJWT, getDevices);
router.get('/:id', optionalAuthenticateJWT, getDeviceById);
router.post('/', authenticateJWT, authorizeRole('admin'), createDevice);
router.put('/:id', authenticateJWT, authorizeRole('admin'), updateDevice);
router.delete('/:id', authenticateJWT, authorizeRole('admin'), deleteDevice);

module.exports = router;
