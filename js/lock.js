// js/lock.js

document.addEventListener('DOMContentLoaded', () => {
    const unlockForm = document.getElementById('unlockForm');
    if (unlockForm) {
        unlockForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const unlockPasswordInput = document.getElementById('unlockPassword');
            const unlockPassword = unlockPasswordInput.value;
            const errorContainer = document.getElementById('unlockError');
            errorContainer.textContent = '';

            // Simulate master password check (replace with actual authentication)
            if (unlockPassword === 'yourMasterPassword') { // Replace with actual check
                // Redirect back to the vault
                window.location.href = 'vault.html';
            } else {
                animateError(errorContainer, 'Incorrect master password.');
                unlockPasswordInput.value = ''; // Clear the input
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