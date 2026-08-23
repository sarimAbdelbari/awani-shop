const router = require('express').Router();
const { getLots, createLot, updateLot, deleteLot } = require('../controllers/lot.controller');
const { protect } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

router.use(protect);
router.get('/', getLots);
router.post('/', allowRoles('admin'), createLot);
router.put('/:id', allowRoles('admin'), updateLot);
router.delete('/:id', allowRoles('admin'), deleteLot);

module.exports = router;
