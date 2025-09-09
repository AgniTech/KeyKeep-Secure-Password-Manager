// js/auth.js - REFACTORED FOR UX IMPROVEMENTS

document.addEventListener('DOMContentLoaded', () => {
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const container = document.getElementById('container');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

   const API_BASE_URL = '/api/auth';

    // --- Sliding Panel Animation Logic ---
    if (signUpButton) {
        signUpButton.addEventListener('click', () => {
            container.classList.add("right-panel-active");
            if (document.getElementById('loginError')) document.getElementById('loginError').textContent = '';
            if (document.getElementById('registerError')) document.getElementById('registerError').textContent = '';
        });
    }

    if (signInButton) {
        signInButton.addEventListener('click', () => {
            container.classList.remove("right-panel-active");
            if (document.getElementById('loginError')) document.getElementById('loginError').textContent = '';
            if (document.getElementById('registerError')) document.getElementById('registerError').textContent = '';
        });
    }

    // --- Login Form Submission ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
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
                    window.location.href = 'vault.html';
                } else {
                    errorContainer.textContent = data.msg || 'Login failed. Please try again.';
                }
            } catch (error) {
                errorContainer.textContent = 'Network error. Please check your connection.';
            }
        });
    }

    // --- Register Form Submission ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const errorContainer = document.getElementById('registerError');
            errorContainer.textContent = '';

            if (password !== confirmPassword) {
                errorContainer.textContent = 'Passwords do not match.';
                return;
            }
            if (password.length < 8) {
                errorContainer.textContent = 'Password must be at least 8 characters long.';
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
                    // UX FIX: Show a success message and automatically switch to the sign-in panel.
                    alert(data.message || 'Registration successful! Please sign in.');
                    if (signInButton) {
                        signInButton.click();
                    }
                } else {
                    errorContainer.textContent = data.msg || 'Registration failed. Please try again.';
                }
            } catch (error) {
                errorContainer.textContent = 'Network error. Please check your connection.';
            }
        });
    }
});
