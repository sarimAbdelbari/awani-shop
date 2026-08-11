const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      fr: { type: String, required: true, trim: true },
      en: { type: String, required: true, trim: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
