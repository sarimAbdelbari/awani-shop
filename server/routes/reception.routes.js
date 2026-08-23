const router = require('express').Router();
const {
  getReceptions,
  getReception,
  createReception,
  updateReception,
  deleteReception,
} = require('../controllers/reception.controller');
const { protect } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

router.use(protect);
router.get('/', allowRoles('admin'), getReceptions);
router.get('/:id', allowRoles('admin'), getReception);
router.post('/', allowRoles('admin'), createReception);
router.put('/:id', allowRoles('admin'), updateReception);
router.delete('/:id', allowRoles('admin'), deleteReception);

module.exports = router;
