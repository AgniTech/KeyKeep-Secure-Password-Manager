document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const fullNameInput = document.getElementById('fullName'); // NEW
    const userNameInput = document.getElementById('userName');
    const userEmailInput = document.getElementById('userEmail'); // NEW
    const userMobileInput = document.getElementById('userMobile');
    const educationalBackgroundInput = document.getElementById('educationalBackground'); // NEW
    const favoriteSportsTeamInput = document.getElementById('favoriteSportsTeam'); // NEW
    const favoriteMovieBookInput = document.getElementById('favoriteMovieBook'); // NEW
    const importantDatesInput = document.getElementById('importantDates'); // NEW
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
                fullNameInput.value = user.fullName || ''; // NEW
                userNameInput.value = user.userName || ''; // NEW
                userEmailInput.value = user.email || ''; // NEW
                userMobileInput.value = user.mobile || '';
                educationalBackgroundInput.value = user.educationalBackground || ''; // NEW
                favoriteSportsTeamInput.value = user.favoriteSportsTeam || ''; // NEW
                favoriteMovieBookInput.value = user.favoriteMovieBook || ''; // NEW
                importantDatesInput.value = user.importantDates || ''; // NEW
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

    const cropperModal = document.getElementById('cropperModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const imageToCrop = document.getElementById('imageToCrop');
    const saveCropBtn = document.getElementById('saveCrop');
    const cancelCropBtn = document.getElementById('cancelCrop');
    let cropper;

    photoUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imageToCrop.src = e.target.result;
                cropperModal.style.display = 'block';
                modalOverlay.style.display = 'block';
                cropper = new Cropper(imageToCrop, {
                    aspectRatio: 1,
                    viewMode: 1,
                    movable: true,
                    zoomable: true,
                    rotatable: true,
                    scalable: true,
                });
            };
            reader.readAsDataURL(file);
        }
    });

    removePhotoBtn.addEventListener('click', () => {
        profileImage.src = 'images/profile.png';
        localStorage.removeItem('profileImage');
        showToast('Profile photo removed.', 'info');
    });

    saveCropBtn.addEventListener('click', () => {
        const canvas = cropper.getCroppedCanvas({
            width: 155,
            height: 155,
        });
        const croppedImageUrl = canvas.toDataURL('image/png');
        profileImage.src = croppedImageUrl;
        localStorage.setItem('profileImage', croppedImageUrl);
        cropper.destroy();
        cropperModal.style.display = 'none';
        modalOverlay.style.display = 'none';
        showToast('Profile photo updated!', 'success');
    });

    cancelCropBtn.addEventListener('click', () => {
        cropper.destroy();
        cropperModal.style.display = 'none';
        modalOverlay.style.display = 'none';
    });

    // --- Save Profile Data Functionality ---
    saveProfileBtn.addEventListener('click', async () => {
        showLoader();
        const [day, month, year] = userDobInput.value.split('/');
        const dobISO = userDobInput.value ? new Date(`${year}-${month}-${day}`).toISOString() : null;

        const profileData = {
            fullName: fullNameInput.value, // NEW
            userName: userNameInput.value, // NEW
            email: userEmailInput.value, // NEW
            mobile: userMobileInput.value,
            educationalBackground: educationalBackgroundInput.value, // NEW
            favoriteSportsTeam: favoriteSportsTeamInput.value, // NEW
            favoriteMovieBook: favoriteMovieBookInput.value, // NEW
            importantDates: importantDatesInput.value, // NEW
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
                    if (localStorage.getItem('isNewUser')) {
                        localStorage.removeItem('isNewUser');
                        window.location.href = 'vault.html';
                    } else {
                        window.location.href = 'view-profile.html'; // Redirect to the view page
                    }
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
