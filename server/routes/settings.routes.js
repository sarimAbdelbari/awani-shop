const router = require('express').Router();
const { getSettings, updateSettings } = require('../controllers/settings.controller');
const { protect } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

router.use(protect);
router.get('/', getSettings);
router.put('/', allowRoles('admin'), updateSettings);

module.exports = router;
