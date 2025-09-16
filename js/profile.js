document.addEventListener('DOMContentLoaded', () => {
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const userNameInput = document.getElementById('userName');
    const userDobInput = document.getElementById('userDob');
    const userAddressInput = document.getElementById('userAddress');
    const userPinInput = document.getElementById('userPin');
    const petNameInput = document.getElementById('petName');
    const loaderContainer = document.getElementById('loader-container');

    // Profile Image Elements
    const profileImageContainer = document.querySelector('.profile-image-container');
    const profileImage = document.getElementById('profileImage');
    const profileImageMenu = document.getElementById('profileImageMenu');
    const uploadPhotoBtn = document.getElementById('uploadPhoto');
    const changePhotoBtn = document.getElementById('changePhoto');
    const removePhotoBtn = document.getElementById('removePhoto');
    const photoUploadInput = document.getElementById('photoUploadInput');

    // --- Loader Functions ---
    const showLoader = () => loaderContainer.classList.add('show');
    const hideLoader = () => loaderContainer.classList.remove('show');

    const token = localStorage.getItem('token');
    if (!token) {
        showLoader(); // Show loader before redirecting
        window.location.href = 'index.html';
        return;
    }

    // --- Profile Image Functionality ---
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
        profileImage.src = savedImage;
    }

    if (profileImageContainer) {
        profileImageContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            profileImageMenu.style.display = profileImageMenu.style.display === 'block' ? 'none' : 'block';
        });
    }

    document.addEventListener('click', () => {
        if (profileImageMenu) profileImageMenu.style.display = 'none';
    });

    if (uploadPhotoBtn) uploadPhotoBtn.addEventListener('click', () => photoUploadInput.click());
    if (changePhotoBtn) changePhotoBtn.addEventListener('click', () => photoUploadInput.click());

    if (photoUploadInput) {
        photoUploadInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageUrl = e.target.result;
                    profileImage.src = imageUrl;
                    localStorage.setItem('profileImage', imageUrl);
                    showToast('Profile photo updated!', 'success');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', () => {
            profileImage.src = 'images/profile.png';
            localStorage.removeItem('profileImage');
            showToast('Profile photo removed.', 'info');
        });
    }

    // --- Profile Data Functionality ---
    saveProfileBtn.addEventListener('click', async () => {
        showLoader(); // Show loader on save
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
                showToast('Profile updated successfully!', 'success');
                setTimeout(() => {
                    window.location.href = 'vault.html';
                }, 1500);
            } else {
                hideLoader(); // Hide loader on failure
                showToast(data.msg || 'Failed to update profile.', 'error');
            }
        } catch (error) {
            hideLoader(); // Hide loader on error
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

    // Hide loader when the page is fully loaded
    window.addEventListener('load', hideLoader);
});
