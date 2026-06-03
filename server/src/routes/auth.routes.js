const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');
const uploadAvatar = require('../middleware/uploadAvatar.middleware');

// Public routes (Không cần token)
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
// Private route (Cần token)
router.get('/me', authenticateJWT, authController.me);
router.patch('/me/avatar', authenticateJWT, uploadAvatar.single('avatar'), authController.updateMyAvatar);

module.exports = router;
