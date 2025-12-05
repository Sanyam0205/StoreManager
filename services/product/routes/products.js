const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// Create
router.post('/', async (req, res) => {
  try {
    const p = await Product.create(req.body);
    res.status(201).json(p);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// List with simple pagination
router.get('/', async (req, res) => {
  const page = Math.max(0, parseInt(req.query.page || '0'));
  const limit = Math.min(100, parseInt(req.query.limit || '20'));
  const products = await Product.find().skip(page * limit).limit(limit);
  res.json(products);
});

// Get one
router.get('/:id', async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

// Update
router.put('/:id', async (req, res) => {
  const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

// Delete
router.delete('/:id', async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
