const mongoose = require('mongoose');

const stockAdjustmentSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    lot: { type: mongoose.Schema.Types.ObjectId, ref: 'Lot', required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    buyPrice: { type: Number, min: 0 },
    sellPrice: { type: Number, min: 0 },
    reason: { type: String, enum: ['casse', 'perte', 'inventaire'], required: true },
    quantity: { type: Number, required: true, min: 1 },
    direction: { type: String, enum: ['in', 'out'], required: true },
    observation: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

stockAdjustmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('StockAdjustment', stockAdjustmentSchema);
