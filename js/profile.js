document.addEventListener('DOMContentLoaded', async () => {
    // --- Element Selectors ---
    const saveProfileBtn = document.getElementById('saveProfileBtn');
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
    const loaderContainer = document.getElementById('loader-container');

    // --- Profile Image Elements ---
    const profileImageContainer = document.querySelector('.profile-image-container');
    const profileImage = document.getElementById('profileImage');
    const profileImageMenu = document.getElementById('profileImageMenu');
    const uploadPhotoBtn = document.getElementById('uploadPhoto');
    const changePhotoBtn = document.getElementById('changePhoto');
    const removePhotoBtn = document.getElementById('removePhoto');
    const photoUploadInput = document.getElementById('photoUploadInput');

    // Cropper Modal Elements
    const cropperModal = document.getElementById('cropperModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const imageToCrop = document.getElementById('imageToCrop');
    const saveCropBtn = document.getElementById('saveCrop');
    const cancelCropBtn = document.getElementById('cancelCrop');
    let cropper;

    // --- Constants ---
    const DEFAULT_AVATAR_PATH = 'images/default-avatar.png';
    let userArgon2Salt = null; // To store the salt fetched from the backend
    let currentMasterPassword = null; // To cache the master password for encryption/decryption

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
            modalOverlay.style.display = 'block';
            passwordModal.style.display = 'block';

            const form = passwordModal.querySelector('#masterPasswordForm');
            const passwordInput = passwordModal.querySelector('#modalMasterPassword');
            const cancelBtn = passwordModal.querySelector('#cancelMasterPassword');

            passwordInput.focus();

            const close = () => {
                passwordModal.remove();
                modalOverlay.style.display = 'none';
                resolve(null); // Resolve with null on cancel
            };

            form.onsubmit = (e) => {
                e.preventDefault();
                const enteredPassword = passwordInput.value;
                passwordModal.remove();
                modalOverlay.style.display = 'none';
                resolve(enteredPassword);
            };

            cancelBtn.onclick = close;
            modalOverlay.onclick = close;
        });
    }

    // --- Libsodium Encryption/Decryption Helpers ---
    await libsodium.ready;

    const OPSLIMIT = libsodium.crypto_pwhash_OPSLIMIT_MODERATE;
    const MEMLIMIT = libsodium.crypto_pwhash_MEMLIMIT_MODERATE;
    const ALG = libsodium.crypto_pwhash_ALG_ARGON2ID13;

    async function deriveKeyFromPassword(password, salt) {
        const passwordBytes = libsodium.from_string(password);
        const saltBytes = libsodium.from_base64(salt);
        const key = libsodium.crypto_pwhash(
            libsodium.crypto_aead_aes256gcm_KEYBYTES,
            passwordBytes,
            saltBytes,
            OPSLIMIT,
            MEMLIMIT,
            ALG
        );
        return key;
    }

    async function encryptWithPassword(plaintext, password, salt) {
        if (!plaintext) return null;
        const key = await deriveKeyFromPassword(password, salt);
        const nonce = libsodium.randombytes_buf(libsodium.crypto_aead_aes256gcm_NPUBBYTES);
        const encrypted = libsodium.crypto_aead_aes256gcm_encrypt(
            libsodium.from_string(plaintext),
            null, // AAD
            nonce,
            key
        );
        return libsodium.to_base64(nonce) + ':' + libsodium.to_base64(encrypted);
    }

    async function decryptWithPassword(encryptedData, password, salt) {
        if (!encryptedData) return null;
        try {
            const [nonceB64, encryptedB64] = encryptedData.split(':');
            const nonce = libsodium.from_base64(nonceB64);
            const encrypted = libsodium.from_base64(encryptedB64);
            const key = await deriveKeyFromPassword(password, salt);
            const decrypted = libsodium.crypto_aead_aes256gcm_decrypt(
                nonce,
                encrypted,
                null, // AAD
                key
            );
            return libsodium.to_string(decrypted);
        } catch (error) {
            console.error('Decryption failed:', error);
            return null;
        }
    }

    // --- Authentication Check ---
    const token = localStorage.getItem('token');
    if (!token) {
        showLoader();
        window.location.href = 'index.html';
        return;
    }

    // --- Profile Data Loading ---
    const updateProfileImages = (src) => {
        profileImage.src = src;
        // Also update the image in vault.html if it's open (though this is a bit hacky for cross-page)
        // A better solution would be a shared state or a refresh mechanism.
        const vaultProfileAvatar = document.getElementById('userProfileAvatar');
        if (vaultProfileAvatar) {
            vaultProfileAvatar.src = src;
        }
    };

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
                fullNameInput.value = user.fullName || '';
                userNameInput.value = user.userName || '';
                userEmailInput.value = user.email || '';
                userMobileInput.value = user.mobile || '';
                educationalBackgroundInput.value = user.educationalBackground || '';
                favoriteSportsTeamInput.value = user.favoriteSportsTeam || '';
                favoriteMovieBookInput.value = user.favoriteMovieBook || '';
                importantDatesInput.value = user.importantDates || '';
                if (user.dob) {
                    const date = new Date(user.dob);
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    userDobInput.value = `${day}/${month}/${year}`;
                }
                userAddressInput.value = user.address || '';
                userPinInput.value = user.pin || '';
                petNameInput.value = user.petName || '';

                userArgon2Salt = user.argon2Salt; // Store the salt

                // Handle profile image decryption and display
                if (user.profileImage) {
                    const masterPassword = await promptForMasterPassword('Enter your master password to view your profile picture:');
                    if (masterPassword) {
                        const decryptedImage = await decryptWithPassword(user.profileImage, masterPassword, userArgon2Salt);
                        if (decryptedImage) {
                            updateProfileImages(decryptedImage);
                            localStorage.setItem('profileImage', decryptedImage); // Cache decrypted image
                            currentMasterPassword = masterPassword; // Cache master password
                        } else {
                            showToast('Failed to decrypt profile picture.', 'error');
                            updateProfileImages(DEFAULT_AVATAR_PATH);
                        }
                    } else {
                        showToast('Master password not provided. Profile picture not displayed.', 'info');
                        updateProfileImages(DEFAULT_AVATAR_PATH);
                    }
                } else {
                    updateProfileImages(DEFAULT_AVATAR_PATH);
                }

            } else {
                console.log('Could not fetch profile data, or profile is not yet created.');
                updateProfileImages(DEFAULT_AVATAR_PATH); // Ensure default avatar is shown
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
            showToast('Could not load your profile data.', 'error');
            updateProfileImages(DEFAULT_AVATAR_PATH); // Ensure default avatar is shown on error
        } finally {
            hideLoader();
        }
    };

    // --- Profile Photo Functionality ---
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
                imageToCrop.src = e.target.result;
                cropperModal.style.display = 'block';
                modalOverlay.style.display = 'block';
                if (cropper) {
                    cropper.destroy();
                }
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

    const saveProfilePicture = async (imageData) => {
        showLoader();
        try {
            let masterPassword = currentMasterPassword;
            if (!masterPassword) {
                masterPassword = await promptForMasterPassword('Enter your master password to save your profile picture:');
            }
            
            if (!masterPassword) {
                showToast('Profile picture update cancelled.', 'info');
                hideLoader();
                return;
            }

            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ profileImage: imageData, masterPassword: masterPassword, ...getProfileDataForSave(false) })
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Profile picture updated successfully!', 'success');
                localStorage.setItem('profileImage', imageData); // Cache the new image
                updateProfileImages(imageData);
                profileImageMenu.style.display = 'none';
                currentMasterPassword = masterPassword; // Cache the master password
            } else {
                showToast(data.msg || 'Failed to save profile picture.', 'error');
            }
        } catch (error) {
            console.error('Error saving profile picture:', error);
            showToast(`Error saving profile picture: ${error.message}`, 'error');
        } finally {
            hideLoader();
        }
    };

    const removeProfilePicture = async () => {
        showLoader();
        try {
            let masterPassword = currentMasterPassword;
            if (!masterPassword) {
                masterPassword = await promptForMasterPassword('Enter your master password to remove your profile picture:');
            }

            if (!masterPassword) {
                showToast('Profile picture removal cancelled.', 'info');
                hideLoader();
                return;
            }

            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ profileImage: null, masterPassword: masterPassword, ...getProfileDataForSave(false) })
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Profile picture removed successfully!', 'success');
                localStorage.removeItem('profileImage');
                updateProfileImages(DEFAULT_AVATAR_PATH);
                profileImageMenu.style.display = 'none';
                currentMasterPassword = masterPassword; // Cache the master password
            } else {
                showToast(data.msg || 'Failed to remove profile picture.', 'error');
            }
        } catch (error) {
            console.error('Error removing profile picture:', error);
            showToast(`Error removing profile picture: ${error.message}`, 'error');
        } finally {
            hideLoader();
        }
    };

    removePhotoBtn.addEventListener('click', removeProfilePicture);

    saveCropBtn.addEventListener('click', () => {
        const canvas = cropper.getCroppedCanvas({
            width: 155,
            height: 155,
        });
        const croppedImageUrl = canvas.toDataURL('image/png');
        saveProfilePicture(croppedImageUrl); // Call save function
        cropper.destroy();
        cropperModal.style.display = 'none';
        modalOverlay.style.display = 'none';
    });

    cancelCropBtn.addEventListener('click', () => {
        cropper.destroy();
        cropperModal.style.display = 'none';
        modalOverlay.style.display = 'none';
    });

    // Helper to get current profile data from inputs for saving
    const getProfileDataForSave = (includeImage = true) => {
        const [day, month, year] = userDobInput.value.split('/');
        const dobISO = userDobInput.value ? new Date(`${year}-${month}-${day}`).toISOString() : null;

        const data = {
            fullName: fullNameInput.value,
            userName: userNameInput.value,
            email: userEmailInput.value,
            mobile: userMobileInput.value,
            educationalBackground: educationalBackgroundInput.value,
            favoriteSportsTeam: favoriteSportsTeamInput.value,
            favoriteMovieBook: favoriteMovieBookInput.value,
            importantDates: importantDatesInput.value,
            dob: dobISO,
            address: userAddressInput.value,
            pin: userPinInput.value,
            petName: petNameInput.value,
        };
        if (includeImage) {
            data.profileImage = profileImage.src === DEFAULT_AVATAR_PATH ? null : profileImage.src;
        }
        return data;
    };

    // --- Save Profile Data Functionality ---
    saveProfileBtn.addEventListener('click', async () => {
        showLoader();
        try {
            let masterPassword = currentMasterPassword;
            if (!masterPassword) {
                masterPassword = await promptForMasterPassword('Enter your master password to save your profile changes:');
            }

            if (!masterPassword) {
                showToast('Profile update cancelled.', 'info');
                hideLoader();
                return;
            }

            const profileData = {
                ...getProfileDataForSave(true), // Include current profile image state
                masterPassword: masterPassword
            };

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
                currentMasterPassword = masterPassword; // Cache the master password
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
