// js/settings.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const themeToggle = document.getElementById('themeToggle');
    const clipboardTimeoutMinutesInput = document.getElementById('clipboardTimeoutMinutes');
    const clipboardTimeoutSecondsInput = document.getElementById('clipboardTimeoutSeconds');
    const lockTimeoutInput = document.getElementById('lockTimeout');
    const exportButton = document.getElementById('exportVaultBtn');
    const importButton = document.getElementById('importVaultBtn');
    const saveButton = document.getElementById('saveSettingsBtn');
    const loaderContainer = document.getElementById('loader-container');

    // --- Loader Functions ---
    const showLoader = () => loaderContainer.classList.add('show');
    const hideLoader = () => loaderContainer.classList.remove('show');

    // --- Load Initial Settings ---
    const loadSettings = () => {
        const savedTheme = localStorage.getItem('theme');
        if (themeToggle) themeToggle.checked = savedTheme !== 'light';

        const savedClipboardTimeout = localStorage.getItem('clipboardTimeout') || 15; // Default 15s
        if (clipboardTimeoutMinutesInput && clipboardTimeoutSecondsInput) {
            clipboardTimeoutMinutesInput.value = Math.floor(savedClipboardTimeout / 60);
            clipboardTimeoutSecondsInput.value = savedClipboardTimeout % 60;
        }

        if (lockTimeoutInput) {
            lockTimeoutInput.value = localStorage.getItem('lockTimeout') || 5; // Default 5m
        }
    };

    // --- Save All Settings ---
    const saveSettings = () => {
        showLoader(); // Show loader on save

        // 1. Save Theme
        if (themeToggle) {
            const theme = themeToggle.checked ? 'dark' : 'light';
            localStorage.setItem('theme', theme);
            document.documentElement.classList.toggle('light-theme', theme === 'light');
        }

        // 2. Save Clipboard Timeout
        if (clipboardTimeoutMinutesInput && clipboardTimeoutSecondsInput) {
            const minutes = parseInt(clipboardTimeoutMinutesInput.value, 10) || 0;
            const seconds = parseInt(clipboardTimeoutSecondsInput.value, 10) || 0;
            localStorage.setItem('clipboardTimeout', (minutes * 60) + seconds);
        }

        // 3. Save Lock Timeout
        if (lockTimeoutInput) {
            localStorage.setItem('lockTimeout', lockTimeoutInput.value);
        }

        // 4. Show toast and redirect
        // Assuming showToast is globally available from script.js
        if (window.showToast) {
            window.showToast('Settings saved successfully!', 'success');
        }
        setTimeout(() => {
            window.location.href = "vault.html";
        }, 1000); // Wait for toast to be visible before redirecting
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

    // Show loader for any navigation away from the page
    document.querySelectorAll('a[href]').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.href && !link.href.startsWith('#')) {
                showLoader();
            }
        });
    });

    // Hide loader when page is fully loaded (e.g., on back navigation)
    window.addEventListener('load', hideLoader);

    // --- Initial Setup ---
    loadSettings();
});
