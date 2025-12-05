const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price_cents: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  image_url: String,
  meta: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
