const router = require('express').Router();
const { listAdjustments, createAdjustment } = require('../controllers/adjustment.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', listAdjustments);
router.post('/', createAdjustment);

module.exports = router;
