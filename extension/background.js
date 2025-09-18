const API_BASE_URL = 'http://localhost:5000/api';

// In-memory state variables. These are cleared when the browser is closed.
let sessionPassword = null;
let jwtToken = null;

// --- State Management & Utility Functions ---

// Function to check the initial state when the extension starts
async function initializeState() {
    const result = await chrome.storage.local.get('jwt');
    if (result.jwt) {
        jwtToken = result.jwt;
    }
}

// --- API Communication ---

async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || 'Login failed');

        // On successful login, store the token and set the session password
        jwtToken = data.token;
        sessionPassword = password;
        await chrome.storage.local.set({ jwt: data.token });
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function unlock(password) {
    if (!jwtToken) return { success: false, error: 'Not logged in.' };

    // To verify the password, we try to fetch the vault with it.
    const response = await fetch(`${API_BASE_URL}/vault/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
        body: JSON.stringify({ password })
    });

    if (response.ok) {
        sessionPassword = password; // Password is correct, cache it in memory
        return { success: true };
    } else {
        return { success: false, error: 'Invalid master password.' };
    }
}

async function logout() {
    jwtToken = null;
    sessionPassword = null;
    await chrome.storage.local.remove('jwt');
}

async function fetchVault() {
    if (!jwtToken || !sessionPassword) {
        return []; // Or an error object
    }
    try {
        const response = await fetch(`${API_BASE_URL}/vault/fetch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
            body: JSON.stringify({ password: sessionPassword })
        });
        if (!response.ok) return [];
        const data = await response.json();
        return data;
    } catch (e) {
        return [];
    }
}

// --- Message Listener: The Hub for All Popup Communication ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_STATE') {
        sendResponse({
            isLoggedIn: !!jwtToken,
            isUnlocked: !!sessionPassword
        });
    } else if (request.type === 'LOGIN') {
        login(request.payload.email, request.payload.password).then(sendResponse);
        return true; // Indicates an async response
    } else if (request.type === 'UNLOCK') {
        unlock(request.payload.password).then(sendResponse);
        return true; // Indicates an async response
    } else if (request.type === 'LOGOUT') {
        logout().then(() => sendResponse({ success: true }));
        return true;
    } else if (request.type === 'FETCH_VAULT') {
        fetchVault().then(sendResponse);
        return true;
    }
    return false;
});

// --- Extension Lifecycle Events ---

// When the extension is first installed or updated
chrome.runtime.onInstalled.addListener(() => {
    initializeState();
});

// When the browser starts up
chrome.runtime.onStartup.addListener(() => {
    initializeState();
});
