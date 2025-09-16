# 🔐 KeyKeep – Secure Password Manager

**KeyKeep** is a modern, secure, and client-centric password manager built with a focus on privacy and ease of use. It leverages client-side encryption to ensure that your sensitive data is protected before it ever leaves your device. With a sleek, professional interface and a robust set of features, KeyKeep provides a reliable solution for managing your digital secrets.

---

## ✨ Features

- **Client-Side Encryption**: All your credentials are encrypted and decrypted locally in your browser using **libsodium**, a modern and easy-to-use cryptographic library. Your master password is the key, and it's never sent to the server.
- **Secure User Authentication**: JWT-based authentication ensures that only you can access your vault. Passwords are hashed using **bcrypt** before being stored.
- **Intuitive Vault Management**: Easily add, edit, delete, and search for your credentials. The interface is designed to be fast, responsive, and easy to navigate.
- **Professional & Secure UI**: A redesigned user interface with a professional color palette, frosted glass effects, and a dark, tech-grid background.
- **Password Generator**: Create strong, random, and unique passwords with customizable length and character types.
- **Password Health Analysis**: Get a comprehensive overview of your password security with a health score, and identify weak, reused, or compromised passwords.
- **Profile Customization**: Personalize your profile by adding a name, date of birth, and a profile picture with upload, change, and remove functionalities.
- **Loading Animations**: Smooth loading animations provide a better user experience during page transitions and data operations.
- **Cross-Session Persistence**: Your profile picture and settings are saved in local storage, ensuring they persist between sessions.

---

## 🛠️ Tech Stack

| Category          | Technology                                       |
| ----------------- | ------------------------------------------------ |
| **Frontend**      | HTML5, CSS3, Vanilla JavaScript                  |
| **Backend**       | Node.js, Express.js                              |
| **Database**      | MongoDB with Mongoose                            |
| **Encryption**    | **libsodium-wrappers** for client-side encryption |
| **Authentication**| JSON Web Tokens (JWT), bcrypt for password hashing|

---

## 📂 Project Structure

```
/KeyKeep-Secure-Password-Manager
|-- /api/                 # Backend API routes
|   |-- /auth/            # Authentication routes (login, register)
|   |-- /models/          # Mongoose data models
|   |-- /user/            # User profile routes
|   `-- /vault/           # Vault management routes
|-- /css/                 # CSS stylesheets
|   |-- auth.css
|   |-- loader.css
|   |-- profile-card.css
|   |-- settings.css
|   |-- style.css
|   `-- vault.css
|-- /images/              # Images and icons
|-- /js/                  # Frontend JavaScript files
|   |-- auth.js
|   |-- profile.js
|   |-- protect.js
|   |-- script.js
|   |-- settings.js
|   `-- vault.js
|-- index.html            # Login page
|-- register.html         # Registration page
|-- vault.html            # Main vault page
|-- settings.html         # Settings page
|-- Profile.html          # Profile completion page
|-- backend/              # Node.js backend server
|-- package.json          # Project dependencies
`-- README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (running locally or on a cloud service like MongoDB Atlas)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/KeyKeep-Secure-Password-Manager.git
    cd KeyKeep-Secure-Password-Manager
    ```

2.  **Install backend dependencies:**
    ```bash
    cd backend
    npm install
    ```

3.  **Create a `.env` file** in the `backend` directory and add the following environment variables:
    ```env
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_super_secret_jwt_key
    PORT=5000
    ```

4.  **Start the backend server:**
    ```bash
    node server.js
    ```

5.  **Open the application** by launching the `index.html` file in your browser. It's recommended to use a live server extension in your code editor to handle the routing correctly.

---

## 📸 Screenshots

*(Placeholder for screenshots of the application)*

- **Login Page**
- **Registration Page**
- **Vault Dashboard**
- **Settings Page**
- **Profile Page**

---

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 📬 Contact

**Dinesh Vishwakarma**

- **GitHub**: [@DInesh-Vishwakarma174](https://github.com/DInesh-Vishwakarma174)
- **Email**: yogeshvishwakarma074@gmail.com
