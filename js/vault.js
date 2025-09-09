// js/vault.js - REWRITTEN FOR A BETTER UX

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const credentialsContainer = document.getElementById('credentialsContainer');
    const passwordUnlockContainer = document.getElementById('passwordUnlockContainer');
    const passwordUnlockForm = document.getElementById('passwordUnlockForm');
    const credentialsList = document.getElementById('credentialsList');
    const searchInput = document.getElementById('searchCredentials');
    const addNewCredentialButton = document.getElementById('addNewCredential');
    const addEditModal = document.getElementById('addEditModal');
    const modalOverlay = document.getElementById('modalOverlay');

    let credentials = [];
    let sessionPassword = null; // Caches the password in memory for the session

    // --- CORE LOGIC ---

    // Show the initial password unlock screen
    function showUnlockScreen() {
        credentialsContainer.style.display = 'none';
        passwordUnlockContainer.style.display = 'flex';
    }

    // Show the main vault view
    function showVault() {
        passwordUnlockContainer.style.display = 'none';
        credentialsContainer.style.display = 'block';
    }

    // Handles the initial password submission to unlock the vault
    passwordUnlockForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const passwordInput = document.getElementById('unlockPassword');
        const password = passwordInput.value;
        const errorContainer = document.getElementById('unlockError');
        errorContainer.textContent = '';

        if (!password) {
            errorContainer.textContent = 'Please enter your password.';
            return;
        }

        const success = await fetchVault(password);

        if (success) {
            sessionPassword = password; // Cache the password on success
            showVault();
        } else {
            errorContainer.textContent = 'Invalid password. Please try again.';
            passwordInput.value = ''; // Clear the incorrect password
            passwordInput.focus();
        }
    });

    async function fetchVault(password) {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'index.html';
            return false;
        }

        try {
            const res = await fetch('/api/vault/fetch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ password })
            });

            if (!res.ok) {
                return false; // Let the caller handle the UI for a failed attempt
            }

            const data = await res.json();
            credentials = data.map(entry => entry.error ? { ...entry, title: 'Decryption Failed' } : entry);
            renderCredentials(); // Re-render with the new data
            return true;

        } catch (err) {
            console.error('Fetch error:', err);
            showToast('An unexpected error occurred while fetching the vault.', 'error');
            return false;
        }
    }

    async function handleCredentialSubmit(e) {
        e.preventDefault();
        const credentialId = document.getElementById('credentialId').value;
        const isEdit = !!credentialId;
        const token = localStorage.getItem('token');

        // This function now relies on the sessionPassword being cached.
        if (!sessionPassword) {
            showToast('Session expired. Please refresh and unlock your vault again.', 'error');
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
            // Re-fetch the vault to show the latest data
            const success = await fetchVault(sessionPassword);
            if (!success) {
                showToast('Could not refresh vault. Please refresh the page.', 'error');
                showUnlockScreen(); // Force re-authentication if fetch fails
            }

        } catch (err) {
            showToast(`Error: ${err.message}`, 'error');
        }
    }

    // --- UI RENDERING & EVENT LISTENERS ---

    const renderCredentials = () => {
        const credentialsGrid = document.getElementById('credentialsList');
        credentialsGrid.innerHTML = '';
        if (credentials.length === 0) {
            credentialsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🛡️</div>
                <p>Your vault is empty. Let's secure your first account!</p>
                <button class="button primary" id="addFirstCredential">Add New Credential</button>
            </div>`;
            document.getElementById('addFirstCredential').addEventListener('click', () => openAddEditModal('add'));
            return;
        }

        credentials.forEach(cred => {
            const faviconUrl = cred.url ? `https://www.google.com/s2/favicons?sz=64&domain_url=${cred.url}` : '/images/default-favicon.png';
            const card = document.createElement('div');
            card.className = 'credential-card glassmorphism';
            card.dataset.id = cred.id;
            card.innerHTML = `
            <div class="credential-header">
                <img src="${faviconUrl}" alt="${cred.title} favicon" class="credential-favicon" onerror="this.onerror=null;this.src='/images/default-favicon.png'">
                <h4>${cred.title}</h4>
            </div>
            <div class="credential-info">
                <p><strong>Username:</strong> ${cred.username}</p>
                <p class="password-masked"><strong>Password:</strong> <span>********</span></p>
            </div>
            <div class="credential-actions">
                <button class="button secondary copy-button" data-type="password">📋 Copy Pass</button>
                <button class="button secondary show-hide-button">👁️ Show</button>
                <button class="button secondary edit-button">✏️ Edit</button>
                <button class="button danger delete-button">🗑️ Delete</button>
            </div>`;
            credentialsGrid.appendChild(card);
        });
    };

    credentialsList.addEventListener('click', async (e) => {
        const target = e.target;
        const card = target.closest('.credential-card');
        if (!card) return;
        const id = card.dataset.id;
        const cred = credentials.find(c => String(c.id) === String(id));
        if (!cred) return;

        if (target.matches('.show-hide-button')) {
            const passwordSpan = card.querySelector('.password-masked span');
            const isMasked = passwordSpan.textContent.includes('*');
            passwordSpan.textContent = isMasked ? cred.password : '********';
            target.textContent = isMasked ? '🙈 Hide' : '👁️ Show';
        }

        if (target.matches('.copy-button')) {
            navigator.clipboard.writeText(cred.password).then(() => showToast('Password copied!', 'success'));
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
        toast.className = `toast ${type}`;
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
    showUnlockScreen(); // Start by showing the password form.
});
