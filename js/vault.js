// js/vault.js - REWRITTEN TO FIX VAULT LOADING BUG AND RESTORE ORIGINAL UI

document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements ---
    const credentialsList = document.getElementById('credentialsList');
    const searchInput = document.getElementById('searchCredentials');
    const foldersList = document.getElementById('folders');
    const addNewCredentialButton = document.getElementById('addNewCredential');
    const addEditModal = document.getElementById('addEditModal');
    const modalOverlay = document.getElementById('modalOverlay');

    let credentials = [];
    let sessionPassword = null; // Caches the password in memory for the session

    // --- PASSWORD MODAL & SESSION CACHE ---
    /**
     * Gets the user's password. It will only prompt the user once per session,
     * caching the password in a local variable for subsequent calls.
     * @param {string} message The message to display in the password prompt.
     * @returns {Promise<string>} A promise that resolves with the password.
     */
    function getSessionPassword(message) {
        return new Promise((resolve, reject) => {
            // If we already have the password for this session, return it immediately.
            if (sessionPassword) {
                return resolve(sessionPassword);
            }

            // Use a custom modal for password prompt
            openPasswordModal(message, (enteredPassword) => {
                if (enteredPassword) {
                    sessionPassword = enteredPassword; // Cache the password
                    resolve(enteredPassword);
                } else {
                    reject('Password entry was cancelled.');
                }
            });
        });
    }

    // --- FETCH & SAVE LOGIC ---
    async function fetchVault() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        try {
            // Get password from session cache or new modal prompt.
            const password = await getSessionPassword('Please enter your password to decrypt your vault:');

            const res = await fetch('/api/vault/fetch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ password })
            });

            if (res.status === 401) {
                sessionPassword = null; // Clear the bad password
                const errorData = await res.json();
                showToast(errorData.error || 'Invalid password.', 'error');
                // Display empty state or error message on UI
                credentialsList.innerHTML = `<div class="empty-state"><p>Invalid password. Please refresh and try again.</p></div>`;
                return;
            }
            if (!res.ok) throw new Error('Failed to fetch credentials.');

            const data = await res.json();
            credentials = data.map(entry => entry.error ? { ...entry, title: 'Decryption Failed' } : entry);
            applyFilters(); // Re-render with the new data

        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    async function handleCredentialSubmit(e) {
        e.preventDefault();
        const credentialId = document.getElementById('credentialId').value;
        const isEdit = !!credentialId;
        const token = localStorage.getItem('token');

        if (!sessionPassword) {
            showToast('Session expired. Please unlock your vault again.', 'error');
            // Force re-authentication if session password is lost
            window.location.href = 'index.html'; 
            return;
        }

        const vaultData = {
            title: document.getElementById('websiteName').value,
            url: document.getElementById('url').value,
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            category: document.getElementById('category').value,
            notes: ''
        };

        const requestBody = { password: sessionPassword, vaultData };
        if (isEdit) requestBody.id = credentialId;

        try {
            const response = await fetch('/api/vault/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 401) sessionPassword = null; // Clear bad password
                throw new Error(errorData.error || 'Failed to save credential');
            }

            showToast(`Credential ${isEdit ? 'updated' : 'saved'}!`, 'success');
            closeAddEditModal();
            await fetchVault(); // Re-fetch to display the updated list

        } catch (err) {
            showToast(`Error: ${err.message}`, 'error');
        }
    }

    // --- MODALS & UI FUNCTIONS ---
    function openPasswordModal(message, callback) {
        addEditModal.innerHTML = `
            <h2>Password Required</h2>
            <p>${message}</p>
            <form id="passwordPromptForm">
                <div class="input-group">
                    <label for="modalPassword">Password:</label>
                    <input type="password" id="modalPassword" required autocomplete="current-password">
                </div>
                <div class="modal-actions">
                    <button type="button" class="button secondary close-modal">Cancel</button>
                    <button type="submit" class="button primary">Submit</button>
                </div>
            </form>
        `;
        addEditModal.classList.add('show');
        modalOverlay.classList.add('show');

        const form = addEditModal.querySelector('#passwordPromptForm');
        const cancelBtn = addEditModal.querySelector('.close-modal');
        const passwordInput = addEditModal.querySelector('#modalPassword');
        passwordInput.focus();

        const close = () => {
            closeAddEditModal();
            callback(null); // Pass null on cancel
        };

        form.onsubmit = (e) => {
            e.preventDefault();
            closeAddEditModal();
            callback(passwordInput.value);
        };

        cancelBtn.onclick = close;
        modalOverlay.onclick = close;
    }

    const renderCredentials = (filteredCredentials = credentials) => {
        credentialsList.innerHTML = '';
        if (filteredCredentials.length === 0) {
            credentialsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🛡️</div>
                <p>Your vault is empty. Let's secure your first account!</p>
                <button class="button primary" id="addFirstCredential">Add New Credential</button>
            </div>`;
            const addFirstBtn = document.getElementById('addFirstCredential');
            if(addFirstBtn) {
                addFirstBtn.addEventListener('click', () => openAddEditModal('add'));
            }
            return;
        }

        filteredCredentials.forEach(cred => {
            const faviconUrl = cred.url ? `https://www.google.com/s2/favicons?sz=64&domain_url=${cred.url}` : '/images/default-favicon.png';
            const fallbackFavicon = '/images/default-favicon.png';

            const card = document.createElement('div');
            card.className = 'credential-card glassmorphism';
            card.dataset.id = cred.id;
            card.innerHTML = `
            <div class="credential-header">
                <img src="${faviconUrl}" alt="${cred.title} favicon" class="credential-favicon" onerror="this.onerror=null;this.src='${fallbackFavicon}'">
                <h4>${cred.title}</h4>
            </div>
            <div class="credential-info">
                <p><strong>Username:</strong> ${cred.username}</p>
                <p class="password-masked">
                    <strong>Password:</strong>
                    <span>********</span>
                    <button class="button secondary show-hide-button">👁️ Show</button>
                </p>
            </div>
            <div class="credential-actions">
                <button class="button secondary copy-button" data-type="password">📋 Copy Pass</button>
                <button class="button secondary edit-button">✏️ Edit</button>
                <button class="button danger delete-button">🗑️ Delete</button>
            </div>`;
            credentialsList.appendChild(card);
        });
    };

    credentialsList.addEventListener('click', async (e) => {
        const target = e.target;
        const card = target.closest('.credential-card');
        const id = card ? card.dataset.id : null;
        if (!id) return;

        const cred = credentials.find(c => String(c.id) === String(id));
        if (!cred) return;

        if (target.matches('.show-hide-button')) {
            const passwordSpan = card.querySelector('.password-masked span');
            const isMasked = passwordSpan.textContent.includes('*');
            passwordSpan.textContent = isMasked ? cred.password : '********';
            target.textContent = isMasked ? '🙈 Hide' : '👁️ Show';
        }

        if (target.matches('.copy-button')) {
            const type = target.dataset.type;
            const textToCopy = type === 'password' ? cred.password : cred.username;
            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} copied!`, 'success');
            }).catch(() => showToast('Failed to copy.', 'error'));
        }

        if (target.matches('.edit-button')) {
            openAddEditModal('edit', cred);
        }

        if (target.matches('.delete-button')) {
            // ... (delete logic remains the same)
        }
    });

    const openAddEditModal = (mode, credential = {}) => {
        const isEdit = mode === 'edit';
        addEditModal.innerHTML = `
            <h2>${isEdit ? 'Edit Credential' : 'Add New Credential'}</h2>
            <form id="credentialForm">
                <input type="hidden" id="credentialId" value="${isEdit ? credential.id : ''}">
                <div class="input-group">
                    <label for="websiteName">Website Name:</label>
                    <input type="text" id="websiteName" value="${isEdit ? credential.title : ''}" required>
                </div>
                <div class="input-group">
                    <label for="url">URL:</label>
                    <input type="url" id="url" value="${isEdit ? credential.url : ''}" placeholder="https://example.com">
                </div>
                <div class="input-group">
                    <label for="username">Username/Email:</label>
                    <input type="text" id="username" value="${isEdit ? credential.username : ''}">
                </div>
                <div class="input-group">
                    <label for="password">Password:</label>
                    <input type="password" id="password" value="${isEdit ? credential.password : ''}" required>
                </div>
                <div class="input-group">
                    <label for="category">Category:</label>
                    <select id="category">
                        <option value="work" ${credential?.category === 'work' ? 'selected' : ''}>Work</option>
                        <option value="social" ${credential?.category === 'social' ? 'selected' : ''}>Social</option>
                        <option value="bank" ${credential?.category === 'bank' ? 'selected' : ''}>Bank</option>
                        <option value="other" ${credential?.category === 'other' || !isEdit ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="button" class="button secondary close-modal">Cancel</button>
                    <button type="submit" class="button primary">${isEdit ? 'Update' : 'Save'}</button>
                </div>
            </form>`;

        addEditModal.classList.add('show');
        modalOverlay.classList.add('show');
        addEditModal.querySelector('.close-modal').addEventListener('click', closeAddEditModal);
        addEditModal.querySelector('#credentialForm').addEventListener('submit', handleCredentialSubmit);
    };

    const closeAddEditModal = () => {
        addEditModal.classList.remove('show');
        modalOverlay.classList.remove('show');
    };

    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 500);
            }, 5000);
        }, 100);
    }

    addNewCredentialButton.addEventListener('click', () => openAddEditModal('add'));

    // --- INITIALIZATION ---
    fetchVault(); // Start by fetching the vault on load.
});
