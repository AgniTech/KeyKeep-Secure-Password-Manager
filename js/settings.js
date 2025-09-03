// js/settings.js

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const clipboardTimeoutMinutesInput = document.getElementById('clipboardTimeoutMinutes');
    const clipboardTimeoutSecondsInput = document.getElementById('clipboardTimeoutSeconds');
    const lockTimeoutInput = document.getElementById('lockTimeout');
    const exportButton = document.getElementById('exportVaultBtn');
    const importButton = document.getElementById('importVaultBtn');
    const logoutButton = document.getElementById('logoutBtn');

    // Load saved settings (if any - using localStorage for example)
    const savedTheme = localStorage.getItem('theme');
    if (themeToggle) themeToggle.checked = savedTheme !== 'light';

    if (clipboardTimeoutMinutesInput && clipboardTimeoutSecondsInput) {
        let savedValue = localStorage.getItem('clipboardTimeout');
        if (savedValue) {
            const totalSeconds = parseInt(savedValue, 10);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            clipboardTimeoutMinutesInput.value = minutes;
            clipboardTimeoutSecondsInput.value = seconds;
        } else {
            const minutes = parseInt(clipboardTimeoutMinutesInput.value, 10) || 0;
            const seconds = parseInt(clipboardTimeoutSecondsInput.value, 10) || 0;
            const totalSeconds = (minutes * 60) + seconds;
            localStorage.setItem('clipboardTimeout', totalSeconds);
        }

        const listener = () => {
            const minutes = parseInt(clipboardTimeoutMinutesInput.value, 10) || 0;
            const seconds = parseInt(clipboardTimeoutSecondsInput.value, 10) || 0;
            const totalSeconds = (minutes * 60) + seconds;
            localStorage.setItem('clipboardTimeout', totalSeconds);
            window.showToast(`Clipboard auto-clear set to ${minutes}m ${seconds}s.`, 'info');
        };

        clipboardTimeoutMinutesInput.addEventListener('change', listener);
        clipboardTimeoutSecondsInput.addEventListener('change', listener);
    }

    if (lockTimeoutInput) {
        let savedLockValue = localStorage.getItem('lockTimeout');
        if (!savedLockValue) {
            savedLockValue = lockTimeoutInput.value; // Get default from HTML
            localStorage.setItem('lockTimeout', savedLockValue);
        }
        lockTimeoutInput.value = savedLockValue;
    }

    // Event listeners to save settings
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            const theme = themeToggle.checked ? 'dark' : 'light';
            localStorage.setItem('theme', theme);
            document.documentElement.classList.toggle('light-theme', theme === 'light');
        });
    }

    if (lockTimeoutInput) {
        lockTimeoutInput.addEventListener('change', () => {
            const timeout = lockTimeoutInput.value;
            localStorage.setItem('lockTimeout', timeout);
            window.showToast(`Idle lock timeout set to ${timeout} minutes.`, 'info');
        });
    }

    // --- Button Actions ---
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

});