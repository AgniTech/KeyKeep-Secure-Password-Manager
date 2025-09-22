document.addEventListener('DOMContentLoaded', () => {
    const scoreCircle = document.getElementById('scoreCircle');
    const scoreText = document.getElementById('scoreText');
    const scoreSummary = document.getElementById('scoreSummary');
    const compromisedCard = document.getElementById('compromisedCard');
    const reusedCard = document.getElementById('reusedCard');
    const weakCard = document.getElementById('weakCard');
    const strongCard = document.getElementById('strongCard'); // Added strongCard
    const vulnerableListContainer = document.querySelector('.vulnerable-list .list-container');

    // --- Authentication Check ---
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No authentication token found. Cannot fetch user profile for strength analysis.');
        window.location.href = 'index.html'; // Redirect to login page
        return;
    }

    // Master Password Popup Elements
    const masterPasswordOverlay = document.getElementById('masterPasswordOverlay');
    const masterPasswordPopup = masterPasswordOverlay.querySelector('.master-password-popup');
    const masterPasswordInput = document.getElementById('masterPasswordInput');
    const unlockVaultButton = document.getElementById('unlockVaultButton');
    const cancelUnlockButton = document.getElementById('cancelUnlockButton');
    const masterPasswordError = document.getElementById('masterPasswordError');

    let decryptedCredentials = []; // This will hold the decrypted credentials after successful unlock

    const showMasterPasswordPopup = () => {
        masterPasswordOverlay.classList.add('show');
        masterPasswordPopup.classList.add('show');
        masterPasswordInput.value = ''; // Clear previous input
        masterPasswordError.textContent = ''; // Clear previous errors
        masterPasswordInput.focus();
    };

    const hideMasterPasswordPopup = () => {
        masterPasswordOverlay.classList.remove('show');
        masterPasswordPopup.classList.remove('show');
    };

    const unlockAndFetchCredentials = async (masterPassword) => {
        try {
            const response = await fetch('/api/vault/unlock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ masterPassword: masterPassword }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.credentials) {
                    return data.credentials;
                } else {
                    masterPasswordError.textContent = 'Failed to retrieve vault data after unlock.';
                    return null;
                }
            } else {
                const errorData = await response.json();
                masterPasswordError.textContent = errorData.message || 'Incorrect Master Password.';
                return null;
            }
        } catch (error) {
            console.error('Error unlocking vault:', error);
            masterPasswordError.textContent = 'An error occurred during unlock. Please try again.';
            return null;
        }
    };

    unlockVaultButton.addEventListener('click', async () => {
        const masterPassword = masterPasswordInput.value;
        if (!masterPassword) {
            masterPasswordError.textContent = 'Master Password cannot be empty.';
            return;
        }

        const credentialsData = await unlockAndFetchCredentials(masterPassword);
        if (credentialsData) {
            decryptedCredentials = credentialsData;
            hideMasterPasswordPopup();
            initHealthAnalysis();
        }
    });

    cancelUnlockButton.addEventListener('click', () => {
        hideMasterPasswordPopup();
        window.location.href = 'vault.html'; // Redirect to vault page if user cancels
    });

    const fetchUserProfile = async () => {
        try {
            const response = await fetch('/api/user/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const user = await response.json();
                return user;
            } else {
                console.error('Failed to fetch user profile:', response.statusText);
                return null;
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    };


    const renderDashboard = (analysis) => {
        setTimeout(() => {
            scoreCircle.style.setProperty('--score', analysis.healthScore);
        }, 100);
        scoreText.textContent = `${analysis.healthScore}%`;

        if(analysis.healthScore > 90) scoreSummary.textContent = "Excellent! Your vault is very secure.";
        else if(analysis.healthScore > 70) scoreSummary.textContent = "Good, but there's room for improvement.";
        else scoreSummary.textContent = "Your vault needs attention. Please review the items below.";

        compromisedCard.querySelector('.count').textContent = analysis.compromised;
        reusedCard.querySelector('.count').textContent = analysis.reused;
        weakCard.querySelector('.count').textContent = analysis.weak;
        if (strongCard) {
            strongCard.querySelector('.count').textContent = analysis.strong;
        }

        vulnerableListContainer.innerHTML = '';
        let hasVulnerabilities = false;

        if (analysis.details.compromisedPasswords.length > 0) {
            hasVulnerabilities = true;
            const compromisedSection = document.createElement('div');
            compromisedSection.className = 'compromised-section';
            compromisedSection.innerHTML = `
                <h4>⚠️ Compromised Passwords (${analysis.details.compromisedPasswords.length})</h4>
                <p class="warning">These passwords have been found in data breaches and should be changed immediately!</p>
                ${analysis.details.compromisedPasswords.map(item => `
                    <div class="vulnerable-item critical">
                        <div class="vulnerable-icon">🔥</div>
                        <div class="vulnerable-details">
                            <h4>${item.title}</h4>
                            <p><strong>Reason:</strong> ${item.reason}</p>
                        </div>
                        <div class="vulnerable-action">
                            <button onclick="changePassword('${item.title}', '${item.username}')" class="button danger change-btn">Change Now</button>
                        </div>
                    </div>
                `).join('')}
            `;
            vulnerableListContainer.appendChild(compromisedSection);
        }

        if (analysis.details.reusedPasswords.length > 0) {
            hasVulnerabilities = true;
            const reusedSection = document.createElement('div');
            reusedSection.className = 'reused-section';
            reusedSection.innerHTML = `
                <h4>🔄 Reused Passwords (${analysis.details.reusedPasswords.length})</h4>
                ${analysis.details.reusedPasswords.map(item => `
                    <div class="vulnerable-item warning">
                        <div class="vulnerable-icon">🔁</div>
                        <div class="vulnerable-details">
                            <h4>${item.title}</h4>
                            <p><strong>Reason:</strong> Used ${item.count} times</p>
                        </div>
                        <div class="vulnerable-action">
                            <a href="vault.html" class="button secondary">Go to Vault</a>
                        </div>
                    </div>
                `).join('')}
            `;
            vulnerableListContainer.appendChild(reusedSection);
        }

        if (analysis.details.weakPasswords.length > 0) {
            hasVulnerabilities = true;
            const weakSection = document.createElement('div');
            weakSection.className = 'weak-section';
            weakSection.innerHTML = `
                <h4>💪 Weak Passwords (${analysis.details.weakPasswords.length})</h4>
                ${analysis.details.weakPasswords.map(item => `
                    <div class="vulnerable-item info">
                        <div class="vulnerable-icon">🩹</div>
                        <div class="vulnerable-details">
                            <h4>${item.title}</h4>
                            <p><strong>Reason:</strong> ${item.reason}</p>
                        </div>
                        <div class="vulnerable-action">
                            <a href="vault.html" class="button secondary">Go to Vault</a>
                        </div>
                    </div>
                `).join('')}
            `;
            vulnerableListContainer.appendChild(weakSection);
        }

        if (!hasVulnerabilities) {
            vulnerableListContainer.innerHTML = '<p class="all-good-message">Your vault is looking secure. Great job!</p>';
        }
    };

    const initHealthAnalysis = async () => {
        if (decryptedCredentials.length === 0) {
            console.error('No decrypted credentials available for analysis. Re-showing unlock popup.');
            showMasterPasswordPopup();
            return;
        }

        const userProfile = await fetchUserProfile();

        try {
            const response = await fetch('/api/vault/health', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ credentials: decryptedCredentials, userProfile }),
            });

            if (response.ok) {
                const healthReport = await response.json();
                renderDashboard(healthReport);
            } else {
                console.error('Failed to get health analysis:', response.statusText);
                // Optionally, render an error state on the dashboard
            }
        } catch (error) {
            console.error('Error getting health analysis:', error);
        }
    };

    function changePassword(site, username) {
        alert(`It's recommended to change your password for ${site} (${username}) immediately.`);
        // In a real application, this would redirect to a page to edit the credential
        // For example: window.location.href = `vault.html?edit=${site}`;
    }

    // Make the function globally accessible so inline onclick can call it
    window.changePassword = changePassword;

    showMasterPasswordPopup();
});