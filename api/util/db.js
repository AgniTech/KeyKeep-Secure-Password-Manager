// File: api/util/db.js

import mongoose from 'mongoose';

let cached = global._mongo;
if (!cached) {
  cached = global._mongo = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
    console.log(`MONGO_URI: ${MONGO_URI}`);
    if (!MONGO_URI) {
      throw new Error('MONGODB_URI or MONGO_URI is not defined in environment variables');
    }

    // No need for useNewUrlParser or useUnifiedTopology in mongoose v6+
    cached.promise = mongoose.connect(MONGO_URI);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
