const StockMovement = require('../models/StockMovement');
const Reception = require('../models/Reception');

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
      .sort({ date: -1 })
      .limit(200);
    res.json(movements);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const getPositions = async (_req, res) => {
  try {
    const rows = await Reception.aggregate([
      { $sort: { createdAt: 1 } },
      { $unwind: '$lines' },
      { $match: { 'lines.status': 'A' } },
      {
        $group: {
          _id: { product: '$lines.product', lot: '$lines.lot' },
          quantity: { $sum: '$lines.quantity' },
          lastBuyPrice: { $last: '$lines.buyPrice' },
          lastSellPrice: { $last: '$lines.sellPrice' },
          nearestExpiry: {
            $min: {
              $cond: [
                { $ne: ['$lines.expiryDate', null] },
                '$lines.expiryDate',
                null,
              ],
            },
          },
          lastReceptionAt: { $last: '$createdAt' },
          lastReceptionNumber: { $last: '$number' },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id.product',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $lookup: {
          from: 'lots',
          localField: '_id.lot',
          foreignField: '_id',
          as: 'lot',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$lot', preserveNullAndEmptyArrays: true } },
      { $sort: { 'product.name': 1, 'lot.name': 1 } },
    ]);

    res.json(
      rows.map((row) => ({
        product: row.product
          ? { _id: row.product._id, code: row.product.code, name: row.product.name }
          : null,
        lot: row.lot
          ? { _id: row.lot._id, code: row.lot.code, name: row.lot.name }
          : null,
        quantity: row.quantity,
        lastBuyPrice: row.lastBuyPrice,
        lastSellPrice: row.lastSellPrice,
        nearestExpiry: row.nearestExpiry,
        lastReceptionAt: row.lastReceptionAt,
        lastReceptionNumber: row.lastReceptionNumber,
      }))
    );
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getMovements, getPositions };
