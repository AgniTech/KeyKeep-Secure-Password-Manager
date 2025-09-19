document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const userNameInput = document.getElementById('userName');
    const userMobileInput = document.getElementById('userMobile');
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

    // --- Profile Data Loading ---
    const loadProfileData = async () => {
        showLoader();
        try {
            const response = await fetch('/api/user/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const user = await response.json();
                userNameInput.value = user.name || '';
                userMobileInput.value = user.mobile || '';
                if (user.dob) {
                    const date = new Date(user.dob);
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    userDobInput.value = `${day}/${month}/${year}`;
                }
                userAddressInput.value = user.address || '';
                userPinInput.value = user.pin || '';
                petNameInput.value = user.petName || ''; // Updated to fetch top-level petName
            } else {
                console.log('Could not fetch profile data, or profile is not yet created.');
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
            showToast('Could not load your profile data.', 'error');
        } finally {
            hideLoader();
        }
    };

    // --- Profile Photo Functionality ---
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
        profileImage.src = savedImage;
    }

    profileImageContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        profileImageMenu.style.display = profileImageMenu.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
        if (profileImageMenu) {
            profileImageMenu.style.display = 'none';
        }
    });

    uploadPhotoBtn.addEventListener('click', () => photoUploadInput.click());
    changePhotoBtn.addEventListener('click', () => photoUploadInput.click());

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

    removePhotoBtn.addEventListener('click', () => {
        profileImage.src = 'images/profile.png';
        localStorage.removeItem('profileImage');
        showToast('Profile photo removed.', 'info');
    });

    // --- Save Profile Data Functionality ---
    saveProfileBtn.addEventListener('click', async () => {
        showLoader();
        const [day, month, year] = userDobInput.value.split('/');
        const dobISO = userDobInput.value ? new Date(`${year}-${month}-${day}`).toISOString() : null;

        const profileData = {
            name: userNameInput.value,
            mobile: userMobileInput.value,
            dob: dobISO,
            address: userAddressInput.value,
            pin: userPinInput.value,
            petName: petNameInput.value, // Ensure petName is sent as a top-level field
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
                    window.location.href = 'view-profile.html'; // Redirect to the view page
                }, 1500);
            } else {
                hideLoader();
                showToast(data.msg || 'Failed to update profile.', 'error');
            }
        } catch (error) {
            hideLoader();
            showToast('An error occurred. Please try again.', 'error');
        }
    });

    // --- Date Formatting ---
    userDobInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        if (value.length > 5) {
            value = value.slice(0, 5) + '/' + value.slice(5, 9);
        }
        e.target.value = value;
    });

    // --- Initial Page Load ---
    loadProfileData();
});
