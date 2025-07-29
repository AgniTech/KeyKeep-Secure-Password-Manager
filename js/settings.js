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
        const logoutButton = document.getElementById('logoutBtn');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            showToast('Logged out successfully. Redirecting...');
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);
        });
    }

});
// Simple toast popup for feedback
function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.padding = '10px 20px';
    toast.style.backgroundColor = '#444';
    toast.style.color = 'white';
    toast.style.borderRadius = '6px';
    toast.style.zIndex = 1000;
    toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

