const Reception = require('../models/Reception');
const Order = require('../models/Order');
const StockAdjustment = require('../models/StockAdjustment');

function moneyPart(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return amount.toFixed(2);
}

function pileKey(productId, lotId, supplierId, buyPrice, sellPrice) {
  return `${String(productId)}|${String(lotId)}|${String(supplierId)}|${moneyPart(buyPrice)}|${moneyPart(sellPrice)}`;
}

function groupKey(productId, lotId, supplierId) {
  return `${String(productId)}|${String(lotId)}|${String(supplierId)}`;
}

function noteQty(map, key, qty) {
  if (qty <= 0) return;
  map.set(key, (map.get(key) || 0) + qty);
}

function takeFromPiles(piles, amount) {
  let left = amount;
  const ordered = [...piles].sort((a, b) => b.quantity - a.quantity);
  for (const pile of ordered) {
    if (left <= 0) break;
    const take = Math.min(pile.quantity, left);
    pile.quantity -= take;
    left -= take;
  }
}

function newestPile(piles) {
  return [...piles].sort(
    (a, b) => new Date(b.lastReceptionAt).getTime() - new Date(a.lastReceptionAt).getTime()
  )[0];
}

async function listPositions() {
  const [rows, soldRows, adjustmentRows] = await Promise.all([
    Reception.aggregate([
      { $sort: { createdAt: 1 } },
      { $unwind: '$lines' },
      { $match: { 'lines.status': 'A' } },
      {
        $group: {
          _id: {
            product: '$lines.product',
            lot: '$lines.lot',
            supplier: '$supplier',
            buyPrice: { $round: ['$lines.buyPrice', 2] },
            sellPrice: { $round: ['$lines.sellPrice', 2] },
          },
          quantity: { $sum: '$lines.quantity' },
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
          allowPriceChange: { $last: { $ifNull: ['$lines.allowPriceChange', true] } },
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
      {
        $lookup: {
          from: 'suppliers',
          localField: '_id.supplier',
          foreignField: '_id',
          as: 'supplier',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$lot', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
      { $sort: { 'product.name': 1, 'lot.name': 1, 'supplier.fullName': 1 } },
    ]),
    Order.aggregate([
      { $unwind: '$items' },
      {
        $match: {
          'items.product': { $ne: null },
          'items.lot': { $ne: null },
          'items.supplier': { $ne: null },
        },
      },
      {
        $group: {
          _id: {
            product: '$items.product',
            lot: '$items.lot',
            supplier: '$items.supplier',
            buyPrice: { $round: ['$items.buyPrice', 2] },
            sellPrice: { $round: ['$items.catalogPrice', 2] },
          },
          quantity: { $sum: '$items.qty' },
        },
      },
    ]),
    StockAdjustment.aggregate([
      {
        $group: {
          _id: {
            product: '$product',
            lot: '$lot',
            supplier: '$supplier',
            buyPrice: '$buyPrice',
            sellPrice: '$sellPrice',
          },
          outQty: {
            $sum: { $cond: [{ $eq: ['$direction', 'out'] }, '$quantity', 0] },
          },
          inQty: {
            $sum: { $cond: [{ $eq: ['$direction', 'in'] }, '$quantity', 0] },
          },
        },
      },
    ]),
  ]);

  const piles = rows
    .filter((row) => row.product && row.lot && row.supplier)
    .map((row) => ({
      product: { _id: row.product._id, code: row.product.code, name: row.product.name },
      lot: { _id: row.lot._id, code: row.lot.code, name: row.lot.name },
      quantity: row.quantity,
      lastBuyPrice: row._id.buyPrice,
      lastSellPrice: row._id.sellPrice,
      nearestExpiry: row.nearestExpiry,
      lastReceptionAt: row.lastReceptionAt,
      lastReceptionNumber: row.lastReceptionNumber,
      allowPriceChange: row.allowPriceChange !== false,
      supplier: { _id: row.supplier._id, fullName: row.supplier.fullName },
    }));

  const byPile = new Map(
    piles.map((pile) => [
      pileKey(pile.product._id, pile.lot._id, pile.supplier._id, pile.lastBuyPrice, pile.lastSellPrice),
      pile,
    ])
  );
  const byGroup = new Map();
  for (const pile of piles) {
    const key = groupKey(pile.product._id, pile.lot._id, pile.supplier._id);
    const list = byGroup.get(key) || [];
    list.push(pile);
    byGroup.set(key, list);
  }

  const spill = new Map();

  const applyUnmatched = (productId, lotId, supplierId, delta) => {
    const group = byGroup.get(groupKey(productId, lotId, supplierId));
    if (!group || group.length === 0) return;
    if (delta < 0) {
      noteQty(spill, groupKey(productId, lotId, supplierId), -delta);
      return;
    }
    newestPile(group).quantity += delta;
  };

  for (const row of soldRows) {
    const { product, lot, supplier, buyPrice, sellPrice } = row._id;
    const buy = moneyPart(buyPrice);
    const sell = moneyPart(sellPrice);
    if (buy == null || sell == null) {
      applyUnmatched(product, lot, supplier, -row.quantity);
      continue;
    }
    const pile = byPile.get(pileKey(product, lot, supplier, buy, sell));
    if (!pile) {
      applyUnmatched(product, lot, supplier, -row.quantity);
      continue;
    }
    const take = Math.min(pile.quantity, row.quantity);
    pile.quantity -= take;
    noteQty(spill, groupKey(product, lot, supplier), row.quantity - take);
  }

  for (const row of adjustmentRows) {
    const delta = (row.inQty || 0) - (row.outQty || 0);
    if (delta === 0) continue;
    const { product, lot, supplier, buyPrice, sellPrice } = row._id;
    const buy = moneyPart(buyPrice);
    const sell = moneyPart(sellPrice);
    if (buy == null || sell == null) {
      applyUnmatched(product, lot, supplier, delta);
      continue;
    }
    const pile = byPile.get(pileKey(product, lot, supplier, buy, sell));
    if (!pile) {
      applyUnmatched(product, lot, supplier, delta);
      continue;
    }
    if (delta > 0) {
      pile.quantity += delta;
      continue;
    }
    const need = -delta;
    const take = Math.min(pile.quantity, need);
    pile.quantity -= take;
    noteQty(spill, groupKey(product, lot, supplier), need - take);
  }

  for (const [key, qty] of spill) {
    const group = byGroup.get(key);
    if (group) takeFromPiles(group, qty);
  }

  return piles.map((pile) => ({
    ...pile,
    quantity: Math.max(0, pile.quantity),
  }));
}

module.exports = { listPositions, pileKey, moneyPart };
