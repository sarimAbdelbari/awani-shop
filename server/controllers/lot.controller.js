const Lot = require('../models/Lot');
const Reception = require('../models/Reception');

const CODE_RE = /^[A-Z0-9]{2,8}$/;

const normalizeCode = (code) => String(code || '').trim().toUpperCase();

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const getLots = async (req, res) => {
  try {
    const lots = await Lot.find().sort({ name: 1 });
    res.json(lots);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const createLot = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const code = normalizeCode(req.body.code);

    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (!CODE_RE.test(code))
      return res.status(400).json({ message: 'Code must be 2–8 letters or digits' });

    const existsName = await Lot.findOne({ name: new RegExp(`^${escapeRegex(name)}$`, 'i') });
    if (existsName) return res.status(409).json({ message: 'Lot name already exists' });

    const existsCode = await Lot.findOne({ code });
    if (existsCode) return res.status(409).json({ message: 'Lot code already exists' });

    const lot = await Lot.create({
      name,
      code,
      isActive: req.body.isActive !== false,
    });
    res.status(201).json(lot);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateLot = async (req, res) => {
  try {
    const lot = await Lot.findById(req.params.id);
    if (!lot) return res.status(404).json({ message: 'Lot not found' });

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ message: 'Name is required' });
      const existsName = await Lot.findOne({
        _id: { $ne: lot._id },
        name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
      });
      if (existsName) return res.status(409).json({ message: 'Lot name already exists' });
      lot.name = name;
    }

    if (req.body.isActive !== undefined) {
      lot.isActive = Boolean(req.body.isActive);
    }

    await lot.save();
    res.json(lot);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteLot = async (req, res) => {
  try {
    const inUse = await Reception.exists({ 'lines.lot': req.params.id });
    if (inUse)
      return res.status(400).json({ message: 'Cannot delete lot used on a reception' });

    const lot = await Lot.findByIdAndDelete(req.params.id);
    if (!lot) return res.status(404).json({ message: 'Lot not found' });
    res.json({ message: 'Lot deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getLots, createLot, updateLot, deleteLot };
