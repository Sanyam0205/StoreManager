const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  productId: String,
  qty: Number,
  price_cents: Number
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  userId: String,
  items: [ItemSchema],
  total_cents: Number,
  status: { type: String, default: 'created' }, // created, paid, cancelled
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
