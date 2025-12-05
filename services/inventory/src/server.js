require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const inventoryRoutes = require('../routes/inventory');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/inventory', inventoryRoutes);
app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3004;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mini_ecom_inventory';

mongoose.connect(MONGO_URI)
  .then(()=> app.listen(PORT, ()=> console.log(`Inventory service on ${PORT}`)))
  .catch(err => { console.error(err); process.exit(1); });
