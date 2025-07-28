// js/settings.js

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const clipboardTimeoutSelect = document.getElementById('clipboardTimeout');
    const lockTimeoutInput = document.getElementById('lockTimeout');

    // Load saved settings (if any - using localStorage for example)
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        if (themeToggle) {
            themeToggle.checked = false;
        }
    }

    const savedClipboardTimeout = localStorage.getItem('clipboardTimeout');
    if (clipboardTimeoutSelect && savedClipboardTimeout) {
        clipboardTimeoutSelect.value = savedClipboardTimeout;
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
            document.body.classList.toggle('light-theme', theme === 'light');
        });
    }

    if (clipboardTimeoutSelect) {
        clipboardTimeoutSelect.addEventListener('change', () => {
            const timeout = clipboardTimeoutSelect.value;
            localStorage.setItem('clipboardTimeout', timeout);
            showToast(`Clipboard auto-clear set to ${timeout} seconds.`);
            // You might want to update the global clipboard timeout setting here if implemented
        });
    }

    if (lockTimeoutInput) {
        lockTimeoutInput.addEventListener('change', () => {
            const timeout = lockTimeoutInput.value;
            localStorage.setItem('lockTimeout', timeout);
            showToast(`Idle lock timeout set to ${timeout} minutes.`);
            // You would implement the actual idle lock timer logic elsewhere
        });
    }

    // Export/Import vault buttons (basic click listeners for future implementation)
    const exportButton = document.querySelector('.button.secondary:contains("Export Vault")');
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            showToast('Export functionality coming soon!');
            // Implement export logic here
        });
    }

    const importButton = document.querySelector('.button.secondary:contains("Import Vault")');
    if (importButton) {
        importButton.addEventListener('click', () => {
            showToast('Import functionality coming soon!');
            // Implement import logic here
        });
    }
});