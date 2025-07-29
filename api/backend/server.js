// backend/server.js
  import { connectDB } from './util/db.js';
  import express from 'express';
  import bodyParser from 'body-parser';
  import authRoutes from './routes/auth.js';
  import itemRoutes from './routes/items.js';

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(express.json());
app.use(cors());

//–– Connect to MongoDB Atlas on startup
 connectDB()
   .then(() => console.log('✅ MongoDB connected'))
   .catch(err => {
     console.error('❌ MongoDB connection error:', err);
     process.exit(1);
   });

  // Mount existing routes
  app.use('/api/auth', authRoutes);
  app.use('/api/items', itemRoutes);
// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- Routes ---
// Basic test route
app.get('/', (req, res) => {
    res.send('CryptoVault Backend API is running!');
});

// Auth routes
app.use('/api/auth', require('./routes/auth.js')); // Add this line

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

