const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  qty: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const InventorySchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  available_qty: { type: Number, default: 0 },
  reservations: { type: [ReservationSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Inventory', InventorySchema);
