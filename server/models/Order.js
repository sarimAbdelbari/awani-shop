const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    lot: { type: mongoose.Schema.Types.ObjectId, ref: 'Lot', required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    qty: { type: Number, required: true, min: 1 },
    catalogPrice: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    buyPrice: { type: Number, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, trim: true, uppercase: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
    items: {
      type: [orderItemSchema],
      validate: [(v) => Array.isArray(v) && v.length > 0, 'At least one line is required'],
    },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    cashReceived: { type: Number, min: 0 },
    change: { type: Number, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

orderSchema.index({ number: 1 }, { unique: true, sparse: true });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ client: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
