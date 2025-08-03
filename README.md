
# 🔐 CryptoVault2 – Secure Password Vault

**CryptoVault2** is a secure, client-focused password manager built using Node.js, MongoDB, and frontend technologies. It allows users to safely store, manage, and generate strong passwords with local encryption, offering a sleek and responsive interface with modern security practices.

---

## 📌 Overview

CryptoVault2 is a full-stack password vault application designed to:
- Store users' credentials securely
- Ensure client-side encryption and privacy
- Provide essential tools like password generation and health checks
- Keep user data isolated and authenticated via JWT

This project aims to balance security and usability, enabling users to manage sensitive information without depending on third-party password managers.

---

## 🚀 Features

- 🔐 **User Authentication**  
  Secure registration and login using JWT tokens.

- 🧠 **Vault**  
  Add, view, edit, and delete credentials per user. Data is encrypted before storage.

- 🔑 **Password Generator**  
  Create complex and secure passwords using customizable rules.

- 🧬 **Password Health Checker**  
  Visual feedback on password strength and duplicate usage detection.

- 🛡️ **Client-Side Encryption**  
  All sensitive data is encrypted locally before being sent to the server.

- ⚙️ **User Settings**  
  Modify preferences, log out, and manage your vault easily.

- 📁 **LocalStorage Auth Tokens**  
  Used to maintain secure sessions across pages.

---

## 🧩 Folder Structure

```bash
CryptoVault2-main/
├── api/
│   ├── auth/
│   ├── models/
│   ├── util/
│   └── vault/
├── backend/
│   └── node_modules/
├── css/
├── images/
├── js/
├── node_modules/
├── *.html
└── README.md
```

---

## 🔐 Encryption Details

CryptoVault2 uses **libsodium** (via `libsodium-wrappers`) for strong encryption.

### 🔸 What is encrypted?
- Vault entries (site, username, password) are encrypted **on the client side** using symmetric encryption.
- The encrypted data is sent to the backend and stored in MongoDB.

### 🔸 Libraries Used:
- `libsodium` / `sodium-native` for encryption
- `bcrypt` for password hashing
- JWT for token-based user sessions

---

## 🛠️ How It Works

1. **User Registers / Logs In**
   - Credentials are verified, and a JWT token is returned.
   - Token is stored in localStorage.

2. **Vault Operations**
   - Users interact with `vault.html`, sending encrypted data using `js/vault.js`.
   - Data is encrypted on the frontend and saved via `/api/vault/save`.

3. **Password Generation**
   - Handled by `js/generator.js` and `generator.html`, using random rules and entropy.

4. **Password Health**
   - Analyzed client-side by `js/health.js` for weak/duplicate passwords.

5. **Settings & Logout**
   - Managed in `settings.html`, JWT is cleared from localStorage.

---

## 🧪 Technologies Used

| Frontend         | Backend              | Security              |
|------------------|----------------------|------------------------|
| HTML/CSS/JS      | Node.js + Express.js | bcrypt, JWT, libsodium|
| Vanilla JavaScript | MongoDB (via Mongoose) | Encryption via Sodium |

---

## 🧰 Installation & Running Locally

### Prerequisites:
- Node.js (v18+)
- MongoDB running locally or remotely

### Setup Instructions:

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/CryptoVault2.git
cd CryptoVault2

# 2. Install dependencies
cd backend
npm install

# 3. Create .env file in /backend with:
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
PORT=5000

# 4. Start the server
node server.js
```

### Open in browser:
```
Open index.html with Live Server or directly in browser
```

---

## 🧪 Sample `.env` File

```env
MONGO_URI=mongodb://localhost:27017/crypto-vault
JWT_SECRET=yourVerySecretKey
PORT=5000
```

---

## 📷 Screenshots

> (Add screenshots of Login, Vault, Generator, Health, Settings pages here)

---

## 🧠 Future Improvements

- 🔁 Bi-directional sync with cloud services
- 📲 Mobile-first PWA
- 👁️‍🗨️ 2FA Authentication
- 🌐 Browser extension

---

## 🤝 Contributing

Feel free to fork the repo, create a branch, and submit a PR.  
Open issues for bugs, feature requests, or improvements.

---

## 📜 License

This project is licensed under the MIT License.

---

## 📬 Contact

**Maintainer:** [Your Name]  
GitHub: [github.com/yourusername](https://github.com/yourusername)  
Email: your@email.com

---
