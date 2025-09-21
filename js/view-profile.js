document.addEventListener('DOMContentLoaded', async () => {
    await sodium.ready;
    // --- Element Selectors ---
    const profileNameDisplay = document.getElementById('profileNameDisplay');
    const profileEmailDisplay = document.getElementById('profileEmailDisplay');
    const fullNameDisplay = document.getElementById('fullNameDisplay');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const mobileDisplay = document.getElementById('mobileDisplay');
    const educationalBackgroundDisplay = document.getElementById('educationalBackgroundDisplay');
    const favoriteSportsTeamDisplay = document.getElementById('favoriteSportsTeamDisplay');
    const favoriteMovieBookDisplay =  document.getElementById('favoriteMovieBookDisplay');
    const importantDatesDisplay = document.getElementById('importantDatesDisplay');
    const dobDisplay = document.getElementById('dobDisplay');
    const addressDisplay = document.getElementById('addressDisplay');
    const pinDisplay = document.getElementById('pinDisplay');
    const petNameDisplay = document.getElementById('petNameDisplay');
    const profileImage = document.getElementById('profileImage');
    const loaderContainer = document.getElementById('loader-container');
    const modalOverlay = document.getElementById('modalOverlay'); // Assuming modalOverlay exists
    const profileCompletionDisplay = document.getElementById('profileCompletionDisplay');

    // --- Constants ---
    const DEFAULT_AVATAR_PATH = 'images/default-avatar.png';

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

    // --- Profile Completion Calculation ---
    function calculateProfileCompletion(user) {
        const totalFields = 12; // Total number of fields considered for completion
        let completedFields = 0;

        if (user.fullName && user.fullName !== '-') completedFields++;
        if (user.userName && user.userName !== '-') completedFields++;
        if (user.email && user.email !== '-') completedFields++;
        if (user.mobile && user.mobile !== '-') completedFields++;
        if (user.educationalBackground && user.educationalBackground !== '-') completedFields++;
        if (user.favoriteSportsTeam && user.favoriteSportsTeam !== '-') completedFields++;
        if (user.favoriteMovieBook && user.favoriteMovieBook !== '-') completedFields++;
        if (user.importantDates && user.importantDates !== '-') completedFields++;
        if (user.dob) completedFields++; // dob is handled differently as it's a date object
        if (user.address && user.address !== '-') completedFields++;
        if (user.pin && user.pin !== '-') completedFields++;
        if (user.profileImage) completedFields++;

        const percentage = (completedFields / totalFields) * 100;
        return Math.round(percentage);
    }

    // --- Data Loading ---
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
                
                // Populate the display fields
                profileNameDisplay.textContent = user.fullName || user.userName || 'Not Set';
                profileEmailDisplay.textContent = user.email || 'your.email@example.com';
                fullNameDisplay.textContent = user.fullName || '-';
                userNameDisplay.textContent = user.userName || '-';
                mobileDisplay.textContent = user.mobile || '-';
                educationalBackgroundDisplay.textContent = user.educationalBackground || '-';
                favoriteSportsTeamDisplay.textContent = user.favoriteSportsTeam || '-';
                favoriteMovieBookDisplay.textContent = user.favoriteMovieBook || '-';
                importantDatesDisplay.textContent = user.importantDates || '-';
                dobDisplay.textContent = user.dob ? new Date(user.dob).toLocaleDateString() : '-';
                addressDisplay.textContent = user.address || '-';
                pinDisplay.textContent = user.pin || '-';
                petNameDisplay.textContent = user.petName || '-';

                // Calculate and display profile completion
                const completionPercentage = calculateProfileCompletion(user);
                profileCompletionDisplay.textContent = `${completionPercentage}%`;

                // Handle profile image decryption and display
                if (user.profileImage && user.argon2Salt) {
                    const masterPassword = await promptForMasterPassword('Enter your master password to view your profile picture:');
                    if (masterPassword) {
                        const decryptedImage = await decryptWithPassword(user.profileImage, masterPassword, user.argon2Salt);
                        if (decryptedImage) {
                            profileImage.src = decryptedImage;
                            localStorage.setItem('profileImage', decryptedImage); // Cache decrypted image
                        } else {
                            showToast('Failed to decrypt profile picture.', 'error');
                            profileImage.src = DEFAULT_AVATAR_PATH;
                        }
                    } else {
                        showToast('Master password not provided. Profile picture not displayed.', 'info');
                        profileImage.src = DEFAULT_AVATAR_PATH;
                    }
                } else {
                    profileImage.src = DEFAULT_AVATAR_PATH;
                }

            } else {
                console.error('Failed to fetch profile data.');
                profileImage.src = DEFAULT_AVATAR_PATH;
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
            showToast('Could not load your profile data.', 'error');
            profileImage.src = DEFAULT_AVATAR_PATH;
        } finally {
            hideLoader();
        }
    };

    // --- Initial Page Load ---
    loadProfileData();
});
