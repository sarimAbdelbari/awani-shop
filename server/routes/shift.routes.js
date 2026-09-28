const router = require('express').Router();
const { getCurrent, listShifts, openShift, closeShift } = require('../controllers/shift.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/current', getCurrent);
router.get('/', listShifts);
router.post('/', openShift);
router.post('/:id/close', closeShift);

module.exports = router;
