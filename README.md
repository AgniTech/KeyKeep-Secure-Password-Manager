# CryptoVault2

**Secure Password Manager** built with Node.js, Express, MongoDB, and vanilla JavaScript.

---

## 🔑 Features

- **User Registration & Login**  
  • Bcrypt-hashed master passwords  
  • JWT-based authentication  
- **Protected Routes**  
  • Client-side redirect for protected pages  
  • Server-side JWT middleware  
- **Encrypted Vault Storage**  
  • AES encryption (ciphertext + nonce)  
  • MongoDB persistence via Mongoose  
- **Password Utilities**  
  • Password generator  
  • Password health dashboard  
- **Responsive UI**  
  • Static HTML/CSS/JS stack  
  • Modular page templates  

---

## 📁 Project Structure

CryptoVault2/
├── api/
│ ├── auth/
│ │ ├── register.js # User signup API
│ │ └── login.js # User login API (returns JWT)
│ └── vault/
│ └── save.js # Save/encrypt vault entry API
├── backend/
│ ├── models/
│ │ ├── User.js # Mongoose schema for users
│ │ └── Vault.js # Mongoose schema for vault entries
│ ├── util/
│ │ ├── db.js # MongoDB connection helper
│ │ ├── encryption.js # AES encryption/decryption
│ │ └── salsa.js # Additional encryption utils
│ ├── server.js # Express app & route setup
│ └── .env # Environment variables (MONGO_URI, JWT_SECRET, ENCRYPTION_KEY)
├── css/ # Page-specific styles
├── images/ # Icons & backgrounds
├── js/ # Frontend logic (auth, vault, generator, health, etc.)
├── *.html # Static pages (index.html, vault.html, etc.)
├── package.json # Project metadata & scripts
└── README.md # Project overview (this file)


---

