import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Load env vars (from SWA config)
dotenv.config();

// Import your existing routes
import authRoutes from "../backend/routes/authRoutes.js";
import vaultRoutes from "../backend/routes/vaultRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => console.error("❌ MongoDB error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/vault", vaultRoutes);

// Azure Functions binding
import { app as funcApp, HttpHandler } from "@azure/functions";
export default new HttpHandler(funcApp, app);
