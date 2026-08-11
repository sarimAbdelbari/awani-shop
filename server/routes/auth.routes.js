const router = require('express').Router();
const {
  login,
  setupAdmin,
  createUser,
  getUsers,
  deleteUser,
  getMe,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

router.post('/login', login);
router.post('/setup', setupAdmin);

router.use(protect);
router.get('/me', getMe);
router.get('/users', allowRoles('admin'), getUsers);
router.post('/users', allowRoles('admin'), createUser);
router.delete('/users/:id', allowRoles('admin'), deleteUser);

module.exports = router;
