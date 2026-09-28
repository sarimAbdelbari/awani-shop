const Order = require('../models/Order');
const Client = require('../models/Client');
const Product = require('../models/Product');
const Expense = require('../models/Expense');
const StockMovement = require('../models/StockMovement');
const Settings = require('../models/Settings');
const Shift = require('../models/Shift');
const { listPositions, pileKey } = require('../services/on-hand');

const getOrders = async (req, res) => {
  try {
    const { client, from, to } = req.query;
    const filter = {};
    if (client) filter.client = client;
    if (from || to) {
      filter.createdAt = {};
      if (from) {
        const start = dateBound(from, 'start');
        if (start) filter.createdAt.$gte = start;
      }
      if (to) {
        const end = dateBound(to, 'end');
        if (end) filter.createdAt.$lte = end;
      }
    }
    const orders = await Order.find(filter)
      .populate('client', 'fullName phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

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

const ORDER_POPULATE = [
  { path: 'client', select: 'fullName phone loyaltyPoints' },
  { path: 'createdBy', select: 'name' },
  { path: 'items.product', select: 'code name' },
  { path: 'items.lot', select: 'code name' },
  { path: 'items.supplier', select: 'fullName' },
];

const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(ORDER_POPULATE);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

function money(value) {
  return Math.round(value * 100) / 100;
}

async function nextOrderNumber() {
  const year = new Date().getFullYear();
  const settings = await Settings.getSingleton();
  if (settings.orderYear !== year) {
    settings.orderYear = year;
    settings.nextOrderSeq = 1;
    await settings.save();
  }
  const updated = await Settings.findByIdAndUpdate(
    settings._id,
    { $inc: { nextOrderSeq: 1 } },
    { new: false }
  );
  const seq = updated.nextOrderSeq;
  return `VNT-${year}-${String(seq).padStart(4, '0')}`;
}

const createOrder = async (req, res) => {
  try {
    const openShift = await Shift.findOne({ status: 'open' }).select('_id');
    if (!openShift) return res.status(400).json({ message: 'No open shift' });

    const { clientId, items, note } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must have at least one item' });
    }

    if (clientId) {
      const client = await Client.findById(clientId).select('_id');
      if (!client) return res.status(404).json({ message: 'Client not found' });
    }

    const parsed = [];
    for (let i = 0; i < items.length; i += 1) {
      const raw = items[i] || {};
      const qty = Number(raw.qty);
      const unitPrice = Number(raw.unitPrice);
      if (!raw.productId || !raw.lotId || !raw.supplierId) {
        return res.status(400).json({ message: `Line ${i + 1}: product, lot, and supplier are required` });
      }
      if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ message: `Line ${i + 1}: quantity must be a whole number of at least 1` });
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return res.status(400).json({ message: `Line ${i + 1}: price must be 0 or more` });
      }
      parsed.push({
        productId: String(raw.productId),
        lotId: String(raw.lotId),
        supplierId: String(raw.supplierId),
        qty,
        unitPrice,
      });
    }

    const positions = await listPositions();
    const byPile = new Map(
      positions.map((row) => [pileKey(row.product._id, row.lot._id, row.supplier._id), row])
    );

    const requested = new Map();
    for (const item of parsed) {
      const key = pileKey(item.productId, item.lotId, item.supplierId);
      requested.set(key, (requested.get(key) || 0) + item.qty);
    }

    for (const [key, qty] of requested) {
      const pile = byPile.get(key);
      const available = pile ? pile.quantity : 0;
      if (!pile || qty > available) {
        const name = pile ? `${pile.product.code} ${pile.product.name}` : 'product';
        return res.status(400).json({
          message: `Insufficient stock for "${name}". Available: ${available}`,
        });
      }
    }

    const orderItems = parsed.map((item) => {
      const pile = byPile.get(pileKey(item.productId, item.lotId, item.supplierId));
      const lineTotal = money(item.unitPrice * item.qty);
      return {
        product: item.productId,
        lot: item.lotId,
        supplier: item.supplierId,
        qty: item.qty,
        catalogPrice: pile.lastSellPrice,
        unitPrice: item.unitPrice,
        buyPrice: Number.isFinite(Number(pile.lastBuyPrice)) ? Number(pile.lastBuyPrice) : 0,
        lineTotal,
      };
    });

    const total = money(orderItems.reduce((sum, item) => sum + item.lineTotal, 0));
    const number = await nextOrderNumber();

    const order = await Order.create({
      number,
      client: clientId || null,
      items: orderItems,
      subtotal: total,
      total,
      createdBy: req.user.id,
      note: String(note || '').trim(),
    });

    await StockMovement.insertMany(
      orderItems.map((item) => ({
        product: item.product,
        lot: item.lot,
        supplier: item.supplier,
        type: 'out',
        quantity: item.qty,
        source: 'order',
        referenceId: order._id,
        note: number,
      }))
    );

    const populated = await Order.findById(order._id).populate(ORDER_POPULATE);
    res.status(201).json(populated);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

// Stats used by dashboard
function localDayKey(date) {
  const value = new Date(date);
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}

function lineMarge(item) {
  if (typeof item.buyPrice !== 'number') return 0;
  return (item.unitPrice - item.buyPrice) * item.qty;
}

const getStats = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const todayKey = localDayKey(now);
    const defaultFrom = localDayKey(new Date(now.getFullYear(), now.getMonth(), 1));
    const defaultTo = todayKey;
    const fromText = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.from || ''))
      ? String(req.query.from)
      : defaultFrom;
    const toText = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.to || ''))
      ? String(req.query.to)
      : defaultTo;

    let rangeStart = dateBound(fromText, 'start');
    let rangeEndDay = dateBound(toText, 'start');
    if (!rangeStart || !rangeEndDay) {
      return res.status(400).json({ message: 'Invalid date range' });
    }
    if (rangeStart > rangeEndDay) {
      const swap = rangeStart;
      rangeStart = rangeEndDay;
      rangeEndDay = swap;
    }
    if (rangeEndDay > todayStart) rangeEndDay = new Date(todayStart);
    const rangeEnd = new Date(
      rangeEndDay.getFullYear(),
      rangeEndDay.getMonth(),
      rangeEndDay.getDate(),
      23,
      59,
      59,
      999
    );

    const [periodOrders, todayOrders, expenses, positions] = await Promise.all([
      Order.find({ createdAt: { $gte: rangeStart, $lte: rangeEnd } }).select('total items createdAt'),
      Order.find({ createdAt: { $gte: todayStart, $lte: todayEnd } }).select('total'),
      Expense.find({ date: { $gte: rangeStart, $lte: rangeEnd } }).select('category amount'),
      listPositions(),
    ]);

    const daily = new Map();
    const cursor = new Date(rangeStart);
    while (cursor <= rangeEndDay) {
      const key = localDayKey(cursor);
      daily.set(key, { date: key, ca: 0, marge: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    let caPeriod = 0;
    let margePeriod = 0;
    const productMap = new Map();

    periodOrders.forEach((order) => {
      const key = localDayKey(order.createdAt);
      const bucket = daily.get(key) || { date: key, ca: 0, marge: 0 };
      let orderMarge = 0;
      order.items.forEach((item) => {
        const marge = lineMarge(item);
        orderMarge += marge;
        const id = String(item.product);
        const prev = productMap.get(id) || { qty: 0, marge: 0 };
        prev.qty += item.qty;
        prev.marge += marge;
        productMap.set(id, prev);
      });
      bucket.ca = money(bucket.ca + order.total);
      bucket.marge = money(bucket.marge + orderMarge);
      daily.set(key, bucket);
      caPeriod += order.total;
      margePeriod += orderMarge;
    });

    const fraisByMap = {};
    let fraisPeriod = 0;
    expenses.forEach((expense) => {
      fraisPeriod += expense.amount;
      fraisByMap[expense.category] = (fraisByMap[expense.category] || 0) + expense.amount;
    });

    const caToday = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const topIds = [...productMap.entries()].sort((a, b) => b[1].marge - a[1].marge).slice(0, 5);
    const products = await Product.find({ _id: { $in: topIds.map(([id]) => id) } }).select('name code');
    const nameById = Object.fromEntries(products.map((product) => [String(product._id), product]));

    res.json({
      caToday: money(caToday),
      ticketsToday: todayOrders.length,
      caPeriod: money(caPeriod),
      margePeriod: money(margePeriod),
      resultatPeriod: money(caPeriod - fraisPeriod),
      days: [...daily.values()],
      topProducts: topIds.map(([id, row]) => ({
        name: nameById[id] ? `${nameById[id].code} — ${nameById[id].name}` : id,
        qty: row.qty,
        marge: money(row.marge),
      })),
      fraisByCategory: Object.entries(fraisByMap).map(([category, amount]) => ({
        category,
        amount: money(amount),
      })),
      lowPiles: positions
        .filter((pile) => pile.quantity > 0 && pile.quantity <= 5)
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 8)
        .map((pile) => ({
          productCode: pile.product.code,
          productName: pile.product.name,
          lotCode: pile.lot.code,
          supplierName: pile.supplier.fullName,
          quantity: pile.quantity,
        })),
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getOrders, getOrder, createOrder, getStats };
