const mongoose = require('mongoose');

const receptionLineSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    lot: { type: mongoose.Schema.Types.ObjectId, ref: 'Lot', required: true },
    quantity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['A', 'R'], required: true },
    buyPrice: { type: Number, required: true, min: 0 },
    sellPrice: { type: Number, required: true, min: 0 },
    expiryDate: { type: Date, default: null },
    observation: { type: String, trim: true, default: '' },
  },
  { _id: true }
);

const receptionSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true, trim: true, uppercase: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    note: { type: String, trim: true, default: '' },
    lines: {
      type: [receptionLineSchema],
      validate: [(v) => Array.isArray(v) && v.length > 0, 'At least one line is required'],
    },
  },
  { timestamps: true }
);

receptionSchema.index({ supplier: 1, createdAt: -1 });

module.exports = mongoose.model('Reception', receptionSchema);
