const Category = require('../models/category.model');
const Equipment = require('../models/equipment.model');

// Lấy danh sách danh mục (cả Admin và Sinh viên)
async function getCategories() {
  return Category.findAll({ order: [['sortOrder', 'ASC']] }); 
}

// Thêm danh mục mới (Admin)
async function createCategory(data) {
  return Category.create(data);
}

// Cập nhật danh mục (Admin)
async function updateCategory(id, data) {
  const category = await Category.findByPk(id);
  if (!category) throw { status: 404, message: 'Không tìm thấy danh mục' };
  
  return category.update(data);
}

// Xoá danh mục (Admin)
async function deleteCategory(id) {
  const equipmentCount = await Equipment.count({ where: { categoryId: id } });
  if (equipmentCount > 0) {
    throw { status: 400, message: 'Không thể xoá! Đang có thiết bị thuộc danh mục này.' };
  }

  const category = await Category.findByPk(id);
  if (!category) throw { status: 404, message: 'Không tìm thấy danh mục' };

  await category.destroy();
  return { message: 'Xoá danh mục thành công' };
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };