const express = require('express');
const router = express.Router();
const emailTemplateController = require('../controllers/emailTemplate.controller');
const { authenticateJWT, authorizeRole } = require('../middleware/auth.middleware');

router.use(authenticateJWT, authorizeRole('admin'));

router.get('/', emailTemplateController.getTemplates);
router.get('/:id', emailTemplateController.getTemplateById);
router.put('/:id', emailTemplateController.updateTemplate);

module.exports = router;