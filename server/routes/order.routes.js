const router = require('express').Router();
const {
  getOrders,
  getOrder,
  createOrder,
  getStats,
} = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

router.use(protect);
router.get('/stats', allowRoles('admin'), getStats);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);

module.exports = router;
