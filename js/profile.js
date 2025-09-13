document.addEventListener('DOMContentLoaded', () => {
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'index.html'; // Redirect if not authenticated
        return;
    }

    // Fetch user data to populate the form
    // This part will be implemented later

    saveProfileBtn.addEventListener('click', async () => {
        const userName = document.getElementById('userName').value;
        const userDob = document.getElementById('userDob').value;
        const userPin = document.getElementById('userPin').value;
        const petName = document.getElementById('petName').value;

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: userName,
                    dob: userDob,
                    pin: userPin,
                    petName: petName
                })
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Profile saved successfully!', 'success');
                setTimeout(() => {
                    window.location.href = 'vault.html';
                }, 1500);
            } else {
                showToast(data.msg || 'Failed to save profile.', 'error');
            }
        } catch (error) {
            showToast('An error occurred. Please try again.', 'error');
        }
    });

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
});
