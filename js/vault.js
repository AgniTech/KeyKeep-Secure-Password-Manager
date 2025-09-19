// js/vault.js - REWRITTEN TO FIX VAULT LOADING AND UI ISSUES

document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements ---
    const credentialsList = document.getElementById('credentialsList');
    const searchInput = document.getElementById('searchCredentials');
    const foldersList = document.getElementById('folders'); // For category filtering
    const addNewCredentialButton = document.getElementById('addNewCredential');
    const addEditModal = document.getElementById('addEditModal');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const deleteCredentialNameSpan = document.getElementById('deleteCredentialName');
    const cancelDeleteButton = document.getElementById('cancelDelete');
    const confirmDeleteButton = document.getElementById('confirmDelete');
    const loaderContainer = document.getElementById('loader-container');

    // Profile Dropdown Elements
    const profileButton = document.getElementById('profileButton');
    const profileDropdown = document.getElementById('profileDropdown');
    const logoutButton = document.getElementById('logoutButton');

    let credentials = [];
    let sessionPassword = null; // Caches the password in memory for the session
    let currentFilter = 'all'; // For category filtering
    let currentCredentialToDeleteId = null; // Stores the ID of the credential to be deleted

    // --- Loader Functions ---
    const showLoader = () => loaderContainer.classList.add('show');
    const hideLoader = () => loaderContainer.classList.remove('show');

    // --- MODALS & UI FUNCTIONS (DEFINITIONS FIRST) ---
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

    const closeAddEditModal = () => {
        addEditModal.classList.remove('show');
        modalOverlay.classList.remove('show');
        // Clear form fields when modal is closed
        const form = document.getElementById('credentialForm');
        if (form) {
            form.reset();
            document.getElementById('credentialId').value = ''; // Clear hidden ID
        }
    };

    const closeDeleteConfirmModal = () => {
        deleteConfirmModal.classList.remove('show');
        modalOverlay.classList.remove('show');
        currentCredentialToDeleteId = null; // Clear the stored ID
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
                    <div class="password-input">
                        <input type="password" id="password" value="${isEdit ? credential.password : ''}" required>
                        <button type="button" class="toggle-password" aria-label="Show password"><img src="images/unsee.png" alt="Show password"></button>
                    </div>
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
        // Setup password toggles for the newly added modal content
        window.setupPasswordToggles(addEditModal);
    };

    const openDeleteConfirmModal = (credentialId, credentialTitle) => {
        currentCredentialToDeleteId = credentialId;
        deleteCredentialNameSpan.textContent = credentialTitle;
        deleteConfirmModal.classList.add('show');
        modalOverlay.classList.add('show');
    };

    // --- UI RENDERING FUNCTIONS (DEFINITIONS FIRST) ---
    const renderCredentials = (filteredCredentials = credentials) => {
        hideLoader(); // Hide loader whenever we render
        console.log('renderCredentials called. filteredCredentials length:', filteredCredentials.length, 'sessionPassword:', sessionPassword);
        credentialsList.innerHTML = '';
        if (!filteredCredentials || filteredCredentials.length === 0) {
            let emptyStateContent = '';
            if (sessionPassword === null) {
                console.log('Rendering empty state: Unlock Vault scenario.');
                // User cancelled password prompt or password was incorrect
                emptyStateContent = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🔒</div>
                        <p>To open your vault, please click the button below.</p>
                        <button class="button primary" id="unlockVaultButton">Unlock Vault</button>
                    </div>`;
            } else {
                console.log('Rendering empty state: Add New Credential scenario.');
                // Vault is genuinely empty after successful unlock
                emptyStateContent = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🛡️</div>
                        <p>Your vault is empty. Let's secure your first account!</p>
                        <button class="button primary" id="addFirstCredential">Add New Credential</button>
                    </div>`;
            }
            credentialsList.innerHTML = emptyStateContent;

            const unlockVaultBtn = document.getElementById('unlockVaultButton');
            if (unlockVaultBtn) {
                unlockVaultBtn.addEventListener('click', fetchVault);
            }

            const addFirstBtn = document.getElementById('addFirstCredential');
            if(addFirstBtn) {
                addFirstBtn.addEventListener('click', () => openAddEditModal('add'));
            }
            return;
        }

        filteredCredentials.forEach(cred => {
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
                <p class="password-masked password-input">
                    <strong>Password:</strong>
                    <span>********</span>
                    <button class="button secondary show-hide-button toggle-password" aria-label="Show password"><img src="images/unsee.png" alt="Show password"></button>
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

    const applyFilters = (filterParam) => { 
        const filter = filterParam !== undefined ? filterParam : 'all'; 
        const searchTerm = searchInput.value.toLowerCase();
        let filtered = credentials;

        if (filter !== 'all') {
            filtered = filtered.filter(c => c.category === filter);
        }

        if (searchTerm) {
            filtered = filtered.filter(c =>
                (c.title && c.title.toLowerCase().includes(searchTerm)) ||
                (c.url && c.url.toLowerCase().includes(searchTerm)) ||
                (c.username && c.username.toLowerCase().includes(searchTerm))
            );
        }
        renderCredentials(filtered);
    };

    // --- PASSWORD MODAL & SESSION CACHE ---
    /**
     * Gets the user's password. It will only prompt the user once per session,
     * caching the password in a local variable for subsequent calls.
     * @param {string} message The message to display in the password prompt.
     * @returns {Promise<string>} A promise that resolves with the password.
     */
    function getSessionPassword(message) {
        return new Promise((resolve, reject) => {
            if (sessionPassword) {
                return resolve(sessionPassword);
            }

            // Use a custom modal for password prompt
            openPasswordModal(message, (enteredPassword) => {
                if (enteredPassword) {
                    sessionPassword = enteredPassword; // Cache the password
                    resolve(enteredPassword);
                } else {
                    reject(new Error('Password entry was cancelled or empty.'));
                }
            });
        });
    }

    // --- Health Analysis Logic ---
    const analyzeVaultHealth = (credentials) => {
        const totalPasswords = credentials.length;
        if (totalPasswords === 0) return { score: 100, compromised: [], reused: [], weak: [], secure: 0 };

        const compromised = credentials.filter(c => c.compromised);

        const passwordCounts = {};
        credentials.forEach(c => {
            passwordCounts[c.password] = (passwordCounts[c.password] || 0) + 1;
        });
        const reusedPasswords = Object.keys(passwordCounts).filter(p => passwordCounts[p] > 1);
        const reused = credentials.filter(c => reusedPasswords.includes(c.password));

        const weak = credentials.filter(c => isWeak(c.password));

        let score = 100;
        score -= compromised.length * 15;
        score -= reused.length * 5;
        score -= weak.length * 5;
        score = Math.max(0, Math.floor(score));

        const vulnerablePasswords = new Set([...compromised.map(c => c.id), ...reused.map(c => c.id), ...weak.map(c => c.id)]);
        const secure = totalPasswords - vulnerablePasswords.size;

        return { score, compromised, reused, weak, secure, total: totalPasswords };
    };

    const isWeak = (password) => {
        return password.length < 8 || /^[a-zA-Z]+$/.test(password) || /^[0-9]+$/.test(password);
    };

    // --- FETCH & SAVE LOGIC ---
    async function fetchVault() {
        showLoader(); // Show loader when fetching
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        let password = null;
        console.log('fetchVault: sessionPassword before getSessionPassword:', sessionPassword);
        try {
            password = await getSessionPassword('Please enter your password to decrypt your vault:');
        } catch (err) {
            // User cancelled the password modal
            showToast(err.message, 'info'); // Use info for cancellation, not error
            credentials = []; // Ensure credentials array is empty
            sessionPassword = null; // Explicitly set to null on cancellation
            console.log('fetchVault: Password prompt cancelled. sessionPassword set to:', sessionPassword);
            applyFilters(currentFilter); // Pass currentFilter explicitly
            hideLoader(); // Hide loader on error
            return;
        }

        // If password is null (e.g., user cancelled the modal) - redundant with catch block but good for clarity
        if (!password) {
            credentials = []; // Ensure credentials array is empty
            sessionPassword = null; // Explicitly set to null if password is empty
            console.log('fetchVault: Password empty. sessionPassword set to:', sessionPassword);
            applyFilters(currentFilter); // Pass currentFilter explicitly
            hideLoader(); // Hide loader on error
            return;
        }

        try {
            const res = await fetch('/api/vault/fetch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ password })
            });

            if (res.status === 401) {
                sessionPassword = null; // Clear the bad password
                const errorData = await res.json();
                showToast(errorData.error || 'Invalid password.', 'error');
                credentials = []; // Ensure credentials array is empty
                console.log('fetchVault: 401 Unauthorized. sessionPassword set to:', sessionPassword);
                applyFilters(currentFilter); // Pass currentFilter explicitly
                hideLoader(); // Hide loader on error
                return;
            }
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to fetch credentials.');
            }

            const data = await res.json();
            credentials = data.map(entry => entry.error ? { ...entry, title: 'Decryption Failed', username: '[Encrypted]', password: '[Encrypted]' } : entry);
            console.log('fetchVault: Credentials fetched successfully. sessionPassword:', sessionPassword);

            // Analyze and update profile card
            const health = analyzeVaultHealth(credentials);
            document.getElementById('savedPasswords').textContent = health.total;
            document.getElementById('securePasswords').textContent = health.secure;
            document.getElementById('securityScore').textContent = `${health.score}%`;
            const verificationStatus = document.getElementById('verificationStatus');
            if (health.score >= 80) {
                verificationStatus.textContent = 'Verified ✔️';
                verificationStatus.style.color = 'green';
            } else {
                verificationStatus.textContent = 'Not Verified ❌';
                verificationStatus.style.color = 'red';
            }

            applyFilters(currentFilter); // Re-render with the new data, applying current filters

        } catch (err) {
            console.error('Fetch error:', err);
            showToast('An unexpected error occurred while fetching the vault: ' + err.message, 'error');
            credentials = []; // Ensure credentials array is empty
            sessionPassword = null; // Explicitly set to null on general fetch error
            console.log('fetchVault: General fetch error. sessionPassword set to:', sessionPassword);
            applyFilters(currentFilter); // Pass currentFilter explicitly
            hideLoader(); // Hide loader on error
        }
    }

    async function executeDelete(credentialId) {
        showLoader(); // Show loader
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        try {
            const response = await fetch('/api/vault/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ id: credentialId, password: sessionPassword })
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 401) sessionPassword = null; // Clear bad password
                throw new Error(errorData.error || 'Failed to delete credential');
            }

            showToast(`Credential deleted!`, 'success');
            closeDeleteConfirmModal();
            await fetchVault(); // Re-fetch to display the updated list

        } catch (err) {
            hideLoader(); // Hide loader on error
            showToast(`Error: ${err.message}`, 'error');
        }
    }

    async function handleCredentialSubmit(e) {
        e.preventDefault();
        showLoader(); // Show loader
        const credentialId = document.getElementById('credentialId').value;
        const isEdit = !!credentialId;
        const token = localStorage.getItem('token');

        if (!sessionPassword) {
            showToast('Session expired. Please unlock your vault again.', 'error');
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
            hideLoader(); // Hide loader on error
            showToast(`Error: ${err.message}`, 'error');
        }
    }

    // --- EVENT LISTENERS (ATTACHMENTS AFTER ALL DEFINITIONS) ---
    credentialsList.addEventListener('click', async (e) => {
        const target = e.target;
        const card = target.closest('.credential-card');
        const id = card ? card.dataset.id : null;
        if (!id) return;

        const cred = credentials.find(c => String(c.id) === String(id));
        if (!cred) return;

        if (target.matches('.show-hide-button') || target.closest('.show-hide-button')) {
            const button = target.closest('.show-hide-button');
            const passwordSpan = card.querySelector('.password-masked span');
            const iconImg = button.querySelector('img');
            const isMasked = passwordSpan.textContent.includes('********');
            
            passwordSpan.textContent = isMasked ? cred.password : '********';
            if (iconImg) {
                iconImg.src = isMasked ? 'images/see.png' : 'images/unsee.png';
                iconImg.alt = isMasked ? 'Hide password' : 'Show password';
                button.setAttribute('aria-label', isMasked ? 'Hide password' : 'Show password');
            }
        }

        if (target.matches('.copy-button')) {
            const type = target.dataset.type;
            const textToCopy = type === 'password' ? cred.password : cred.username;
            const originalButtonText = target.innerHTML;

            navigator.clipboard.writeText(textToCopy).then(() => {
                target.innerHTML = `📋 Copied!`; // Change text to Copied!
                showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} copied!`, 'success');
                setTimeout(() => {
                    target.innerHTML = originalButtonText; // Revert text after a delay
                }, 2000); // 2 seconds delay
            }).catch(() => {
                showToast('Failed to copy.', 'error');
                target.innerHTML = originalButtonText; // Revert text even on failure
            });
        }

        if (target.matches('.edit-button')) {
            openAddEditModal('edit', cred);
        }

        if (target.matches('.delete-button')) {
            openDeleteConfirmModal(cred.id, cred.title);
        }
    });

    // Event listeners for the delete confirmation modal
    cancelDeleteButton.addEventListener('click', closeDeleteConfirmModal);
    confirmDeleteButton.addEventListener('click', () => {
        if (currentCredentialToDeleteId) {
            executeDelete(currentCredentialToDeleteId);
        }
    });

    addNewCredentialButton.addEventListener('click', () => openAddEditModal('add'));

    // --- Profile Dropdown Logic ---
    profileButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent document click from closing it immediately
        profileDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (event) => {
        if (!profileDropdown.contains(event.target) && !profileButton.contains(event.target)) {
            profileDropdown.classList.remove('show');
        }
    });

    // Populate user name
    const loadProfileCardData = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch('/api/user/profile', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const user = await response.json();
                document.getElementById('profileNameLink').textContent = user.name || 'User';
                const savedImage = localStorage.getItem('profileImage');
                if (savedImage) {
                    document.getElementById('profileImage').src = savedImage;
                }
            }
        } catch (error) {
            console.error('Error fetching profile data for card:', error);
        }
    };

    // Logout functionality
    logoutButton.addEventListener('click', (event) => {
        event.preventDefault();
        showLoader(); // Show loader on logout
        localStorage.removeItem('token'); // Clear authentication token
        localStorage.removeItem('userEmail'); // Clear stored email
        sessionPassword = null; // Clear session password
        window.location.href = 'index.html'; // Redirect to login page
    });

    // --- CATEGORY FILTERING & SEARCH EVENT LISTENERS (NOW AFTER applyFilters DEFINITION) ---
    foldersList.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            document.querySelectorAll('#folders a').forEach(a => a.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            applyFilters(currentFilter); // Pass currentFilter explicitly
        }
    });

    searchInput.addEventListener('input', () => applyFilters(currentFilter)); // Pass currentFilter explicitly

    // --- Profile Image Menu Logic ---
    const profileImage = document.getElementById('profileImage');
    const profileImageMenu = document.getElementById('profileImageMenu');

    if (profileImage && profileImageMenu) {
        profileImage.addEventListener('click', (event) => {
            event.stopPropagation();
            profileImageMenu.style.display = profileImageMenu.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', (event) => {
            if (!profileImageMenu.contains(event.target) && !profileImage.contains(event.target)) {
                profileImageMenu.style.display = 'none';
            }
        });
    }

    // Show loader for any navigation away from the vault
    document.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('click', (e) => {
            // Check if it's a link that navigates away
            if (el.tagName === 'A' && el.href && el.target !== '_blank') {
                // Don't show for in-page links
                if (el.href.startsWith('#') || el.href.includes('javascript:')) return;
                showLoader();
            }
        });
    });

    // Hide loader when the page is fully loaded (e.g., when navigating back)
    window.addEventListener('load', hideLoader);

    // --- INITIALIZATION ---
    fetchVault(); // Start by fetching the vault on load.
    loadProfileCardData();
});
