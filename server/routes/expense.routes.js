const router = require('express').Router();
const {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expense.controller');
const { protect } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

router.use(protect);
router.get('/', listExpenses);
router.post('/', allowRoles('admin'), createExpense);
router.put('/:id', allowRoles('admin'), updateExpense);
router.delete('/:id', allowRoles('admin'), deleteExpense);

module.exports = router;
