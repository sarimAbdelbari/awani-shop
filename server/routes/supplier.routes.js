const router = require('express').Router();
const {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/supplier.controller');
const { protect } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

router.use(protect);
router.get('/', getSuppliers);
router.get('/:id', getSupplier);
router.post('/', allowRoles('admin'), createSupplier);
router.put('/:id', allowRoles('admin'), updateSupplier);
router.delete('/:id', allowRoles('admin'), deleteSupplier);

module.exports = router;
