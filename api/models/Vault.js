// api/models/Vault.js
import mongoose from 'mongoose';

const VaultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  encryptedVaultData: {
    type: String,
    required: true
  },
  encryptedVaultKey: {
    type: String,
    required: true
  },
  vaultNonce: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
VaultSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Vault || mongoose.model('Vault', VaultSchema);
