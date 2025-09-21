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

    // --- Image Handling & Cropper Logic ---
    let newProfileImageData = null; 

    // Wire up the menu buttons to the hidden file input
    uploadPhotoBtn.addEventListener('click', () => photoUploadInput.click());
    changePhotoBtn.addEventListener('click', () => photoUploadInput.click());

    // Handle the "Remove Photo" button
    removePhotoBtn.addEventListener('click', () => {
        newProfileImageData = null; // Use null as a signal to the server to remove the image
        profileImage.src = 'images/default-avatar.png';
        alert('Profile photo will be removed when you save changes.');
    });

    // When a new file is selected, open the cropping modal
    photoUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imageToCrop.src = e.target.result;
                modalOverlay.style.display = 'block';
                cropperModal.style.display = 'block';
                if (cropper) cropper.destroy(); // Destroy old cropper instance
                // Initialize Cropper.js
                cropper = new Cropper(imageToCrop, { aspectRatio: 1, viewMode: 1 });
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle the crop modal buttons
    cancelCropBtn.addEventListener('click', () => {
        cropperModal.style.display = 'none';
        modalOverlay.style.display = 'none';
        if (cropper) cropper.destroy();
    });

    saveCropBtn.addEventListener('click', () => {
        const canvas = cropper.getCroppedCanvas({ width: 256, height: 256 });
        newProfileImageData = canvas.toDataURL('image/png'); // Store the cropped image data
        profileImage.src = newProfileImageData; // Update the preview
        
        // Hide the modal
        cropperModal.style.display = 'none';
        modalOverlay.style.display = 'none';
        if (cropper) cropper.destroy();
    });

    // --- Save Profile Logic ---
    saveProfileBtn.addEventListener('click', async () => {
        // Add loading state
        showLoader();
        saveProfileBtn.disabled = true;
        saveProfileBtn.textContent = 'Saving...';

        try {
            // 1. Prompt for the master password - THIS IS THE KEY FIX
            const masterPassword = await promptForMasterPassword("Please enter your master password to save changes:");
            if (!masterPassword) {
                showToast('Master password is required to save changes.', 'warning');
                return;
            }

            // 2. Gather all data from the input fields
            const profileData = {
                fullName: document.getElementById('fullName').value,
                userName: document.getElementById('userName').value,
                email: document.getElementById('userEmail').value,
                mobile: document.getElementById('userMobile').value,
                educationalBackground: document.getElementById('educationalBackground').value,
                favoriteSportsTeam: document.getElementById('favoriteSportsTeam').value,
                favoriteMovieBook: document.getElementById('favoriteMovieBook').value,
                importantDates: document.getElementById('importantDates').value,
                dob: document.getElementById('userDob').value,
                address: document.getElementById('userAddress').value,
                pin: document.getElementById('userPin').value,
                petName: document.getElementById('petName').value,
                masterPassword: masterPassword // Include the password in the request
            };

            // 3. Add the new image data if it exists
            if (newProfileImageData !== null) {
                profileData.profileImage = newProfileImageData;
            }

            // 4. Send the data to the server
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
            window.location.href = 'view-profile.html'; // Redirect to view page on success

        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        } finally {
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
});
