const router = require('express').Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');
const { protect } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

router.use(protect);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', allowRoles('admin'), createProduct);
router.put('/:id', allowRoles('admin'), updateProduct);
router.delete('/:id', allowRoles('admin'), deleteProduct);

module.exports = router;
