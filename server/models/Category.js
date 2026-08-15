const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
      match: [/^[A-Z]{3}$/, 'Category code must be exactly 3 letters'],
    },
    nextProductSeq: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true }
);

categorySchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
categorySchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
