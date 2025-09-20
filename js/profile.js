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

    // --- Master Password Prompt Modal ---
    function promptForMasterPassword(message) {
        return new Promise((resolve) => {
            const passwordModal = document.createElement('div');
            passwordModal.id = 'masterPasswordModal';
            passwordModal.className = 'modal glassmorphism';
            passwordModal.innerHTML = `
                <h2>${message}</h2>
                <form id="masterPasswordForm">
                    <div class="input-group">
                        <label for="modalMasterPassword">Master Password:</label>
                        <input type="password" id="modalMasterPassword" required autocomplete="current-password">
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="button secondary" id="cancelMasterPassword">Cancel</button>
                        <button type="submit" class="button primary">Submit</button>
                    </div>
                </form>
            `;
            document.body.appendChild(passwordModal);
            if (modalOverlay) modalOverlay.style.display = 'block';
            passwordModal.style.display = 'block';

            const form = passwordModal.querySelector('#masterPasswordForm');
            const passwordInput = passwordModal.querySelector('#modalMasterPassword');
            const cancelBtn = passwordModal.querySelector('#cancelMasterPassword');

            passwordInput.focus();

            const close = () => {
                passwordModal.remove();
                if (modalOverlay) modalOverlay.style.display = 'none';
                resolve(null);
            };

            form.onsubmit = (e) => {
                e.preventDefault();
                const enteredPassword = passwordInput.value;
                passwordModal.remove();
                if (modalOverlay) modalOverlay.style.display = 'none';
                resolve(enteredPassword);
            };

            cancelBtn.onclick = close;
        });
    }

    // --- Profile Menu Logic ---
    if (profileImage && profileImage.parentElement) {
        profileImage.parentElement.addEventListener('click', (e) => {
            e.stopPropagation();
            if (profileImageMenu) profileImageMenu.style.display = profileImageMenu.style.display === 'block' ? 'none' : 'block';
        });
    }

    document.addEventListener('click', () => {
        if (profileImageMenu) profileImageMenu.style.display = 'none';
    });

    // --- Image Handling & Cropper Logic ---
    if (uploadPhotoBtn) uploadPhotoBtn.addEventListener('click', () => photoUploadInput.click());
    if (changePhotoBtn) changePhotoBtn.addEventListener('click', () => photoUploadInput.click());

    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', () => {
            newProfileImageData = 'remove';
            if (profileImage) profileImage.src = 'images/default-avatar.png';
            alert('Profile photo will be removed when you save changes.');
        });
    }

    if (photoUploadInput) {
        photoUploadInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (imageToCrop) imageToCrop.src = e.target.result;
                    if (modalOverlay) modalOverlay.style.display = 'block';
                    if (cropperModal) cropperModal.style.display = 'block';
                    if (cropper) cropper.destroy();
                    if (imageToCrop) cropper = new Cropper(imageToCrop, { aspectRatio: 1, viewMode: 1 });
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (cancelCropBtn) {
        cancelCropBtn.addEventListener('click', () => {
            if (cropperModal) cropperModal.style.display = 'none';
            if (modalOverlay) modalOverlay.style.display = 'none';
            if (cropper) cropper.destroy();
        });
    }

    if (saveCropBtn) {
        saveCropBtn.addEventListener('click', () => {
            if (!cropper) return;
            const canvas = cropper.getCroppedCanvas({ width: 256, height: 256 });
            newProfileImageData = canvas.toDataURL('image/png');
            if (profileImage) profileImage.src = newProfileImageData;
            if (cropperModal) cropperModal.style.display = 'none';
            if (modalOverlay) modalOverlay.style.display = 'none';
            cropper.destroy();
        });
    }

    // --- Save Profile Logic ---
    const token = localStorage.getItem('token');

    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async () => {
            const masterPassword = await promptForMasterPassword("Please enter your master password to save changes:");
            if (!masterPassword) {
                alert('Master password is required to save changes.');
                return;
            }

            const dobInput = document.getElementById('userDob').value;
            let dobISO = null;
            if (dobInput) {
                const parts = dobInput.split('/');
                if (parts.length === 3) {
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
    }

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
            if (!res.ok) return;

            const user = await res.json();
            const fullNameInput = document.getElementById('fullName');
            const userNameInput = document.getElementById('userName');
            const userEmailInput = document.getElementById('userEmail');
            const userMobileInput = document.getElementById('userMobile');
            const educationalBackgroundInput = document.getElementById('educationalBackground');
            const favoriteSportsTeamInput = document.getElementById('favoriteSportsTeam');
            const favoriteMovieBookInput = document.getElementById('favoriteMovieBook');
            const importantDatesInput = document.getElementById('importantDates');
            const userDobInput = document.getElementById('userDob');
            const userAddressInput = document.getElementById('userAddress');
            const userPinInput = document.getElementById('userPin');
            const petNameInput = document.getElementById('petName');

            if (fullNameInput) fullNameInput.value = user.fullName || '';
            if (userNameInput) userNameInput.value = user.userName || '';
            if (userEmailInput) userEmailInput.value = user.email || '';
            if (userMobileInput) userMobileInput.value = user.mobile || '';
            if (educationalBackgroundInput) educationalBackgroundInput.value = user.educationalBackground || '';
            if (favoriteSportsTeamInput) favoriteSportsTeamInput.value = user.favoriteSportsTeam || '';
            if (favoriteMovieBookInput) favoriteMovieBookInput.value = user.favoriteMovieBook || '';
            if (importantDatesInput) importantDatesInput.value = user.importantDates || '';
            if (user.dob && userDobInput) {
                const date = new Date(user.dob);
                const day = String(date.getUTCDate()).padStart(2, '0');
                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                const year = date.getUTCFullYear();
                userDobInput.value = `${day}/${month}/${year}`;
            }
            if (userAddressInput) userAddressInput.value = user.address || '';
            if (userPinInput) userPinInput.value = user.pin || '';
            if (petNameInput) petNameInput.value = user.petName || '';

        } catch (error) {
            console.error('Could not pre-load profile data:', error);
        }
    }

    loadInitialData();
});
