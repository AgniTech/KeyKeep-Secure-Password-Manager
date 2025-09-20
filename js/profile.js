document.addEventListener('DOMContentLoaded', async () => {
    // --- Element Selectors ---
    const profileImage = document.getElementById('profileImage');
    const profileImageMenu = document.getElementById('profileImageMenu');
    const photoUploadInput = document.getElementById('photoUploadInput');
    const uploadPhotoBtn = document.getElementById('uploadPhoto');
    const changePhotoBtn = document.getElementById('changePhoto');
    const removePhotoBtn = document.getElementById('removePhoto');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const cropperModal = document.getElementById('cropperModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const imageToCrop = document.getElementById('imageToCrop');
    const saveCropBtn = document.getElementById('saveCrop');
    const cancelCropBtn = document.getElementById('cancelCrop');
    const userDobInput = document.getElementById('userDob');
    let cropper;
    let newProfileImageData = null;

    // --- Profile Menu Logic ---
    profileImage.parentElement.addEventListener('click', (e) => {
        e.stopPropagation();
        profileImageMenu.style.display = profileImageMenu.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
        profileImageMenu.style.display = 'none';
    });

    // --- Image Handling & Cropper Logic ---
    uploadPhotoBtn.addEventListener('click', () => photoUploadInput.click());
    changePhotoBtn.addEventListener('click', () => photoUploadInput.click());

    removePhotoBtn.addEventListener('click', () => {
        newProfileImageData = 'remove'; // Signal to remove image
        profileImage.src = 'images/default-avatar.png';
        alert('Profile photo will be removed when you save changes.');
    });

    photoUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imageToCrop.src = e.target.result;
                modalOverlay.style.display = 'block';
                cropperModal.style.display = 'block';
                if (cropper) cropper.destroy();
                cropper = new Cropper(imageToCrop, { aspectRatio: 1, viewMode: 1 });
            };
            reader.readAsDataURL(file);
        }
    });

    cancelCropBtn.addEventListener('click', () => {
        cropperModal.style.display = 'none';
        modalOverlay.style.display = 'none';
        if (cropper) cropper.destroy();
    });

    saveCropBtn.addEventListener('click', () => {
        const canvas = cropper.getCroppedCanvas({ width: 256, height: 256 });
        newProfileImageData = canvas.toDataURL('image/png');
        profileImage.src = newProfileImageData;
        cropperModal.style.display = 'none';
        modalOverlay.style.display = 'none';
        if (cropper) cropper.destroy();
    });

    // --- Save Profile Logic ---
    const token = localStorage.getItem('token');

    saveProfileBtn.addEventListener('click', async () => {
        const masterPassword = prompt("Please enter your master password to save changes:");
        if (!masterPassword) {
            alert('Master password is required to save changes.');
            return;
        }

        const dobInput = document.getElementById('userDob').value;
        let dobISO = null;
        if (dobInput) {
            const parts = dobInput.split('/');
            if (parts.length === 3) {
                // Create date as UTC to avoid timezone issues on the server
                dobISO = new Date(Date.UTC(parts[2], parts[1] - 1, parts[0])).toISOString();
            }
        }

        const profileData = {
            fullName: document.getElementById('fullName').value,
            userName: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            mobile: document.getElementById('userMobile').value,
            educationalBackground: document.getElementById('educationalBackground').value,
            favoriteSportsTeam: document.getElementById('favoriteSportsTeam').value,
            favoriteMovieBook: document.getElementById('favoriteMovieBook').value,
            importantDates: document.getElementById('importantDates').value,
            dob: dobISO,
            address: document.getElementById('userAddress').value,
            pin: document.getElementById('userPin').value,
            petName: document.getElementById('petName').value,
            masterPassword: masterPassword
        };

        if (newProfileImageData) {
            // If 'remove', send null. Otherwise, send the new image data.
            profileData.profileImage = newProfileImageData === 'remove' ? null : newProfileImageData;
        }

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileData)
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.msg || 'Failed to save profile.');

            alert('Profile updated successfully!');
            window.location.href = 'view-profile.html';

        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });

    // --- Date Formatting ---
    if (userDobInput) {
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
    }

    // --- Initial Data Load (simplified for edit page) ---
    async function loadInitialData() {
        if (!token) {
            window.location.href = 'index.html';
            return;
        }
        try {
            const res = await fetch('/api/user/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return; // Don't block editing if fetch fails

            const user = await res.json();
            document.getElementById('fullName').value = user.fullName || '';
            document.getElementById('userName').value = user.userName || '';
            document.getElementById('userEmail').value = user.email || '';
            document.getElementById('userMobile').value = user.mobile || '';
            document.getElementById('educationalBackground').value = user.educationalBackground || '';
            document.getElementById('favoriteSportsTeam').value = user.favoriteSportsTeam || '';
            document.getElementById('favoriteMovieBook').value = user.favoriteMovieBook || '';
            document.getElementById('importantDates').value = user.importantDates || '';
            if (user.dob) {
                const date = new Date(user.dob);
                const day = String(date.getUTCDate()).padStart(2, '0');
                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                const year = date.getUTCFullYear();
                document.getElementById('userDob').value = `${day}/${month}/${year}`;
            }
            document.getElementById('userAddress').value = user.address || '';
            document.getElementById('userPin').value = user.pin || '';
            document.getElementById('petName').value = user.petName || '';
            // Don't load image here, just show default or let user change it

        } catch (error) {
            console.error('Could not pre-load profile data:', error);
        }
    }

    loadInitialData();
});
