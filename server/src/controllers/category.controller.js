const categoryService = require('../services/category.service');

// Lấy danh mục
async function getCategories(req, res) {
  try {
    const categories = await categoryService.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tải danh mục' });
  }
}

// Tạo danh mục
async function createCategory(req, res) {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json({ message: 'Tạo danh mục thành công', category });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tạo danh mục', error: error.message });
  }
}

// Sửa danh mục
async function updateCategory(req, res) {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    res.json({ message: 'Cập nhật thành công', category });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi khi cập nhật danh mục' });
  }
}

// Xoá danh mục (danh mục không có thiết bị)
async function deleteCategory(req, res) {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.json({ message: 'Xoá danh mục thành công' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi khi xoá danh mục' });
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };