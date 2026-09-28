const Reception = require('../models/Reception');
const Order = require('../models/Order');
const StockAdjustment = require('../models/StockAdjustment');

function pileKey(productId, lotId, supplierId) {
  return `${String(productId)}|${String(lotId)}|${String(supplierId)}`;
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
          },
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
          },
          quantity: { $sum: '$items.qty' },
        },
      },
    ]),
    StockAdjustment.aggregate([
      {
        $group: {
          _id: { product: '$product', lot: '$lot', supplier: '$supplier' },
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

  const sold = new Map(
    soldRows.map((row) => [
      pileKey(row._id.product, row._id.lot, row._id.supplier),
      row.quantity,
    ])
  );
  const adjusted = new Map(
    adjustmentRows.map((row) => [
      pileKey(row._id.product, row._id.lot, row._id.supplier),
      (row.inQty || 0) - (row.outQty || 0),
    ])
  );

  return rows
    .filter((row) => row.product && row.lot && row.supplier)
    .map((row) => {
      const received = row.quantity;
      const soldQty = sold.get(pileKey(row.product._id, row.lot._id, row.supplier._id)) || 0;
      const delta = adjusted.get(pileKey(row.product._id, row.lot._id, row.supplier._id)) || 0;
      return {
        product: { _id: row.product._id, code: row.product.code, name: row.product.name },
        lot: { _id: row.lot._id, code: row.lot.code, name: row.lot.name },
        quantity: Math.max(0, received - soldQty + delta),
        lastBuyPrice: row.lastBuyPrice,
        lastSellPrice: row.lastSellPrice,
        nearestExpiry: row.nearestExpiry,
        lastReceptionAt: row.lastReceptionAt,
        lastReceptionNumber: row.lastReceptionNumber,
        supplier: { _id: row.supplier._id, fullName: row.supplier.fullName },
      };
    });
}

module.exports = { listPositions, pileKey };
