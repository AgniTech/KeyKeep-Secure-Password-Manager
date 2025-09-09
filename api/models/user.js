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
    }
});

// Method to compare master password (for login)
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
