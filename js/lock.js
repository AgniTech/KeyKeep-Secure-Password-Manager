// js/lock.js

document.addEventListener('DOMContentLoaded', () => {
    const unlockForm = document.getElementById('unlockForm');

    // Helper function to parse JWT to get user ID for salt
    function parseJwt(token) {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    }

    if (unlockForm) {
        unlockForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const unlockPasswordInput = document.getElementById('unlockPassword');
            const unlockPassword = unlockPasswordInput.value;
            const errorContainer = document.getElementById('unlockError');
            errorContainer.textContent = '';

            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = 'index.html'; // No token, go to login
                return;
            }

            try {
                const response = await fetch('/api/auth/unlock', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ masterPassword: unlockPassword })
                });

                if (response.ok) {
                    // --- KEY DERIVATION LOGIC ---
                    await libsodium.ready;
                    const sodium = libsodium;

                    const decodedToken = parseJwt(token);
                    const userId = decodedToken ? decodedToken.id : null;

                    if (!userId) {
                        animateError(errorContainer, 'Invalid session. Please log in again.');
                        localStorage.removeItem('token');
                        setTimeout(() => window.location.href = 'index.html', 1500);
                        return;
                    }

                    // Use a padded/truncated version of the user ID as a salt.
                    // This is not a true random salt but makes the key user-specific.
                    const salt = sodium.from_hex(userId.padEnd(32, '0').substring(0, 32));

                    // Derive a 32-byte key using Argon2id
                    const key = sodium.crypto_pwhash(
                        32, // Key length: 32 bytes for XSalsa20-Poly1305
                        unlockPassword,
                        salt,
                        sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
                        sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
                        sodium.crypto_pwhash_ALG_DEFAULT
                    );

                    // Store the key in sessionStorage (cleared when tab closes)
                    sessionStorage.setItem('encryptionKey', sodium.to_base64(key));

                    // Redirect to the vault
                    window.location.href = 'vault.html';
                } else {
                    const errorData = await response.json();
                    animateError(errorContainer, errorData.error || 'Unlock failed');
                    unlockPasswordInput.value = '';
                }
            } catch (err) {
                animateError(errorContainer, 'Network error. Please try again.');
            }
        });
    }

    // Simple error animation (shake effect)
    function animateError(element, message) {
        element.textContent = message;
        element.classList.add('shake');
        setTimeout(() => {
            element.classList.remove('shake');
        }, 500);
    }
});