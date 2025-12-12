const express = require('express');
const axios = require('axios');
const Order = require('../models/Order');
const router = express.Router();

const INVENTORY_BASE = process.env.INVENTORY_URL || 'http://localhost:3004';

// Create order: expects { userId, items: [{ productId, qty, price_cents }] }
router.post('/', async (req, res) => {
  const { userId, items } = req.body;
  if (!userId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'userId and items required' });
  }

  const orderId = new Date().getTime().toString(36) + Math.random().toString(36).slice(2,8);

  // Try to reserve each item's qty in inventory sequentially
  const reserved = [];
  try {
    for (const it of items) {
      const url = `${INVENTORY_BASE}/inventory/${encodeURIComponent(it.productId)}/reserve`;
      const resp = await axios.post(url, { orderId, qty: it.qty });
      if (resp.data && resp.data.ok) {
        reserved.push({ productId: it.productId, qty: it.qty });
      } else {
        throw new Error('reserve_failed');
      }
    }

    const total = items.reduce((s,i)=> s + (i.price_cents || 0) * (i.qty || 1), 0);
    const order = await Order.create({ userId, items, total_cents: total, status: 'created' });
    return res.status(201).json({ order, reserved });
  } catch (err) {
    // Rollback any reservations
    for (const r of reserved) {
      try {
        await axios.post(`${INVENTORY_BASE}/inventory/${encodeURIComponent(r.productId)}/release`, { orderId });
      } catch (e) { /* log and continue */ }
    }
    return res.status(400).json({ error: 'could_not_create_order', details: err.message });
  }
});

// Get order
router.get('/:id', async (req, res) => {
  const o = await Order.findById(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  res.json(o);
});

// List orders
router.get('/', async (req, res) => {
  const list = await Order.find().sort({ createdAt: -1 }).limit(100);
  res.json(list);
});

module.exports = router;


router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'order_not_found' });
    }
    return res.json({ ok: true, deleted });
  } catch (err) {
    return res.status(500).json({ error: 'delete_failed', details: err.message });
  }
});