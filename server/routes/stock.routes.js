const router = require('express').Router();
const { getMovements, getPositions } = require('../controllers/stock.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/movements', getMovements);
router.get('/positions', getPositions);

module.exports = router;
