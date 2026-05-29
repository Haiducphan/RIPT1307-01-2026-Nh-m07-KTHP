const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { authenticateJWT, authorizeRole } = require('../middleware/auth.middleware');

router.get('/', authenticateJWT, categoryController.getCategories);
router.post('/', authenticateJWT, authorizeRole('admin'), categoryController.createCategory);
router.put('/:id', authenticateJWT, authorizeRole('admin'), categoryController.updateCategory);
router.delete('/:id', authenticateJWT, authorizeRole('admin'), categoryController.deleteCategory);

module.exports = router;