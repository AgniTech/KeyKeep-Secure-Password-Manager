// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../api/util/db.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(express.json());
app.use(cors());

// --- Database Connection ---
connectDB()
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// --- Routes ---
// Basic test route
app.get('/', (req, res) => {
  res.send('CryptoVault Backend API is running!');
});

// API routes - these will be handled by Vercel serverless functions
// The actual endpoints are in the /api directory

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

backend/server.js

