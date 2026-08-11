const router = require('express').Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');
const { protect } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

router.use(protect);
router.get('/', getCategories);
router.post('/', allowRoles('admin'), createCategory);
router.put('/:id', allowRoles('admin'), updateCategory);
router.delete('/:id', allowRoles('admin'), deleteCategory);

module.exports = router;
