document.addEventListener('DOMContentLoaded', () => {
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const userNameInput = document.getElementById('userName');
    const userDobInput = document.getElementById('userDob');
    const userAddressInput = document.getElementById('userAddress');
    const userPinInput = document.getElementById('userPin');
    const petNameInput = document.getElementById('petName');

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    saveProfileBtn.addEventListener('click', async () => {
        const profileData = {
            name: userNameInput.value,
            dob: userDobInput.value,
            address: userAddressInput.value,
            pin: userPinInput.value,
            petName: petNameInput.value,
        };

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(profileData),
            });

            const data = await response.json();

            if (response.ok) {
                // Assuming a toast function is available in script.js
                showToast('Profile updated successfully!', 'success');
                setTimeout(() => {
                    window.location.href = 'vault.html';
                }, 2000);
            } else {
                showToast(data.msg || 'Failed to update profile.', 'error');
            }
        } catch (error) {
            showToast('An error occurred. Please try again.', 'error');
        }
    });

    // A simple toast function, in case script.js is not loaded or doesn't have one.
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
});
