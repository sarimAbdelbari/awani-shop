const Shift = require('../models/Shift');
const Order = require('../models/Order');

function money(value) {
  return Math.round(value * 100) / 100;
}

async function summarize(shift, until = new Date()) {
  const orders = await Order.find({
    createdAt: { $gte: shift.openedAt, $lte: until },
  }).select('total');
  const ticketTotal = money(orders.reduce((sum, order) => sum + order.total, 0));
  return {
    ticketCount: orders.length,
    ticketTotal,
    expectedCash: money(shift.openingFloat + ticketTotal),
  };
}

const getCurrent = async (_req, res) => {
  try {
    const shift = await Shift.findOne({ status: 'open' }).populate('openedBy', 'name');
    if (!shift) {
      return res.json({ shift: null, ticketCount: 0, ticketTotal: 0, expectedCash: 0 });
    }
    const summary = await summarize(shift);
    res.json({ shift, ...summary });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const listShifts = async (_req, res) => {
  try {
    const shifts = await Shift.find({ status: 'closed' })
      .populate('openedBy', 'name')
      .populate('closedBy', 'name')
      .sort({ closedAt: -1 })
      .limit(100);
    res.json(shifts);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const openShift = async (req, res) => {
  try {
    const existing = await Shift.findOne({ status: 'open' }).select('_id');
    if (existing) return res.status(400).json({ message: 'A shift is already open' });

    const openingFloat = Number(req.body.openingFloat);
    if (!Number.isFinite(openingFloat) || openingFloat < 0) {
      return res.status(400).json({ message: 'Opening float must be 0 or more' });
    }

    const shift = await Shift.create({
      status: 'open',
      openingFloat,
      openedBy: req.user.id,
      openedAt: new Date(),
    });
    const populated = await Shift.findById(shift._id).populate('openedBy', 'name');
    res.status(201).json({
      shift: populated,
      ticketCount: 0,
      ticketTotal: 0,
      expectedCash: openingFloat,
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'A shift is already open' });
    }
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

const closeShift = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    if (!shift || shift.status !== 'open') {
      return res.status(404).json({ message: 'Open shift not found' });
    }

    const countedCash = Number(req.body.countedCash);
    if (!Number.isFinite(countedCash) || countedCash < 0) {
      return res.status(400).json({ message: 'Counted cash must be 0 or more' });
    }

    const closedAt = new Date();
    const summary = await summarize(shift, closedAt);
    shift.status = 'closed';
    shift.closedBy = req.user.id;
    shift.closedAt = closedAt;
    shift.countedCash = countedCash;
    shift.expectedCash = summary.expectedCash;
    shift.ecart = money(countedCash - summary.expectedCash);
    shift.note = String(req.body.note || '').trim();
    await shift.save();

    const populated = await Shift.findById(shift._id)
      .populate('openedBy', 'name')
      .populate('closedBy', 'name');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

module.exports = { getCurrent, listShifts, openShift, closeShift };
