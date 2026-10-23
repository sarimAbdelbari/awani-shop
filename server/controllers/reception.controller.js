const Reception = require('../models/Reception');
const Product = require('../models/Product');
const Lot = require('../models/Lot');
const Supplier = require('../models/Supplier');
const Settings = require('../models/Settings');
const StockMovement = require('../models/StockMovement');

const POPULATE = [
  { path: 'supplier', select: 'fullName phone location' },
  { path: 'lines.product', select: 'code name isActive' },
  { path: 'lines.lot', select: 'code name isActive' },
];

async function nextReceptionNumber() {
  const year = new Date().getFullYear();
  const settings = await Settings.getSingleton();
  if (settings.receptionYear !== year) {
    settings.receptionYear = year;
    settings.nextReceptionSeq = 1;
    await settings.save();
  }
  const updated = await Settings.findByIdAndUpdate(
    settings._id,
    { $inc: { nextReceptionSeq: 1 } },
    { new: false }
  );
  const seq = updated.nextReceptionSeq;
  return `RCP-${year}-${String(seq).padStart(4, '0')}`;
}

function parseExpiry(value) {
  if (value === undefined || value === null || value === '') return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

async function parseLines(rawLines) {
  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    const err = new Error('At least one line is required');
    err.status = 400;
    throw err;
  }

  const lines = [];
  for (let i = 0; i < rawLines.length; i += 1) {
    const raw = rawLines[i] || {};
    const productId = raw.product;
    const lotId = raw.lot;
    const quantity = Number(raw.quantity);
    const status = String(raw.status || '').toUpperCase();
    const buyPrice = Number(raw.buyPrice);
    const sellPrice = Number(raw.sellPrice);
    const observation = String(raw.observation || '').trim();

    if (!productId || !lotId) {
      const err = new Error(`Line ${i + 1}: product and lot are required`);
      err.status = 400;
      throw err;
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      const err = new Error(`Line ${i + 1}: quantity must be at least 1`);
      err.status = 400;
      throw err;
    }
    if (!['A', 'R'].includes(status)) {
      const err = new Error(`Line ${i + 1}: status must be A or R`);
      err.status = 400;
      throw err;
    }
    if (!Number.isFinite(buyPrice) || buyPrice < 0) {
      const err = new Error(`Line ${i + 1}: buy price is required`);
      err.status = 400;
      throw err;
    }
    if (!Number.isFinite(sellPrice) || sellPrice < 0) {
      const err = new Error(`Line ${i + 1}: sell price is required`);
      err.status = 400;
      throw err;
    }
    if (status === 'R' && !observation) {
      const err = new Error(`Line ${i + 1}: observation is required when status is R`);
      err.status = 400;
      throw err;
    }

    const [product, lot] = await Promise.all([
      Product.findById(productId).select('_id isActive'),
      Lot.findById(lotId).select('_id isActive'),
    ]);
    if (!product) {
      const err = new Error(`Line ${i + 1}: product not found`);
      err.status = 404;
      throw err;
    }
    if (!lot) {
      const err = new Error(`Line ${i + 1}: lot not found`);
      err.status = 404;
      throw err;
    }

    lines.push({
      product: product._id,
      lot: lot._id,
      quantity,
      status,
      buyPrice,
      sellPrice,
      expiryDate: parseExpiry(raw.expiryDate),
      observation: status === 'R' ? observation : observation,
      allowPriceChange: raw.allowPriceChange !== false,
    });
  }
  return lines;
}

async function syncReceptionMovements(reception) {
  await StockMovement.deleteMany({ source: 'reception', referenceId: reception._id });
  const accepted = reception.lines.filter((l) => l.status === 'A');
  if (accepted.length === 0) return;
  await StockMovement.insertMany(
    accepted.map((line) => ({
      product: line.product,
      type: 'in',
      quantity: line.quantity,
      source: 'reception',
      referenceId: reception._id,
      supplier: reception.supplier,
      note: reception.number,
      date: reception.createdAt || new Date(),
    }))
  );
}

const getReceptions = async (req, res) => {
  try {
    const receptions = await Reception.find()
      .populate(POPULATE)
      .sort({ createdAt: -1 });
    res.json(receptions);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const getReception = async (req, res) => {
  try {
    const reception = await Reception.findById(req.params.id).populate(POPULATE);
    if (!reception) return res.status(404).json({ message: 'Reception not found' });
    res.json(reception);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const createReception = async (req, res) => {
  try {
    const supplierId = req.body.supplier;
    if (!supplierId) return res.status(400).json({ message: 'Supplier is required' });

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

    const lines = await parseLines(req.body.lines);
    const number = await nextReceptionNumber();

    const reception = await Reception.create({
      number,
      supplier: supplier._id,
      note: String(req.body.note || '').trim(),
      lines,
    });
    await syncReceptionMovements(reception);

    const populated = await Reception.findById(reception._id).populate(POPULATE);
    res.status(201).json(populated);
  } catch (err) {
    res.status(err.status || 400).json({ message: err.message });
  }
};

const updateReception = async (req, res) => {
  try {
    const reception = await Reception.findById(req.params.id);
    if (!reception) return res.status(404).json({ message: 'Reception not found' });

    if (req.body.supplier !== undefined) {
      const supplier = await Supplier.findById(req.body.supplier);
      if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
      reception.supplier = supplier._id;
    }
    if (req.body.note !== undefined) {
      reception.note = String(req.body.note || '').trim();
    }
    if (req.body.lines !== undefined) {
      reception.lines = await parseLines(req.body.lines);
    }

    await reception.save();
    await syncReceptionMovements(reception);

    const populated = await Reception.findById(reception._id).populate(POPULATE);
    res.json(populated);
  } catch (err) {
    res.status(err.status || 400).json({ message: err.message });
  }
};

const deleteReception = async (req, res) => {
  try {
    const reception = await Reception.findById(req.params.id);
    if (!reception) return res.status(404).json({ message: 'Reception not found' });

    await StockMovement.deleteMany({ source: 'reception', referenceId: reception._id });
    await reception.deleteOne();
    res.json({ message: 'Reception deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getReceptions,
  getReception,
  createReception,
  updateReception,
  deleteReception,
};
