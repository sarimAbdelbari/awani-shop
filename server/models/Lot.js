const mongoose = require('mongoose');

const lotSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 8,
      match: [/^[A-Z0-9]{2,8}$/, 'Lot code must be 2–8 letters or digits'],
    },
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

lotSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
lotSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model('Lot', lotSchema);
