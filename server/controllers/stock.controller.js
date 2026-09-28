const StockMovement = require('../models/StockMovement');
const { listPositions } = require('../services/on-hand');

const getMovements = async (req, res) => {
  try {
    const { product, type, from, to } = req.query;
    const filter = {};
    if (product) filter.product = product;
    if (type) filter.type = type;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    const movements = await StockMovement.find(filter)
      .populate('product', 'name code')
      .populate('supplier', 'fullName')
      .populate('lot', 'code name')
      .sort({ date: -1 })
      .limit(200);
    res.json(movements);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const getPositions = async (_req, res) => {
  try {
    const rows = await listPositions();
    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getMovements, getPositions };
