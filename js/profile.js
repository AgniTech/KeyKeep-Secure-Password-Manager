(async () => {
    // Wait for libsodium to be ready
    await sodium.ready;
    
    // Now libsodium is available


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
    const profileCompletionDisplay = document.getElementById('profileCompletionDisplay');

    // --- Profile Image Elements ---
    const profileImageContainer = document.querySelector('.profile-image-container');
    const profileImage = document.getElementById('profileImage');
    const profileImageMenu = document.getElementById('profileImageMenu');
    const uploadPhotoBtn = document.getElementById('uploadPhoto');
    const changePhotoBtn = document.getElementById('changePhoto');
    const removePhotoBtn = document.getElementById('removePhoto');
    const photoUploadInput = document.getElementById('photoUploadInput');

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
            let modalOverlay = document.getElementById('modalOverlay');
            if (!modalOverlay) {
                modalOverlay = document.createElement('div');
                modalOverlay.id = 'modalOverlay';
                modalOverlay.className = 'modal-overlay'; // Ensure it has the class for styling
                document.body.appendChild(modalOverlay);
                console.log('modalOverlay created and appended.');
            } else {
                console.log('modalOverlay found.');
            }

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
            console.log('passwordModal created and appended.');
            
            // Make them visible
            modalOverlay.classList.add('show');
            passwordModal.classList.add('show');
            console.log('Added show class to modalOverlay and passwordModal.');

            const form = passwordModal.querySelector('#masterPasswordForm');
            const passwordInput = passwordModal.querySelector('#modalMasterPassword');
            const cancelBtn = passwordModal.querySelector('#cancelMasterPassword');

            passwordInput.focus();
            console.log('Password input focused.');

            const close = (reason) => {
                console.log(`Closing modal: ${reason}`);
                passwordModal.classList.remove('show');
                modalOverlay.classList.remove('show');
                // Allow transition to finish before removing
                setTimeout(() => {
                    passwordModal.remove();
                    // Only remove overlay if it was dynamically created by this function
                    if (modalOverlay.id === 'modalOverlay' && !document.querySelector('[data-original-modal-overlay]')) {
                        modalOverlay.remove();
                    }
                    resolve(null); // Resolve with null on cancel
                }, 500); 
            };

            form.onsubmit = (e) => {
                e.preventDefault();
                const enteredPassword = passwordInput.value;
                console.log('Form submitted.');
                passwordModal.classList.remove('show');
                modalOverlay.classList.remove('show');
                setTimeout(() => {
                    passwordModal.remove();
                    // Only remove overlay if it was dynamically created by this function
                    if (modalOverlay.id === 'modalOverlay' && !document.querySelector('[data-original-modal-overlay]')) {
                        modalOverlay.remove();
                    }
                    resolve(enteredPassword);
                }, 500);
            };

            cancelBtn.onclick = () => close('cancel button clicked');
            modalOverlay.onclick = () => close('overlay clicked');
        });
    }

    // --- sodium Encryption/Decryption Helpers ---
    const OPSLIMIT = sodium.crypto_pwhash_OPSLIMIT_MODERATE;
    const MEMLIMIT = sodium.crypto_pwhash_MEMLIMIT_MODERATE;
    const ALG = sodium.crypto_pwhash_ALG_ARGON2ID13;

    async function deriveKeyFromPassword(password, salt) {
        if (!salt) throw new Error('Invalid salt: empty or missing');
        let saltBytes;
        try {
            saltBytes = sodium.from_base64(salt);
        } catch (err) {
            console.error('Salt is invalid Base64:', salt, err);
            throw new Error('Invalid salt for key derivation');
        }
        const passwordBytes = sodium.from_string(password);
        const key = sodium.crypto_pwhash(
            sodium.crypto_aead_aes256gcm_KEYBYTES,
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
        const nonce = sodium.randombytes_buf(sodium.crypto_aead_aes256gcm_NPUBBYTES);
        const encrypted = sodium.crypto_aead_aes256gcm_encrypt(
            sodium.from_string(plaintext),
            null, // AAD
            nonce,
            key
        );
        return sodium.to_base64(nonce) + ':' + sodium.to_base64(encrypted);
    }

    async function decryptWithPassword(encryptedData, password, salt) {
        if (!encryptedData) return null;
        try {
            const [nonceB64, encryptedB64] = encryptedData.split(':');
            const nonce = sodium.from_base64(nonceB64);
            const encrypted = sodium.from_base64(encryptedB64);
            const key = await deriveKeyFromPassword(password, salt);
            const decrypted = sodium.crypto_aead_aes256gcm_decrypt(
                nonce,
                encrypted,
                null, // AAD
                key
            );
            return sodium.to_string(decrypted);
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

    // --- Profile Completion Calculation ---
    function calculateProfileCompletion(user) {
        const totalFields = 12; // Total number of fields considered for completion
        let completedFields = 0;

        // Check each field for a non-empty value
        if (user.fullName && user.fullName !== '') completedFields++;
        if (user.userName && user.userName !== '') completedFields++;
        if (user.email && user.email !== '') completedFields++;
        if (user.mobile && user.mobile !== '') completedFields++;
        if (user.educationalBackground && user.educationalBackground !== '') completedFields++;
        if (user.favoriteSportsTeam && user.favoriteSportsTeam !== '') completedFields++;
        if (user.favoriteMovieBook && user.favoriteMovieBook !== '') completedFields++;
        if (user.importantDates && user.importantDates !== '') completedFields++;
        if (user.dob) completedFields++; // dob is handled differently as it's a date object
        if (user.address && user.address !== '') completedFields++;
        if (user.pin && user.pin !== '') completedFields++;
        if (user.profileImage) completedFields++;

        const percentage = (completedFields / totalFields) * 100;
        return Math.round(percentage);
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

                // Calculate and display profile completion
                const completionPercentage = calculateProfileCompletion(user);
                if (profileCompletionDisplay) {
                    profileCompletionDisplay.textContent = `${completionPercentage}%`;
                }

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

    // --- Profile Menu Logic ---
    profileImage.parentElement.addEventListener('click', (e) => {
        // Stop the click from bubbling up to the document
        e.stopPropagation();
        // Toggle the menu's visibility
        profileImageMenu.style.display = profileImageMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Add a listener to the whole page to close the menu when you click elsewhere
    document.addEventListener('click', () => {
        profileImageMenu.style.display = 'none';
    });

    // --- Image Handling Logic (Cropper Removed) ---
    let newProfileImageData = null; 

    // Wire up the menu buttons to the hidden file input
    uploadPhotoBtn.addEventListener('click', () => photoUploadInput.click());
    changePhotoBtn.addEventListener('click', () => photoUploadInput.click());

    // Handle the "Remove Photo" button
    removePhotoBtn.addEventListener('click', () => {
        newProfileImageData = "remove"; // Use "remove" as a signal to the server to remove the image
        updateProfileImages(DEFAULT_AVATAR_PATH);
        showToast('Profile photo will be removed when you save changes.', 'info');
    });

    // When a new file is selected, directly process it without cropping
    photoUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Basic validation (optional, but good practice)
        if (!file.type.startsWith('image/')) {
            showToast('Please select a valid image file.', 'warning');
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            showToast('Image is too large. Please select an image under 2MB.', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            // The result is a base64 Data URL
            newProfileImageData = e.target.result;
            // Update the preview
            updateProfileImages(newProfileImageData);
            showToast('Profile photo selected. Click "Save Changes" to apply.', 'info');
        };
        reader.onerror = () => {
            showToast('Error reading file.', 'error');
        };
        reader.readAsDataURL(file);
    });

    saveProfileBtn.addEventListener('click', async () => {
        saveProfileBtn.disabled = true;
        saveProfileBtn.textContent = 'Saving...';

        try {
            const masterPassword = await promptForMasterPassword("Please enter your master password to save changes:");
            if (!masterPassword) {
                showToast('Master password is required to save changes.', 'warning');
                saveProfileBtn.disabled = false;
                saveProfileBtn.textContent = 'Save Changes';
                return;
            }

            showLoader();

            // Gather all data
            const profileData = {
                fullName: fullNameInput.value,
                userName: userNameInput.value,
                email: userEmailInput.value,
                mobile: userMobileInput.value,
                educationalBackground: educationalBackgroundInput.value,
                favoriteSportsTeam: favoriteSportsTeamInput.value,
                favoriteMovieBook: favoriteMovieBookInput.value,
                importantDates: importantDatesInput.value,
                dob: userDobInput.value,
                address: userAddressInput.value,
                pin: userPinInput.value,
                petName: petNameInput.value,
            };

            // Ensure salt exists
            if (!userArgon2Salt || typeof userArgon2Salt !== 'string' || userArgon2Salt.trim() === '') {
                showToast('Profile salt not available. Please refresh and try again.', 'error');
                hideLoader();
                saveProfileBtn.disabled = false;
                saveProfileBtn.textContent = 'Save Changes';
                return;
            }

            // Handle image
            if (newProfileImageData === "remove") {
                profileData.profileImage = null;
            } else if (newProfileImageData && typeof newProfileImageData === 'string' && newProfileImageData.startsWith('data:image/')) {
                try {
                    console.log('Encrypting image with master password and salt...');
                    profileData.profileImage = await encryptWithPassword(newProfileImageData, masterPassword, userArgon2Salt);
                    if (!profileData.profileImage) {
                        throw new Error('Encryption returned null.');
                    }
                } catch (err) {
                    console.error('Error encrypting image:', err);
                    showToast('Failed to encrypt profile image. Please try again.', 'error');
                    hideLoader();
                    saveProfileBtn.disabled = false;
                    saveProfileBtn.textContent = 'Save Changes';
                    return;
                }
            }
            profileData.masterPassword = masterPassword;

            // Send to server
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

            showToast('Profile updated successfully!', 'success');
            window.location.href = 'view-profile.html';

        } catch (error) {
            console.error('Save profile error:', error);
            showToast(`Error: ${error.message}`, 'error');
            hideLoader();
            saveProfileBtn.disabled = false;
            saveProfileBtn.textContent = 'Save Changes';
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
    } else {
        console.warn('userDobInput element not found.');
    }

    // --- Initial Page Load ---
    console.log('DOMContentLoaded: Calling loadProfileData()...');
    loadProfileData();
})();
