document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const userNameInput = document.getElementById('userName');
    const userDobInput = document.getElementById('userDob');
    const userAddressInput = document.getElementById('userAddress');
    const userPinInput = document.getElementById('userPin');
    const petNameInput = document.getElementById('petName');
    const loaderContainer = document.getElementById('loader-container');

    // --- Profile Image Elements ---
    const profileImageContainer = document.querySelector('.profile-image-container');
    const profileImage = document.getElementById('profileImage');
    const profileImageMenu = document.getElementById('profileImageMenu');
    const uploadPhotoBtn = document.getElementById('uploadPhoto');
    const changePhotoBtn = document.getElementById('changePhoto');
    const removePhotoBtn = document.getElementById('removePhoto');
    const photoUploadInput = document.getElementById('photoUploadInput');

    // --- Helper Functions ---
    const showLoader = () => loaderContainer.classList.add('show');
    const hideLoader = () => loaderContainer.classList.remove('show');

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

    // --- Authentication Check ---
    const token = localStorage.getItem('token');
    if (!token) {
        showLoader();
        window.location.href = 'index.html';
        return;
    }

    // --- Profile Photo Functionality ---

    // 1. Load saved profile picture from local storage on page load
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
        profileImage.src = savedImage;
    }

    // 2. Toggle profile image menu
    profileImageContainer.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent click from closing the menu immediately
        profileImageMenu.style.display = profileImageMenu.style.display === 'block' ? 'none' : 'block';
    });

    // 3. Close menu if clicked outside
    document.addEventListener('click', () => {
        profileImageMenu.style.display = 'none';
    });

    // 4. Trigger file input for upload/change
    uploadPhotoBtn.addEventListener('click', () => photoUploadInput.click());
    changePhotoBtn.addEventListener('click', () => photoUploadInput.click());

    // 5. Handle file selection and save to local storage
    photoUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target.result;
                profileImage.src = imageUrl;
                localStorage.setItem('profileImage', imageUrl); // Save image DataURL
                showToast('Profile photo updated!', 'success');
            };
            reader.readAsDataURL(file);
        }
    });

    // 6. Handle photo removal
    removePhotoBtn.addEventListener('click', () => {
        profileImage.src = 'images/profile.png'; // Reset to default image
        localStorage.removeItem('profileImage'); // Remove from local storage
        showToast('Profile photo removed.', 'info');
    });

    // --- Save Profile Data Functionality ---

    saveProfileBtn.addEventListener('click', async () => {
        showLoader(); // Show loader on save

        const profileData = {
            name: userNameInput.value,
            dob: userDobInput.value,
            address: userAddressInput.value,
            pin: userPinInput.value,
            petName: petNameInput.value, // Security question answer
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
                showToast('Profile updated successfully! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'vault.html';
                }, 1500); // Wait for toast before redirecting
            } else {
                hideLoader(); // Hide loader on failure
                showToast(data.msg || 'Failed to update profile.', 'error');
            }
        } catch (error) {
            hideLoader(); // Hide loader on network or other errors
            showToast('An error occurred. Please try again.', 'error');
        }
    });

    // --- Initial Page Load ---
    window.addEventListener('load', hideLoader);
});
