const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    loyaltyThreshold: { type: Number, default: 1000, min: 1 },
    loyaltyReward: { type: Number, default: 50, min: 0 },
    currency: { type: String, default: 'DZD' },
    shopName: { type: String, default: 'Awani Shop', trim: true },
    receptionYear: { type: Number, default: () => new Date().getFullYear() },
    nextReceptionSeq: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true }
);

settingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
