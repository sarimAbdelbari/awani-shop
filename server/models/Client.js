const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: null },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Client', clientSchema);
