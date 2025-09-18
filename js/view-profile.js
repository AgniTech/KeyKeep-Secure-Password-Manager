document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const profileNameDisplay = document.getElementById('profileNameDisplay');
    const profileEmailDisplay = document.getElementById('profileEmailDisplay');
    const dobDisplay = document.getElementById('dobDisplay');
    const addressDisplay = document.getElementById('addressDisplay');
    const pinDisplay = document.getElementById('pinDisplay');
    const petNameDisplay = document.getElementById('petNameDisplay');
    const profileImage = document.getElementById('profileImage');
    const loaderContainer = document.getElementById('loader-container');

    // --- Helper Functions ---
    const showLoader = () => loaderContainer.classList.add('show');
    const hideLoader = () => loaderContainer.classList.remove('show');

    // --- Authentication Check ---
    const token = localStorage.getItem('token');
    if (!token) {
        showLoader();
        window.location.href = 'index.html';
        return;
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
                profileNameDisplay.textContent = user.name || 'Not Set';
                profileEmailDisplay.textContent = user.email || 'your.email@example.com';
                dobDisplay.textContent = user.dob ? new Date(user.dob).toLocaleDateString() : '-';
                addressDisplay.textContent = user.address || '-';
                pinDisplay.textContent = user.pin || '-';
                
                if (user.securityQuestion && user.securityQuestion.petName) {
                    petNameDisplay.textContent = '********'; // Always mask the answer
                } else {
                    petNameDisplay.textContent = 'Not Set';
                }

            } else {
                console.error('Failed to fetch profile data.');
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
        } finally {
            hideLoader();
        }
    };

    // --- Load Profile Photo ---
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
        profileImage.src = savedImage;
    }

    // --- Initial Page Load ---
    loadProfileData();
});
