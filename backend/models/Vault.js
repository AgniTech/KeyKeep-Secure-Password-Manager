import mongoose from 'mongoose';

const VaultSchema = new mongoose.Schema({
  email: String,
  site: String,
  ciphertext: String,
  nonce: String
});

export default mongoose.models.Vault || mongoose.model('Vault', VaultSchema);
