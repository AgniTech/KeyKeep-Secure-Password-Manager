// js/settings.js

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const clipboardTimeoutSelect = document.getElementById('clipboardTimeout');
    const lockTimeoutInput = document.getElementById('lockTimeout');

    // Load saved settings (if any - using localStorage for example)
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

    const savedLockTimeout = localStorage.getItem('lockTimeout');
    if (lockTimeoutInput && savedLockTimeout) {
        lockTimeoutInput.value = savedLockTimeout;
    }

    // Event listeners to save settings
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            const theme = themeToggle.checked ? 'dark' : 'light';
            localStorage.setItem('theme', theme);
            document.documentElement.classList.toggle('light-theme', theme === 'light');
        });
    }

    if (clipboardTimeoutSelect) {
        clipboardTimeoutSelect.addEventListener('change', () => {
            const timeout = clipboardTimeoutSelect.value;
            localStorage.setItem('clipboardTimeout', timeout);
            window.showToast(`Clipboard auto-clear set to ${timeout} seconds.`, 'info');
            // You might want to update the global clipboard timeout setting here if implemented
        });
    }

    if (lockTimeoutInput) {
        lockTimeoutInput.addEventListener('change', () => {
            const timeout = lockTimeoutInput.value;
            localStorage.setItem('lockTimeout', timeout);
            window.showToast(`Idle lock timeout set to ${timeout} minutes.`, 'info');
            // You would implement the actual idle lock timer logic elsewhere
        });
    }

    // Export/Import vault buttons (using text matching)
const buttons = document.querySelectorAll('.button.secondary');
buttons.forEach(button => {
    if (button.textContent.includes('Export Vault')) {
        button.addEventListener('click', () => {
            window.showToast('Export functionality coming soon!', 'info');
        });
    } else if (button.textContent.includes('Import Vault')) {
        button.addEventListener('click', () => {
            window.showToast('Import functionality coming soon!', 'info');
        });
    }
});

        const logoutButton = document.getElementById('logoutBtn');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.showToast('Logged out successfully. Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);
        });
    }

});
