const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    nif: { type: String, trim: true, default: '' },
    nis: { type: String, trim: true, default: '' },
    rc: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', supplierSchema);
