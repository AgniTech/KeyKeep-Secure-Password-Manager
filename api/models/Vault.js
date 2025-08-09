// backend/models/Vault.js
import mongoose from 'mongoose';

const VaultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  site: {
    type: String,
    required: true
  },
  secret: {
    type: String,
    required: true
  }
});

export default mongoose.models.Vault || mongoose.model('Vault', VaultSchema);
