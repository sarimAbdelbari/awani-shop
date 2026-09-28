const mongoose = require('mongoose');

const stockAdjustmentSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    lot: { type: mongoose.Schema.Types.ObjectId, ref: 'Lot', required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    reason: { type: String, enum: ['casse', 'perte', 'inventaire'], required: true },
    quantity: { type: Number, required: true, min: 1 },
    direction: { type: String, enum: ['in', 'out'], required: true },
    observation: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

stockAdjustmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('StockAdjustment', stockAdjustmentSchema);
