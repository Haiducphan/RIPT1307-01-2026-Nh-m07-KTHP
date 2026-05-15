const { Router } = require('express');
const { login, me } = require('../controllers/auth.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');

const router = Router();

router.post('/login', login);
router.get('/me', authenticateJWT, me);

module.exports = router;
