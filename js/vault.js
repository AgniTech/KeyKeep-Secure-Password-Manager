// js/vault.js

document.addEventListener('DOMContentLoaded', () => {
    const credentialsList = document.getElementById('credentialsList');
    const searchInput = document.getElementById('searchCredentials');
    const foldersList = document.getElementById('folders');
    const addEditModal = document.getElementById('addEditModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const addNewCredentialButton = document.getElementById('addNewCredential');

    let credentials = []; // Will be fetched from backend
    // --- No encryption - direct storage ---


    async function fetchVault() {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast("Unauthorized: Please log in", 'error');
            return;
        }

        try {
            const res = await fetch('/api/vault/fetch', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                throw new Error('Failed to fetch credentials');
            }

            const data = await res.json();
            console.log('Fetched vault data:', data.length, 'entries');
            
            // Map data into frontend-friendly format
            credentials = data.map((entry, index) => ({
                id: entry.id || index,
                title: entry.title || entry.site || 'Untitled',
                url: entry.url || '',
                username: entry.username || '',
                password: entry.password || entry.secret || '',
                category: entry.category || 'other',
                tags: [],
                notes: entry.notes || '',
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt
            }));


            applyFilters();
        } catch (err) {
            console.error('Fetch error:', err);
            showToast('Failed to load vault.', 'error');
        }
    }


    let currentFilter = 'all';
    let focusableElements = [];
    let firstFocusableElement;
    let lastFocusableElement;

    // --- Password Generation Utility ---
    const generatePassword = (length = 16, upper = true, lower = true, nums = true, syms = true) => {
        let chars = '';
        if (upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (lower) chars += 'abcdefghijklmnopqrstuvwxyz';
        if (nums) chars += '0123456789';
        if (syms) chars += '!@#$%^&*()_+=-`~[]{}|;\':",./<>?';
        if (chars.length === 0) return 'Select options';

        let password = '';
        // Use crypto.getRandomValues for more secure random numbers
        const randomValues = new Uint32Array(length);
        window.crypto.getRandomValues(randomValues);
        for (let i = 0; i < length; i++) {
            password += chars[randomValues[i] % chars.length];
        }
        return password;
    };

    const renderCredentials = (filteredCredentials = credentials) => {
        credentialsList.innerHTML = '';
        if (filteredCredentials.length === 0) {
            credentialsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🛡️</div>
                <p>Your vault is empty. Let's secure your first account!</p>
                <button class="button primary" id="addFirstCredential">Add New Credential</button>
            </div>`;
            return;
        }

        filteredCredentials.forEach(cred => {
            const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain_url=${cred.url}`;
            const fallbackFavicon = '/images/default-favicon.png';

            const card = document.createElement('div');
            card.className = 'credential-card glassmorphism';
            card.dataset.id = cred.id;
            card.innerHTML = `
            <div class="credential-header">
                <img src="${faviconUrl}" 
                     alt="${cred.title} favicon" 
                     class="credential-favicon"
                     onerror="this.onerror=null;this.src='${fallbackFavicon}'">

                <h4>${cred.title}</h4>
            </div>
            <div class="credential-info">
                <p><strong>Username:</strong> ${cred.username}</p>
                <p class="password-masked">
                    <strong>Password:</strong>
                    <span data-password="${cred.password}">********</span>
                    <button class="button icon-button show-hide-password" aria-label="Show password">
    <img src="images/unsee.png" alt="Show" class="password-toggle-icon" width="20" height="20">
</button>


                </p>
            </div>
            <div class="credential-actions">
                <button class="button secondary copy-button" data-type="password">📋 Copy Pass</button>
                <button class="button secondary copy-button" data-type="username">📋 Copy User</button>
                <button class="button secondary edit-button">✏️ Edit</button>
                <button class="button secondary delete-button">🗑️ Delete</button>
            </div>`;
            credentialsList.appendChild(card);
        });
    };



    // --- Event Listeners (using delegation for dynamic content) ---
    credentialsList.addEventListener('click', async (e) => {
        const target = e.target;
        const card = target.closest('.credential-card');
        const id = card ? card.dataset.id : null;

        // Show/Hide Password
        if (target.classList.contains('show-hide-password') || target.closest('.show-hide-password')) {
            const button = target.closest('.show-hide-password');
            const passwordSpan = card.querySelector('[data-password]');
            const iconImg = button.querySelector('img');
            const cred = credentials.find(c => c.id === id);
            const isMasked = passwordSpan.textContent.includes('*');

            if (isMasked) {
                // No decryption needed - password is stored in plain text
                passwordSpan.textContent = cred.password;
                iconImg.src = 'images/see.png';
                iconImg.alt = 'Hide';
                button.setAttribute('aria-label', 'Hide password');
            } else {
                passwordSpan.textContent = '********';
                iconImg.src = 'images/unsee.png';
                iconImg.alt = 'Show';
                button.setAttribute('aria-label', 'Show password');
            }
        }


        // Copy Buttons
        if (target.classList.contains('copy-button')) {
            const type = target.dataset.type;
            const cred = credentials.find(c => c.id === id);
            if (!cred) return;

            const textToCopy = type === 'password' ? cred.password : cred.username;

            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} copied!`, 'success');
                window.setupClipboardAutoClear();
            }).catch(err => {
                showToast('Failed to copy.', 'error');
            });
        }

        // Edit Button
        if (target.classList.contains('edit-button')) {
            const credToEdit = credentials.find(c => c.id === id);
            openAddEditModal('edit', credToEdit);
        }

        // Delete Button
        if (target.classList.contains('delete-button')) {
            const deleteCredential = async () => {
                 try {
                     const token = localStorage.getItem('token');
                     const response = await fetch('/api/vault/delete', {
                         method: 'POST',
                         headers: {
                             'Content-Type': 'application/json',
                             'Authorization': `Bearer ${token}`
                         },
                         body: JSON.stringify({ id: id })
                     });

                     if (!response.ok) {
                         const errorData = await response.json();
                         throw new Error(errorData.error || 'Failed to delete credential');
                     }

                     showToast('Credential deleted successfully!', 'success');
                     await fetchVault(); // Re-fetch data from server to update UI
                 } catch (err) {
                     console.error('Delete error:', err);
                     showToast(`Error: ${err.message}`, 'error');
                 }
            };

            openConfirmModal(
                'Confirm Deletion',
                'Are you sure you want to permanently delete this credential? This action cannot be undone.',
                deleteCredential
            );
        }

        // Add First Credential Button (in empty state)
        if (target.id === 'addFirstCredential') {
            openAddEditModal('add');
        }
    });

    // --- Modal Management ---
    const openAddEditModal = (mode, credential = {}) => {
        const isEdit = mode === 'edit';
        addEditModal.innerHTML = `
            <h2>${isEdit ? 'Edit Credential' : 'Add New Credential'}</h2>
            <form id="credentialForm">
                <input type="hidden" id="credentialId" value="${isEdit ? credential.id : ''}">
                <div class="input-group">
                    <label for="websiteName">Website Name:</label>
                    <input type="text" id="websiteName" value="${isEdit ? credential.title : ''}" required>
                <div class="input-group">
  <label for="url">URL:</label>
  <div class="url-input-wrapper">
    <span class="url-icon">🔗</span>
    <input type="url" id="url" value="${isEdit ? credential.url : ''}" placeholder="https://example.com">
  </div>
</div>

</div>
                </div>
                <div class="input-group">
                    <label for="username">Username/Email:</label>
                    <input type="text" id="username" value="${isEdit ? credential.username : ''}">
                </div>
                <div class="input-group">
                    <label for="password">Password:</label>
                    <div class="password-input">
                        <input type="password" id="password" value="${isEdit ? credential.password : ''}" required>
                        <button type="button" class="generate-password-modal" aria-label="Generate password">✨</button>                        
                        <button type="button" class="toggle-password" aria-label="Show password">
                            <img src="images/unsee.png" alt="Show" class="password-toggle-icon" width="20" height="20">
                        </button>
                    </div>
                </div>
                <div class="input-group">
                    <label for="category">Category:</label>
                    <select id="category" name="category">
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
        document.body.style.overflow = 'hidden';

        // Set up event listeners for the new modal content
        window.setupPasswordToggles(addEditModal); // Use global function
        addEditModal.querySelector('.close-modal').addEventListener('click', closeAddEditModal);
        addEditModal.querySelector('#credentialForm').addEventListener('submit', handleCredentialSubmit);
        addEditModal.querySelector('.generate-password-modal').addEventListener('click', () => {
            const newPass = generatePassword();
            addEditModal.querySelector('#password').value = newPass;
        });

        // Accessibility: Focus trapping
        trapFocus(addEditModal);
    };

    const openConfirmModal = (title, message, onConfirm) => {
        addEditModal.innerHTML = `
            <h2>${title}</h2>
            <p>${message}</p>
            <div class="modal-actions">
                <button type="button" class="button secondary close-modal">Cancel</button>
                <button type="button" class="button danger" id="confirmActionBtn">Confirm</button>
            </div>
        `;

        addEditModal.classList.add('show');
        modalOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';

        addEditModal.querySelector('.close-modal').addEventListener('click', closeAddEditModal);
        const confirmBtn = addEditModal.querySelector('#confirmActionBtn');

        const confirmHandler = () => {
            closeAddEditModal();
            onConfirm();
        };

        confirmBtn.addEventListener('click', confirmHandler, { once: true });
        trapFocus(addEditModal);
    };

    const closeAddEditModal = () => {
        addEditModal.classList.remove('show');
        modalOverlay.classList.remove('show');
        document.body.style.overflow = 'auto';
        document.removeEventListener('keydown', handleEscKey);
    };

    const handleCredentialSubmit = async (e) => {
        e.preventDefault();

        const credentialId = document.getElementById('credentialId').value;
        const isEdit = !!credentialId;
        const token = localStorage.getItem('token');

        const credentialData = {
            title: document.getElementById('websiteName').value,
            url: document.getElementById('url').value,
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            category: document.getElementById('category').value,
            notes: '', // Notes field is not in the modal, but schema supports it
            // Legacy fields for backward compatibility
            site: document.getElementById('websiteName').value,
            secret: document.getElementById('password').value
        };

        if (isEdit) {
            credentialData.id = credentialId;
        }

        try {
            console.log('Sending credential data:', { ...credentialData, password: '[HIDDEN]', secret: '[HIDDEN]' });

            const response = await fetch('/api/vault/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(credentialData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save to vault');
            }

            showToast(`Credential ${isEdit ? 'updated' : 'saved'} successfully!`, 'success');
            closeAddEditModal();
            await fetchVault(); // Re-fetch data from server to ensure UI is in sync

        } catch (err) {
            console.error("Save error:", err);
            showToast(`Error: ${err.message}`, 'error');
        }

    };


    const handleEscKey = (e) => {
        if (e.key === 'Escape') {
            closeAddEditModal();
        }
    };

    // --- Focus Trap for Modals (Accessibility) ---
    const trapFocus = (modal) => {
        focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        firstFocusableElement = focusableElements[0];
        lastFocusableElement = focusableElements[focusableElements.length - 1];

        firstFocusableElement.focus();

        modal.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) { // Shift + Tab
                if (document.activeElement === firstFocusableElement) {
                    lastFocusableElement.focus();
                    e.preventDefault();
                }
            } else { // Tab
                if (document.activeElement === lastFocusableElement) {
                    firstFocusableElement.focus();
                    e.preventDefault();
                }
            }
        });
        document.addEventListener('keydown', handleEscKey);
    };

    // --- Filtering and Searching ---
    const applyFilters = () => {
        const searchTerm = searchInput.value.toLowerCase();
        let filtered = credentials;

        // Filter by category
        if (currentFilter !== 'all') {
            filtered = filtered.filter(c => c.category === currentFilter);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(c =>
                c.title.toLowerCase().includes(searchTerm) ||
                c.url.toLowerCase().includes(searchTerm) ||
                c.username.toLowerCase().includes(searchTerm)
            );
        }
        renderCredentials(filtered);
    };

    // Event listeners for top-level elements
    addNewCredentialButton.addEventListener('click', () => openAddEditModal('add'));
    modalOverlay.addEventListener('click', closeAddEditModal);

    if (foldersList) {
        foldersList.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                e.preventDefault();
                document.querySelectorAll('#folders a').forEach(a => a.classList.remove('active'));
                e.target.classList.add('active');
                currentFilter = e.target.dataset.filter;
                applyFilters();
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }

    // Initial render
    fetchVault(); // Fetch user-specific credentials from backend on load

    applyFilters();
});
