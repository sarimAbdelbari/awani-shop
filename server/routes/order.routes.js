const router = require('express').Router();
const {
  getOrders,
  getOrder,
  createOrder,
  getStats,
} = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/stats', getStats);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);

module.exports = router;
