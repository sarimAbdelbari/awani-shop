const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: ['in', 'out'], required: true },
    quantity: { type: Number, required: true, min: 1 },
    source: {
      type: String,
      enum: ['order', 'supplier-delivery', 'manual'],
      required: true,
    },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    note: { type: String, trim: true, default: '' },
    date: { type: Date, default: Date.now },
  }
);

module.exports = mongoose.model('StockMovement', stockMovementSchema);
