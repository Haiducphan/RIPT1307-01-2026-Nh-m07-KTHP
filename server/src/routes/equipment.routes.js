const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipment.controller');
const { authenticateJWT, authorizeRole, optionalAuthenticateJWT } = require('../middleware/auth.middleware');
const uploadEquipmentImages = require('../middleware/upload.middleware');

router.get('/', optionalAuthenticateJWT, equipmentController.getDevices);
router.get('/:id', optionalAuthenticateJWT, equipmentController.getDeviceById);
router.post('/', authenticateJWT, authorizeRole('admin'), uploadEquipmentImages.array('images', 5), equipmentController.createDevice);
router.delete('/:id', authenticateJWT, authorizeRole('admin'), equipmentController.deleteDevice);
router.patch('/:id/stock', authenticateJWT, authorizeRole('admin'), equipmentController.updateStock);
router.patch('/:id/toggle-status', equipmentController.toggleStatus);

module.exports = router;