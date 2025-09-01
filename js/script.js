// js/script.js

document.addEventListener('DOMContentLoaded', () => {
    // Function to show a toast notification with type and icon
    window.showToast = (message, type = 'info') => {
        const toast = document.getElementById('toastNotification');
        if (toast) {
            // Set icon based on type
            let icon = '';
            switch (type) {
                case 'success':
                    icon = '✔️ ';
                    break;
                case 'error':
                    icon = '❌ ';
                    break;
                case 'info':
                default:
                    icon = 'ℹ️ ';
                    break;
            }

            toast.innerHTML = `${icon}${message}`;
            toast.className = 'toast'; // Reset classes
            toast.classList.add('show', type); // Add type class

            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    };

    // Generic password visibility toggle for any page
    const setupPasswordToggles = (container) => {
        const togglePasswordButtons = container.querySelectorAll('.toggle-password');
        togglePasswordButtons.forEach(button => {            
            button.addEventListener('click', function () {                
                const passwordInput = this.closest('.password-input').querySelector('input');
                const iconImg = this.querySelector('img');
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);

                if (iconImg) {
                    // Image-based toggle
                    iconImg.src = type === 'password' ? 'images/unsee.png' : 'images/see.png';
                    iconImg.alt = type === 'password' ? 'Show' : 'Hide';
                    this.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
                } else {
                    // Fallback to text-based toggle for other pages
                    this.textContent = type === 'password' ? '👁️' : ' Hide';
                    this.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
                }
            });
        });
    };
    
    // Initial setup for the whole document
    setupPasswordToggles(document);

    // Make window.setupPasswordToggles globally available for modals
    window.setupPasswordToggles = setupPasswordToggles;

    // --- Idle Lock Functionality ---
    const setupIdleTimer = () => {
        // Only run on pages that are not the lock or login pages
        const currentPage = window.location.pathname;
        if (currentPage.endsWith('/lock.html') || currentPage.endsWith('/index.html') || currentPage.endsWith('/register.html')) {
            return;
        }

        let idleTimeout;
        const lockTimeoutMinutes = parseInt(localStorage.getItem('lockTimeout') || '5', 10);
        const lockTimeoutMs = lockTimeoutMinutes * 60 * 1000;

        if (lockTimeoutMs <= 0) return;

        const lockVault = () => { window.location.href = 'lock.html'; };

        const resetIdleTimer = () => {
            clearTimeout(idleTimeout);
            idleTimeout = setTimeout(lockVault, lockTimeoutMs);
        };

        const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        activityEvents.forEach(event => window.addEventListener(event, resetIdleTimer, true));

        resetIdleTimer(); // Start the timer
    };

    setupIdleTimer();
});
