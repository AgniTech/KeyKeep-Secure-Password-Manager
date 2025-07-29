// // backend/models/Vault.js
// import mongoose from 'mongoose';

// const VaultSchema = new mongoose.Schema({
//   email: { type: String, required: true },
//   site: { type: String, required: true },
//   encryptedSecret: { type: String, required: true },
//   nonce: { type: String, required: true },
// }, { timestamps: true });

// export default mongoose.models.Vault || mongoose.model('Vault', VaultSchema);
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
  url: {
    type: String,
    default: ''
  },
  username: {
    type: String,
    default: ''
  },
  encryptedSecret: {
    type: String,
    required: true
  },
  nonce: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'other'
  },
  tags: {
    type: [String],
    default: []
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });



export default mongoose.models.Vault || mongoose.model('Vault', VaultSchema);
