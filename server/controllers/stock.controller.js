const StockMovement = require('../models/StockMovement');
const Product = require('../models/Product');

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
      .populate('product', 'name qrCode')
      .sort({ date: -1 })
      .limit(200);
    res.json(movements);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const getLowStockAlerts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .populate('supplier', 'name');
    const alerts = products.filter((p) => p.quantity <= p.lowStockThreshold);
    res.json(alerts);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const recordDelivery = async (req, res) => {
  try {
    const { productId, quantity, note } = req.body;
    if (!productId || !quantity || Number(quantity) < 1)
      return res.status(400).json({ message: 'productId and quantity (≥ 1) are required' });

    const product = await Product.findByIdAndUpdate(
      productId,
      { $inc: { quantity: Number(quantity) } },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const movement = await StockMovement.create({
      product: productId,
      type: 'in',
      quantity: Number(quantity),
      source: 'supplier-delivery',
      note: note || '',
    });

    res.status(201).json({ movement, product });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const recordManualAdjustment = async (req, res) => {
  try {
    const { productId, quantity, type, note } = req.body;
    if (!productId || !quantity || !type)
      return res.status(400).json({ message: 'productId, quantity, and type are required' });
    if (!['in', 'out'].includes(type))
      return res.status(400).json({ message: 'type must be "in" or "out"' });

    const delta = type === 'in' ? Number(quantity) : -Number(quantity);
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.quantity + delta < 0)
      return res.status(400).json({ message: 'Cannot reduce stock below zero' });

    await Product.findByIdAndUpdate(productId, { $inc: { quantity: delta } });
    const movement = await StockMovement.create({
      product: productId,
      type,
      quantity: Number(quantity),
      source: 'manual',
      note: note || '',
    });

    res.status(201).json({ movement });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getMovements, getLowStockAlerts, recordDelivery, recordManualAdjustment };
