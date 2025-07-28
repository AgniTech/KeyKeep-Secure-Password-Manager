// js/vault.js

document.addEventListener('DOMContentLoaded', () => {
    const credentialsList = document.getElementById('credentialsList');
    const searchInput = document.getElementById('searchCredentials');
    const foldersList = document.getElementById('folders');
    const addEditModal = document.getElementById('addEditModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const addNewCredentialButton = document.getElementById('addNewCredential');

    // Sample data (replace with actual data fetching)

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
                    <button class="button icon-button show-hide-password" aria-label="Show password">👁️</button>
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
    credentialsList.addEventListener('click', (e) => {
        const target = e.target;
        const card = target.closest('.credential-card');
        const id = card ? parseInt(card.dataset.id) : null;
        
        // Show/Hide Password
        if (target.classList.contains('show-hide-password')) {
            const passwordSpan = card.querySelector('[data-password]');
            const actualPassword = passwordSpan.dataset.password;
            const isMasked = passwordSpan.textContent.includes('*');
            passwordSpan.textContent = isMasked ? actualPassword : '********';
            target.textContent = isMasked ? 'Hide' : '👁️';
            target.setAttribute('aria-label', isMasked ? 'Hide password' : 'Show password');
        }

        // Copy Buttons
        if (target.classList.contains('copy-button')) {
            const type = target.dataset.type;
            const cred = credentials.find(c => c.id === id);
            const textToCopy = type === 'password' ? cred.password : cred.username;
            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast(`Copied ${type} to clipboard!`, 'success');
            }).catch(err => {
                showToast(`Failed to copy ${type}.`, 'error');
            });
        }
        
        // Edit Button
        if (target.classList.contains('edit-button')) {
            const credToEdit = credentials.find(c => c.id === id);
            openAddEditModal('edit', credToEdit);
        }

        // Delete Button
        if (target.classList.contains('delete-button')) {
            if (confirm('Are you sure you want to delete this credential?')) {
                credentials = credentials.filter(cred => cred.id !== id);
                applyFilters();
                showToast('Credential deleted.', 'info');
            }
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
                        <button type="button" class="generate-password-modal" aria-label="Generate password">✨</button>
                        <button type="button" class="toggle-password" aria-label="Show password">👁️</button>
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

    const closeAddEditModal = () => {
        addEditModal.classList.remove('show');
        modalOverlay.classList.remove('show');
        document.body.style.overflow = 'auto';
        document.removeEventListener('keydown', handleEscKey);
    };

    const handleCredentialSubmit = async (e) => {
    e.preventDefault();

    const id = document.getElementById('credentialId').value;
    const title = document.getElementById('websiteName').value;
    const url = document.getElementById('url').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const category = document.getElementById('category').value;

    const email = localStorage.getItem('userEmail') || "silentgamer174@gmail.com"; // fallback for now

    const newCredential = {
        id: id ? parseInt(id) : Date.now(),
        title,
        url,
        username,
        password,
        category,
        tags: [],
        notes: ''
    };

    try {
        const response = await fetch('/api/vault/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                site: title,
                secret: password
            })
        });

        if (!response.ok) {
            throw new Error("Failed to save to vault");
        }

        showToast('Credential saved to vault!', 'success');
        credentials.push(newCredential);
        applyFilters();
        closeAddEditModal();
    } catch (err) {
        console.error("Save error:", err);
        showToast('Error saving credential.', 'error');
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
    
    if(searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    
    // Initial render
    applyFilters();
});
