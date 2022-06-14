const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
require('dotenv').config();
const userRoutes = require('./routes/user');
const sauceRoutes = require('./routes/sauce');

// Connect to database
mongoose.connect(process.env.DATABASE_URL,
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Successfully connected to MongoDB!'))
  .catch(() => console.log('Failed to connect to MongoDB!'));

const app = express();

app.use(express.json());

app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));

app.use(cors());

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/api/auth', userRoutes);
app.use('/api/sauces', sauceRoutes);

module.exports = app;