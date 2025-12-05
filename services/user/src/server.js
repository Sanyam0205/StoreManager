require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const users = require('../routes/users');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/users', users);
app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mini_ecom_user';

mongoose.connect(MONGO_URI)
  .then(()=> app.listen(PORT, ()=> console.log(`User service on ${PORT}`)))
  .catch(err => { console.error(err); process.exit(1); });
