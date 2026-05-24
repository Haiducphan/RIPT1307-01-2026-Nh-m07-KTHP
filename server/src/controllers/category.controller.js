const categoryService = require('../services/category.service');

// API lấy danh mục
async function getCategories(req, res) {
  try {
    const categories = await categoryService.getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error('getCategories error:', error.message);
    res.status(500).json({ message: 'Lỗi khi tải danh mục' });
  }
}

module.exports = { getCategories };