const express = require('express');
const Inventory = require('../models/Inventory');
const router = express.Router();

// Create or set inventory for product
router.post('/', async (req, res) => {
  const { productId, qty } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId required' });
  const inv = await Inventory.findOneAndUpdate(
    { productId },
    { $set: { available_qty: qty } },
    { upsert: true, new: true }
  );
  res.json(inv);
});

// Get inventory
router.get('/:productId', async (req, res) => {
  const inv = await Inventory.findOne({ productId: req.params.productId });
  if (!inv) return res.status(404).json({ error: 'Not found' });
  res.json(inv);
});

// Update qty (increase / decrease)
router.put('/:productId', async (req, res) => {
  const { delta } = req.body; // integer
  const inv = await Inventory.findOneAndUpdate(
    { productId: req.params.productId },
    { $inc: { available_qty: delta } },
    { new: true }
  );
  if (!inv) return res.status(404).json({ error: 'Not found' });
  res.json(inv);
});

// Reserve stock for an order (idempotent per orderId)
router.post('/:productId/reserve', async (req, res) => {
  const { qty, orderId } = req.body;
  if (!orderId || !qty) return res.status(400).json({ error: 'orderId and qty required' });

  const inv = await Inventory.findOne({ productId: req.params.productId });
  if (!inv) return res.status(404).json({ error: 'Not found' });

  // if already reserved for this orderId, return success
  if (inv.reservations.some(r => r.orderId === orderId)) {
    return res.json({ ok: true, reserved: true, inventory: inv });
  }

  if (inv.available_qty < qty) {
    return res.status(400).json({ error: 'insufficient_stock', available_qty: inv.available_qty });
  }

  inv.available_qty -= qty;
  inv.reservations.push({ orderId, qty });
  await inv.save();
  res.json({ ok: true, inventory: inv });
});

// Release reservation (e.g., on order cancel or rollback)
router.post('/:productId/release', async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'orderId required' });
  const inv = await Inventory.findOne({ productId: req.params.productId });
  if (!inv) return res.status(404).json({ error: 'Not found' });

  const idx = inv.reservations.findIndex(r => r.orderId === orderId);
  if (idx === -1) return res.json({ ok: true, message: 'no reservation' });

  const { qty } = inv.reservations[idx];
  inv.available_qty += qty;
  inv.reservations.splice(idx, 1);
  await inv.save();
  res.json({ ok: true, inventory: inv });
});

module.exports = router;
