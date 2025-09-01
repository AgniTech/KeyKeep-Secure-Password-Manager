// js/lock.js

document.addEventListener('DOMContentLoaded', () => {
    const unlockForm = document.getElementById('unlockForm');
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

    // Simple error animation (shake effect - ensure CSS for this exists)
    function animateError(element, message) {
        element.textContent = message;
        element.classList.add('shake');
        setTimeout(() => {
            element.classList.remove('shake');
        }, 500);
    }
});