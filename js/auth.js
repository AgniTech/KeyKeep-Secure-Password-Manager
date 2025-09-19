// js/auth.js - REWRITTEN FOR SEPARATE LOGIN/REGISTER PAGES

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loaderContainer = document.getElementById('loader-container');
    const API_BASE_URL = '/api/auth';

    // --- Loader Functions ---
    const showLoader = () => loaderContainer.classList.add('show');
    const hideLoader = () => loaderContainer.classList.remove('show');

    // --- Toast Notification ---
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            console.warn('Toast container not found! Using alert as fallback.');
            alert(message);
            return;
        }
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

    // --- LOGIN PAGE LOGIC ---
    if (loginForm) {
        // Check for URL parameters to show a success message after registration
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');
        const registered = urlParams.get('registered');

        if (registered === 'true') {
            showToast('Registration successful! Please sign in.', 'success');
        }
        if (email) {
            document.getElementById('email').value = decodeURIComponent(email);
            document.getElementById('password').focus(); // Focus password for convenience
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoader(); // Show loader on submission
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorContainer = document.getElementById('loginError');
            errorContainer.textContent = '';

            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    // Redirect based on whether the profile has been initialized
                    if (data.profileInitialized) {
                        window.location.href = 'vault.html';
                    } else {
                        localStorage.setItem('isNewUser', 'true');
                        window.location.href = 'Profile.html';
                    }
                } else {
                    hideLoader(); // Hide loader on error
                    errorContainer.textContent = data.msg || 'Login failed. Please try again.';
                }
            } catch (error) {
                hideLoader(); // Hide loader on error
                errorContainer.textContent = 'Network error. Please check your connection.';
            }
        });
    }

    // --- REGISTER PAGE LOGIC ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoader(); // Show loader on submission
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const errorContainer = document.getElementById('registerError');
            errorContainer.textContent = '';

            if (password !== confirmPassword) {
                errorContainer.textContent = 'Passwords do not match.';
                hideLoader(); // Hide loader on validation error
                return;
            }
            if (password.length < 8) {
                errorContainer.textContent = 'Password must be at least 8 characters long.';
                hideLoader(); // Hide loader on validation error
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    // On success, redirect to the login page with params
                    window.location.href = `index.html?registered=true&email=${encodeURIComponent(email)}`;
                } else {
                    hideLoader(); // Hide loader on error
                    errorContainer.textContent = data.msg || 'Registration failed. Please try again.';
                }
            } catch (error) {
                hideLoader(); // Hide loader on error
                errorContainer.textContent = 'Network error. Please check your connection.';
            }
        });
    }

    // Show loader when navigating away (for successful redirects)
    window.addEventListener('beforeunload', () => {
        // Only show loader if a form was submitted
        if (document.querySelector('#loginForm, #registerForm')) {
            showLoader();
        }
    });
});
