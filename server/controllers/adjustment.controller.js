const StockAdjustment = require('../models/StockAdjustment');
const StockMovement = require('../models/StockMovement');
const { listPositions, pileKey } = require('../services/on-hand');

const POPULATE = [
  { path: 'product', select: 'code name' },
  { path: 'lot', select: 'code name' },
  { path: 'supplier', select: 'fullName' },
  { path: 'createdBy', select: 'name' },
];

const listAdjustments = async (_req, res) => {
  try {
    const rows = await StockAdjustment.find().populate(POPULATE).sort({ createdAt: -1 }).limit(200);
    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const createAdjustment = async (req, res) => {
  try {
    const reason = String(req.body.reason || '');
    const observation = String(req.body.observation || '').trim();
    const productId = req.body.productId;
    const lotId = req.body.lotId;
    const supplierId = req.body.supplierId;
    const buyPrice = Number(req.body.buyPrice);
    const sellPrice = Number(req.body.sellPrice);

    if (!['casse', 'perte', 'inventaire'].includes(reason)) {
      return res.status(400).json({ message: 'Reason must be casse, perte, or inventaire' });
    }
    if (!productId || !lotId || !supplierId) {
      return res.status(400).json({ message: 'Product, lot, and supplier are required' });
    }
    if (!Number.isFinite(buyPrice) || buyPrice < 0 || !Number.isFinite(sellPrice) || sellPrice < 0) {
      return res.status(400).json({ message: 'Buy and sell price are required' });
    }

    const positions = await listPositions();
    const pile = positions.find(
      (row) =>
        pileKey(row.product._id, row.lot._id, row.supplier._id, row.lastBuyPrice, row.lastSellPrice) ===
        pileKey(productId, lotId, supplierId, buyPrice, sellPrice)
    );
    if (!pile) return res.status(400).json({ message: 'Pile not found' });

    let direction = 'out';
    let quantity = 0;
    if (reason === 'inventaire') {
      const counted = Number(req.body.countedQty);
      if (!Number.isInteger(counted) || counted < 0) {
        return res.status(400).json({ message: 'Counted quantity must be a whole number of 0 or more' });
      }
      const delta = counted - pile.quantity;
      if (delta === 0) {
        return res.status(400).json({ message: 'Counted quantity matches on-hand' });
      }
      direction = delta > 0 ? 'in' : 'out';
      quantity = Math.abs(delta);
    } else {
      quantity = Number(req.body.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: 'Quantity must be a whole number of at least 1' });
      }
      if (quantity > pile.quantity) {
        return res.status(400).json({
          message: `Insufficient stock. Available: ${pile.quantity}`,
        });
      }
    }

    const adjustment = await StockAdjustment.create({
      product: productId,
      lot: lotId,
      supplier: supplierId,
      buyPrice: pile.lastBuyPrice,
      sellPrice: pile.lastSellPrice,
      reason,
      quantity,
      direction,
      observation,
      createdBy: req.user.id,
    });

    await StockMovement.create({
      product: productId,
      lot: lotId,
      supplier: supplierId,
      type: direction,
      quantity,
      source: 'manual',
      referenceId: adjustment._id,
      note: reason,
    });

    const populated = await StockAdjustment.findById(adjustment._id).populate(POPULATE);
    res.status(201).json(populated);
  } catch (err) {
    res.status(err.status || 400).json({ message: err.message || 'Server error' });
  }
};

module.exports = { listAdjustments, createAdjustment };
