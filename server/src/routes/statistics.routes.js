const { Router } = require('express');
const { getTopBorrowedDevices } = require('../controllers/statistics.controller');

const router = Router();

router.get('/top-devices', getTopBorrowedDevices);

module.exports = router;
