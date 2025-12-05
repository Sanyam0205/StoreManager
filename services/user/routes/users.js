const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Create
router.post('/', async (req, res) => {
  try {
    const u = await User.create(req.body);
    res.status(201).json(u);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Read all
router.get('/', async (req, res) => {
  const users = await User.find().limit(100);
  res.json(users);
});

// Read one
router.get('/:id', async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ error: 'Not found' });
  res.json(u);
});

// Update
router.put('/:id', async (req, res) => {
  const u = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!u) return res.status(404).json({ error: 'Not found' });
  res.json(u);
});

// Delete
router.delete('/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
