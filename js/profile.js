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
    const showLoader = () => {
        console.log('Showing loader...');
        loaderContainer.classList.add('show');
    };
    const hideLoader = () => {
        console.log('Hiding loader...');
        loaderContainer.classList.remove('show');
    };

    function showToast(message, type = 'info') {
        console.log(`Toast (${type}): ${message}`);
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
        console.log('Prompting for master password...');
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
        console.log('Updating profile images to:', src);
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
        console.log('Attempting to load profile data...');
        try {
            const response = await fetch('/api/user/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const user = await response.json();
                console.log('Profile data fetched:', user);
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
                console.log('User Argon2 Salt:', userArgon2Salt);

                // Handle profile image decryption and display
                if (user.profileImage) {
                    console.log('Encrypted profile image found. Prompting for master password...');
                    const masterPassword = await promptForMasterPassword('Enter your master password to view your profile picture:');
                    if (masterPassword) {
                        console.log('Attempting to decrypt profile image...');
                        const decryptedImage = await decryptWithPassword(user.profileImage, masterPassword, userArgon2Salt);
                        if (decryptedImage) {
                            console.log('Profile image decrypted successfully.');
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
                    console.log('No profile image found. Displaying default avatar.');
                    updateProfileImages(DEFAULT_AVATAR_PATH);
                }

            } else {
                console.log('Could not fetch profile data, or profile is not yet created. Status:', response.status);
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
    console.log('Profile Image Container:', profileImageContainer);
    console.log('Profile Image Menu:', profileImageMenu);
    console.log('Upload Photo Button:', uploadPhotoBtn);
    console.log('Change Photo Button:', changePhotoBtn);
    console.log('Remove Photo Button:', removePhotoBtn);
    console.log('Photo Upload Input:', photoUploadInput);

    if (profileImageContainer) {
        profileImageContainer.addEventListener('click', (e) => {
            console.log('Profile image container clicked.');
            e.stopPropagation();
            if (profileImageMenu) {
                const currentDisplay = profileImageMenu.style.display;
                profileImageMenu.style.display = currentDisplay === 'block' ? 'none' : 'block';
                console.log('Profile image menu display toggled to:', profileImageMenu.style.display);
            } else {
                console.warn('profileImageMenu element not found when trying to toggle display.');
            }
        });
    } else {
        console.warn('profileImageContainer element not found.');
    }

    document.addEventListener('click', (event) => {
        if (profileImageMenu && !profileImageMenu.contains(event.target) && !profileImageContainer.contains(event.target)) {
            console.log('Click outside profile image menu/container. Hiding menu.');
            profileImageMenu.style.display = 'none';
        }
    });

    if (uploadPhotoBtn) {
        uploadPhotoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Upload Photo button clicked. Triggering file input.');
            photoUploadInput.click();
        });
    } else {
        console.warn('uploadPhotoBtn element not found.');
    }

    if (changePhotoBtn) {
        changePhotoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Change Photo button clicked. Triggering file input.');
            photoUploadInput.click();
        });
    } else {
        console.warn('changePhotoBtn element not found.');
    }

    if (photoUploadInput) {
        photoUploadInput.addEventListener('change', (event) => {
            console.log('Photo upload input change event detected.');
            const file = event.target.files[0];
            if (file) {
                console.log('File selected:', file.name);
                const reader = new FileReader();
                reader.onload = (e) => {
                    console.log('FileReader loaded. Setting image to crop source.');
                    imageToCrop.src = e.target.result;
                    cropperModal.style.display = 'block';
                    modalOverlay.style.display = 'block';
                    if (cropper) {
                        cropper.destroy();
                        console.log('Existing cropper instance destroyed.');
                    }
                    cropper = new Cropper(imageToCrop, {
                        aspectRatio: 1,
                        viewMode: 1,
                        movable: true,
                        zoomable: true,
                        rotatable: true,
                        scalable: true,
                    });
                    console.log('Cropper initialized.');
                };
                reader.readAsDataURL(file);
            } else {
                console.log('No file selected.');
            }
        });
    } else {
        console.warn('photoUploadInput element not found.');
    }

    const saveProfilePicture = async (imageData) => {
        showLoader();
        console.log('Attempting to save profile picture. Image data length:', imageData ? imageData.length : 0);
        try {
            let masterPassword = currentMasterPassword;
            if (!masterPassword) {
                console.log('Master password not cached. Prompting user...');
                masterPassword = await promptForMasterPassword('Enter your master password to save your profile picture:');
            }
            
            if (!masterPassword) {
                showToast('Profile picture update cancelled.', 'info');
                hideLoader();
                return;
            }
            console.log('Master password obtained for saving profile picture.');

            const profileDataForSave = getProfileDataForSave(false); // Get other profile data without image
            const requestBody = { 
                profileImage: imageData, 
                masterPassword: masterPassword, 
                ...profileDataForSave 
            };
            console.log('Sending profile picture save request with body:', requestBody);

            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            console.log('Profile picture save API response:', response.status, data);

            if (response.ok) {
                showToast('Profile picture updated successfully!', 'success');
                localStorage.setItem('profileImage', imageData); // Cache the new image
                updateProfileImages(imageData);
                if (profileImageMenu) profileImageMenu.style.display = 'none';
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
        console.log('Attempting to remove profile picture.');
        try {
            let masterPassword = currentMasterPassword;
            if (!masterPassword) {
                console.log('Master password not cached. Prompting user for removal...');
                masterPassword = await promptForMasterPassword('Enter your master password to remove your profile picture:');
            }

            if (!masterPassword) {
                showToast('Profile picture removal cancelled.', 'info');
                hideLoader();
                return;
            }
            console.log('Master password obtained for removing profile picture.');

            const profileDataForSave = getProfileDataForSave(false); // Get other profile data without image
            const requestBody = { 
                profileImage: null, 
                masterPassword: masterPassword, 
                ...profileDataForSave 
            };
            console.log('Sending profile picture remove request with body:', requestBody);

            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            console.log('Profile picture remove API response:', response.status, data);

            if (response.ok) {
                showToast('Profile picture removed successfully!', 'success');
                localStorage.removeItem('profileImage');
                updateProfileImages(DEFAULT_AVATAR_PATH);
                if (profileImageMenu) profileImageMenu.style.display = 'none';
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

    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', removeProfilePicture);
    } else {
        console.warn('removePhotoBtn element not found.');
    }

    if (saveCropBtn) {
        saveCropBtn.addEventListener('click', () => {
            console.log('Save Crop button clicked.');
            const canvas = cropper.getCroppedCanvas({
                width: 155,
                height: 155,
            });
            const croppedImageUrl = canvas.toDataURL('image/png');
            console.log('Cropped image URL generated. Calling saveProfilePicture.');
            saveProfilePicture(croppedImageUrl); // Call save function
            cropper.destroy();
            cropperModal.style.display = 'none';
            modalOverlay.style.display = 'none';
        });
    } else {
        console.warn('saveCropBtn element not found.');
    }

    if (cancelCropBtn) {
        cancelCropBtn.addEventListener('click', () => {
            console.log('Cancel Crop button clicked.');
            cropper.destroy();
            cropperModal.style.display = 'none';
            modalOverlay.style.display = 'none';
        });
    } else {
        console.warn('cancelCropBtn element not found.');
    }

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
        console.log('Collected profile data for save:', data);
        return data;
    };

    // --- Save Profile Data Functionality ---
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async () => {
            console.log('Save Profile button clicked.');
            showLoader();
            try {
                let masterPassword = currentMasterPassword;
                if (!masterPassword) {
                    console.log('Master password not cached. Prompting user for profile save...');
                    masterPassword = await promptForMasterPassword('Enter your master password to save your profile changes:');
                }

                if (!masterPassword) {
                    showToast('Profile update cancelled.', 'info');
                    hideLoader();
                    return;
                }
                console.log('Master password obtained for saving profile.');

                const profileData = {
                    ...getProfileDataForSave(true), // Include current profile image state
                    masterPassword: masterPassword
                };
                console.log('Sending profile save request with body:', profileData);

                const response = await fetch('/api/user/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(profileData),
                });

                const data = await response.json();
                console.log('Profile save API response:', response.status, data);

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
                console.error('Error saving profile:', error);
                showToast('An error occurred. Please try again.', 'error');
            } finally {
                hideLoader();
            }
        });
    } else {
        console.warn('saveProfileBtn element not found.');
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
    } else {
        console.warn('userDobInput element not found.');
    }

    // --- Initial Page Load ---
    console.log('DOMContentLoaded: Calling loadProfileData()...');
    loadProfileData();
});
