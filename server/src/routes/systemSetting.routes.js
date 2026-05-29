const express = require('express');
const router = express.Router();
const systemSettingController = require('../controllers/systemSetting.controller');
const { authenticateJWT, authorizeRole } = require('../middleware/auth.middleware');

router.use(authenticateJWT, authorizeRole('admin'));
router.get('/', systemSettingController.getSettings);
router.put('/:key', systemSettingController.updateSetting);

module.exports = router;