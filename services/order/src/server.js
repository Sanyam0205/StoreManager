require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const orders = require('../routes/orders');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/orders', orders);
app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mini_ecom_order';

mongoose.connect(MONGO_URI)
  .then(()=> app.listen(PORT, ()=> console.log(`Order service on ${PORT}`)))
  .catch(err => { console.error(err); process.exit(1); });
