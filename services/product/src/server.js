require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const products = require('../routes/products');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/products', products);
app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mini_ecom_product';

mongoose.connect(MONGO_URI)
  .then(()=> app.listen(PORT, ()=> console.log(`Product service on ${PORT}`)))
  .catch(err => { console.error(err); process.exit(1); });
