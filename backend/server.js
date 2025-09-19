// // backend/server.js
// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import { connectDB } from '../api/util/db.js';
//
// // Load environment variables
// dotenv.config();
//
// const app = express();
// const PORT = process.env.PORT || 5000;
//
// // --- Middleware ---
// app.use(express.json());
// app.use(cors());
//
// // --- Database Connection ---
// connectDB()
//   .then(() => console.log('✅ MongoDB connected'))
//   .catch(err => {
//     console.error('❌ MongoDB connection error:', err);
//     process.exit(1);
//   });
//
// // --- Routes ---
// // Basic test route
// app.get('/', (req, res) => {
//   res.send('CryptoVault Backend API is running!');
// });
//
// // API routes - these will be handled by Vercel serverless functions
// // The actual endpoints are in the /api directory
//
// // --- Start the Server ---
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
//
// backend/server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../api/util/db.js';

// --- IMPORT YOUR API ROUTE HANDLERS ---
import loginHandler from '../api/auth/login.js';
import registerHandler from '../api/auth/register.js';
import profileHandler from '../api/user/profile.js';
import vaultSaveHandler from '../api/vault/save.js';
import vaultFetchHandler from '../api/vault/fetch.js';
import vaultDeleteHandler from '../api/vault/delete.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// --- Database Connection ---
connectDB()
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// --- API ROUTES ---
// Tell Express to use your handlers for the correct paths and methods
app.post('/api/auth/login', loginHandler);
app.post('/api/auth/register', registerHandler);

app.get('/api/user/profile', profileHandler);
app.put('/api/user/profile', profileHandler);

app.post('/api/vault/save', vaultSaveHandler);
app.post('/api/vault/fetch', vaultFetchHandler);
app.post('/api/vault/delete', vaultDeleteHandler);


// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});