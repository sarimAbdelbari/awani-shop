const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['open', 'closed'], required: true },
    openingFloat: { type: Number, required: true, min: 0 },
    openedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    openedAt: { type: Date, required: true, default: Date.now },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    closedAt: { type: Date, default: null },
    countedCash: { type: Number, min: 0, default: null },
    expectedCash: { type: Number, min: 0, default: null },
    ecart: { type: Number, default: null },
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

shiftSchema.index(
  { status: 1 },
  { unique: true, partialFilterExpression: { status: 'open' } }
);

module.exports = mongoose.model('Shift', shiftSchema);
