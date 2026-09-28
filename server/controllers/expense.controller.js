const Expense = require('../models/Expense');
const { CATEGORIES } = require('../models/Expense');

function dateBound(value, edge) {
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split('-').map(Number);
    if (edge === 'start') return new Date(year, month - 1, day, 0, 0, 0, 0);
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDay(value) {
  const text = String(value || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const [year, month, day] = text.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function parseExpense(body) {
  const name = String(body.name || '').trim();
  const category = String(body.category || '');
  const amount = Number(body.amount);
  const date = parseDay(body.date);
  if (!name) {
    const err = new Error('Name is required');
    err.status = 400;
    throw err;
  }
  if (!CATEGORIES.includes(category)) {
    const err = new Error('Invalid category');
    err.status = 400;
    throw err;
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    const err = new Error('Amount must be greater than 0');
    err.status = 400;
    throw err;
  }
  if (!date) {
    const err = new Error('Date is required');
    err.status = 400;
    throw err;
  }
  return {
    name,
    category,
    amount: Math.round(amount * 100) / 100,
    date,
    note: String(body.note || '').trim(),
  };
}

const listExpenses = async (req, res) => {
  try {
    const filter = {};
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) {
        const start = dateBound(req.query.from, 'start');
        if (start) filter.date.$gte = start;
      }
      if (req.query.to) {
        const end = dateBound(req.query.to, 'end');
        if (end) filter.date.$lte = end;
      }
    }
    const rows = await Expense.find(filter)
      .populate('createdBy', 'name')
      .sort({ date: -1, createdAt: -1 });
    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const createExpense = async (req, res) => {
  try {
    const payload = parseExpense(req.body);
    const expense = await Expense.create({ ...payload, createdBy: req.user.id });
    const populated = await Expense.findById(expense._id).populate('createdBy', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(err.status || 400).json({ message: err.message || 'Server error' });
  }
};

const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    const payload = parseExpense({
      name: req.body.name ?? expense.name,
      category: req.body.category ?? expense.category,
      amount: req.body.amount ?? expense.amount,
      date: req.body.date ?? toDayString(expense.date),
      note: req.body.note ?? expense.note,
    });
    Object.assign(expense, payload);
    await expense.save();
    const populated = await Expense.findById(expense._id).populate('createdBy', 'name');
    res.json(populated);
  } catch (err) {
    res.status(err.status || 400).json({ message: err.message || 'Server error' });
  }
};

function toDayString(date) {
  const value = new Date(date);
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}

const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { listExpenses, createExpense, updateExpense, deleteExpense };
