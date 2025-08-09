// api/models/Vault.js
import mongoose from 'mongoose';

const VaultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // Allow empty strings or valid URLs
        if (!v) return true;
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Please enter a valid URL'
    }
  },
  username: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['work', 'social', 'bank', 'other'],
    default: 'other'
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  // Legacy field for backward compatibility
  site: {
    type: String
  },
  secret: {
    type: String
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
