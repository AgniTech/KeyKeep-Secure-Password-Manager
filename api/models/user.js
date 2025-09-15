// api/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    rsaPublicKey: {
        type: String,
        required: true
    },
    encryptedRsaPrivateKey: {
        type: String,
        required: true
    },
    privateKeyIv: {
        type: String,
        required: true
    },
    privateKeyAuthTag: {
        type: String,
        required: true
    },
    argon2Salt: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    profileInitialized: {
        type: Boolean,
        default: false
    },
    name: {
        type: String,
        trim: true
    },
    dob: {
        type: Date
    },
    pin: {
        type: String,
        trim: true
    },
    petName: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    }
});

// Method to compare master password (for login)
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
