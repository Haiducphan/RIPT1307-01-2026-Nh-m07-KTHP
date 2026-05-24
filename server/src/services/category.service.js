const Category = require('../models/category.model');

async function getAllCategories() {
  return Category.findAll({
    order: [['sort_order', 'ASC']]
  });
}

module.exports = { getAllCategories };