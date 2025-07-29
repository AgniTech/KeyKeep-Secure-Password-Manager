// js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const container = document.getElementById('container');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

   const API_BASE_URL = '/api/auth';
// Ensure this matches your backend server URL

    // --- Sliding Panel Animation Logic ---
    if (signUpButton) {
        signUpButton.addEventListener('click', () => {
            container.classList.add("right-panel-active");
            // Clear previous errors when switching panels
            if (document.getElementById('loginError')) document.getElementById('loginError').textContent = '';
            if (document.getElementById('registerError')) document.getElementById('registerError').textContent = '';
        });
    }

    if (signInButton) {
        signInButton.addEventListener('click', () => {
            container.classList.remove("right-panel-active");
            // Clear previous errors when switching panels
            if (document.getElementById('loginError')) document.getElementById('loginError').textContent = '';
            if (document.getElementById('registerError')) document.getElementById('registerError').textContent = '';
        });
    }

    // --- Login Form Submission ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const masterPassword = document.getElementById('password').value;
            const errorContainer = document.getElementById('loginError');
            errorContainer.textContent = ''; // Clear previous errors

            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, masterPassword }),


                });

                const data = await response.json();

                if (response.ok) { // Check if the response status is 2xx
                    console.log('Login successful:', data);
                    // Store the JWT token
                    localStorage.setItem('token', data.token);
                    // Redirect to the vault page
                    window.location.href = 'vault.html';
                } else {
                    // Handle errors from the backend (e.g., "Invalid Credentials")
                    console.error('Login failed:', data.msg);
                    errorContainer.textContent = data.msg || 'Login failed. Please try again.';
                }
            } catch (error) {
                console.error('Network error during login:', error);
                errorContainer.textContent = 'Network error. Please check your connection.';
            }
        });
    }

    // --- Register Form Submission ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value;
            const masterPassword = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const errorContainer = document.getElementById('registerError');
            errorContainer.textContent = ''; // Clear previous errors

            if (masterPassword !== confirmPassword) {
                errorContainer.textContent = 'Passwords do not match.';
                return;
            }
            if (masterPassword.length < 8) { // Basic frontend validation matching backend
                errorContainer.textContent = 'Password must be at least 8 characters long.';
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, masterPassword }),


                });

                const data = await response.json();

                if (response.ok) { // Check if the response status is 2xx
                    console.log('Registration successful:', data);
                    // Store the JWT token (optional, could just redirect to login)
                    localStorage.setItem('token', data.token);
                    // Optionally, show a success message and then switch to the sign-in panel
                    // For now, let's redirect directly to the vault as per previous flow
                    window.location.href = 'vault.html';
                } else {
                    // Handle errors from the backend (e.g., "User already exists")
                    console.error('Registration failed:', data.msg);
                    errorContainer.textContent = data.msg || 'Registration failed. Please try again.';
                }
            } catch (error) {
                console.error('Network error during registration:', error);
                errorContainer.textContent = 'Network error. Please check your connection.';
            }
        });
    }
});
