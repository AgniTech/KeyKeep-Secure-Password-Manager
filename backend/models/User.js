// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    masterPassword: {
        type: String,
        required: true,
        minlength: 8 // Enforce minimum length
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash master password before saving (pre-save hook)
UserSchema.pre('save', async function(next) {
    if (!this.isModified('masterPassword')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.masterPassword = await bcrypt.hash(this.masterPassword, salt);
    next();
});

// Method to compare master password (for login)
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.masterPassword);
};

module.exports = mongoose.model('User', UserSchema);
