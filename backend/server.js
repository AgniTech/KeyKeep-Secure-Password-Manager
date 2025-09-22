import path from 'path';
import { fileURLToPath } from 'url';
// server.js (place this in your project's root directory)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../api/util/db.js'; // [cite: 536]

// --- Import All API Logic as Routers ---
// Note: You must first convert each of these files to export an Express router.
import loginRouter from '../api/auth/login.js'; // [cite: 225]
import registerRouter from '../api/auth/register.js'; // [cite: 243]
import unlockRouter from '../api/auth/unlock.js'; // [cite: 266]
import profileRouter from '../api/user/profile.js'; // [cite: 303]
import deleteVaultRouter from '../api/vault/delete.js'; // [cite: 404]
import fetchVaultRouter from '../api/vault/fetch.js'; // [cite: 424]
import getVaultRouter from '../api/vault/get.js'; // [cite: 459]
import saveVaultRouter from '../api/vault/save.js'; // [cite: 468]
import unlockVaultRouter from '../api/vault/unlock.js'; // NEW: Import the new vault unlock router


// --- Basic Server Setup ---
dotenv.config(); // [cite: 535]
const app = express(); // [cite: 537]
const PORT = process.env.PORT || 5000; // [cite: 537]


// --- Middleware ---
// Enables your server to accept JSON data and allows cross-origin requests.
app.use(cors()); // [cite: 538]
app.use(express.json()); // [cite: 538]

// --- Serve Frontend Static Files ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The static middleware needs to point to the root directory, which is one level up from /backend
app.use(express.static(path.join(__dirname, '../')));


// --- Database Connection ---
connectDB()
    .then(() => console.log('✅ MongoDB connected successfully!')) // [cite: 539]
    .catch(err => {
        console.error('❌ MongoDB connection error:', err); // [cite: 539]
        process.exit(1); // [cite: 539]
    });

// This is necessary to make the libsodium-wrappers library available to the frontend.
app.use('/vendor', express.static(path.join(__dirname, '../node_modules')));
// --- API Routes ---
// This is the crucial part that maps your API file logic to a URL path.
app.use('/api/auth/login', loginRouter);
app.use('/api/auth/register', registerRouter);
app.use('/api/auth/unlock', unlockRouter);
app.use('/api/user/profile', profileRouter);
app.use('/api/vault/delete', deleteVaultRouter);
app.use('/api/vault/fetch', fetchVaultRouter);
app.use('/api/vault/get', getVaultRouter);
app.use('/api/vault/save', saveVaultRouter);
app.use('/api/vault/unlock', unlockVaultRouter); // NEW: Mount the new vault unlock router

// A basic test route to confirm the server is running
app.get('/', (req, res) => {
    res.send('KeyKeep Backend API is running!'); // [cite: 541]
});

// --- Handle Frontend Routing ---
// For any request that doesn't match an API route, send back the main index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});


// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`🚀 Server is listening on http://localhost:${PORT}`); // [cite: 544]
});