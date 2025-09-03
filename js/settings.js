// js/settings.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const themeToggle = document.getElementById('themeToggle');
    const clipboardTimeoutSelect = document.getElementById('clipboardTimeout');
    const lockTimeoutInput = document.getElementById('lockTimeout');
    const exportButton = document.getElementById('exportVaultBtn');
    const importButton = document.getElementById('importVaultBtn');
    const logoutButton = document.getElementById('logoutBtn');
    const saveButton = document.getElementById('saveSettingsBtn');

    // --- Load Initial Settings ---
    // This function sets the form inputs to match what's currently saved.
    const loadSettings = () => {
        const savedTheme = localStorage.getItem('theme');
        if (themeToggle) themeToggle.checked = savedTheme !== 'light';

        if (clipboardTimeoutSelect) {
            let savedValue = localStorage.getItem('clipboardTimeout');
            if (!savedValue) {
                savedValue = clipboardTimeoutSelect.value; // Get default from HTML
                localStorage.setItem('clipboardTimeout', savedValue);
            }
            clipboardTimeoutSelect.value = savedValue;
        }

        if (lockTimeoutInput) {
            let savedLockValue = localStorage.getItem('lockTimeout');
            if (!savedLockValue) {
                savedLockValue = lockTimeoutInput.value; // Get default from HTML
                localStorage.setItem('lockTimeout', savedLockValue);
            }
            lockTimeoutInput.value = savedLockValue;
        }
    };

    // --- Save All Settings ---
    const saveSettings = () => {
        // 1. Save Theme
        if (themeToggle) {
            const theme = themeToggle.checked ? 'dark' : 'light';
            localStorage.setItem('theme', theme);
            // Apply theme immediately so it's correct when redirecting
            document.documentElement.classList.toggle('light-theme', theme === 'light');
        }

        // 2. Save Clipboard Timeout
        if (clipboardTimeoutSelect) {
            localStorage.setItem('clipboardTimeout', clipboardTimeoutSelect.value);
        }

        // 3. Save Lock Timeout
        if (lockTimeoutInput) {
            localStorage.setItem('lockTimeout', lockTimeoutInput.value);
        }

        // 4. Show toast and redirect
        window.showToast('Settings saved successfully!', 'success');
        setTimeout(() => {
            window.location.href = "vault.html";
        }, 1000); // Wait for toast to be visible
    };

    // --- Event Listeners ---
    if (saveButton) {
        saveButton.addEventListener('click', saveSettings);
    }

    if (exportButton) {
        exportButton.addEventListener('click', () => window.showToast('Export functionality coming soon!', 'info'));
    }
    if (importButton) {
        importButton.addEventListener('click', () => window.showToast('Import functionality coming soon!', 'info'));
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.showToast('Logged out successfully. Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);
        });
    }

    // --- Initial Setup ---
    loadSettings();
});
