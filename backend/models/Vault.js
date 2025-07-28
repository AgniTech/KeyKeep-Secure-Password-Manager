// backend/models/Vault.js
import mongoose from 'mongoose';

const VaultSchema = new mongoose.Schema({
  email: { type: String, required: true },
  site: { type: String, required: true },
  encryptedSecret: { type: String, required: true },
  nonce: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Vault || mongoose.model('Vault', VaultSchema);
