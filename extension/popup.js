document.addEventListener('DOMContentLoaded', async () => {
    // --- View Elements ---
    const initialView = document.getElementById('initial-view');
    const loginView = document.getElementById('login-view');
    const lockedView = document.getElementById('locked-view');
    const unlockedView = document.getElementById('unlocked-view');

    // --- Button Elements ---
    const showLoginViewBtn = document.getElementById('show-login-view-btn');
    const registerBtn = document.getElementById('register-btn');
    const loginBtn = document.getElementById('login-btn');
    const backToInitialViewBtn = document.getElementById('back-to-initial-view');
    const unlockBtn = document.getElementById('unlock-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // --- Input & Error Elements ---
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const unlockPasswordInput = document.getElementById('unlock-password');
    const loginError = document.getElementById('login-error');
    const unlockError = document.getElementById('unlock-error');

    // --- View Switching Logic ---
    const showView = (view) => {
        [initialView, loginView, lockedView, unlockedView].forEach(v => v.style.display = 'none');
        view.style.display = 'block';
    };

    showLoginViewBtn.addEventListener('click', () => showView(loginView));
    backToInitialViewBtn.addEventListener('click', () => showView(initialView));

    // --- Event Handlers ---

    // 1. Register Button: Opens the website's registration page
    registerBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'http://127.0.0.1:5500/register.html' }); // Adjust URL if needed
    });

    // 2. Login Button: Sends credentials to the background script
    loginBtn.addEventListener('click', async () => {
        loginError.textContent = '';
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            loginError.textContent = 'Email and password are required.';
            return;
        }

        // The actual login logic will be in background.js
        // We just send a message to it.
        const response = await chrome.runtime.sendMessage({ 
            type: 'LOGIN', 
            payload: { email, password } 
        });

        if (response.success) {
            window.location.reload(); // Reload the popup to show the unlocked view
        } else {
            loginError.textContent = response.error || 'Login failed.';
        }
    });

    // 3. Unlock Button: Sends the master password to the background script
    unlockBtn.addEventListener('click', async () => {
        unlockError.textContent = '';
        const password = unlockPasswordInput.value;

        if (!password) {
            unlockError.textContent = 'Master password is required.';
            return;
        }

        const response = await chrome.runtime.sendMessage({ 
            type: 'UNLOCK', 
            payload: { password } 
        });

        if (response.success) {
            window.location.reload(); // Reload to show the unlocked view
        } else {
            unlockError.textContent = response.error || 'Incorrect password.';
        }
    });

    // 4. Logout Button
    logoutBtn.addEventListener('click', async () => {
        await chrome.runtime.sendMessage({ type: 'LOGOUT' });
        window.location.reload(); // Reload to show the initial view
    });

    // --- Initial State Check ---
    // When the popup opens, ask the background script for the current state.
    const state = await chrome.runtime.sendMessage({ type: 'GET_STATE' });

    if (state.isLoggedIn && state.isUnlocked) {
        showView(unlockedView);
        // Fetch and render vault content
        const vaultContent = document.getElementById('vault-content');
        vaultContent.innerHTML = '<p>Loading vault...</p>';
        const credentials = await chrome.runtime.sendMessage({ type: 'FETCH_VAULT' });
        if (credentials && credentials.length > 0) {
            vaultContent.innerHTML = credentials.map(c => `<div>${c.title}</div>`).join('');
        } else {
            vaultContent.innerHTML = '<p>Your vault is empty.</p>';
        }
    } else if (state.isLoggedIn && !state.isUnlocked) {
        showView(lockedView);
    } else {
        showView(initialView);
    }
});
