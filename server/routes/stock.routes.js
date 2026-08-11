const router = require('express').Router();
const {
  getMovements,
  getLowStockAlerts,
  recordDelivery,
  recordManualAdjustment,
} = require('../controllers/stock.controller');
const { protect } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

router.use(protect);
router.get('/movements', getMovements);
router.get('/alerts', getLowStockAlerts);
router.post('/delivery', allowRoles('admin'), recordDelivery);
router.post('/adjust', allowRoles('admin'), recordManualAdjustment);

module.exports = router;
