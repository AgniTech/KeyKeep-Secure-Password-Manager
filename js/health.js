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

    const analyzeVault = (userProfile) => {
        const totalPasswords = decryptedCredentials.length;
        if (totalPasswords === 0) return { score: 100, compromised: [], reused: {}, weak: [], strong: 0 };

        const compromised = decryptedCredentials.filter(c => c.compromised);

        const passwordCounts = {};
        decryptedCredentials.forEach(c => {
            passwordCounts[c.password] = (passwordCounts[c.password] || 0) + 1;
        });
        const reusedPasswords = Object.keys(passwordCounts).filter(p => passwordCounts[p] > 1);
        const reused = decryptedCredentials.filter(c => reusedPasswords.includes(c.password));

        const weak = decryptedCredentials.filter(c => isWeak(c.password, userProfile));

        // Calculate unique vulnerable credentials for score and strong count
        const vulnerableIds = new Set();
        compromised.forEach(c => vulnerableIds.add(c.id));
        reused.forEach(c => vulnerableIds.add(c.id));
        weak.forEach(c => vulnerableIds.add(c.id));

        const uniqueVulnerableCount = vulnerableIds.size;
        const strong = totalPasswords - uniqueVulnerableCount;

        let score = 100;
        score -= compromised.length * 15; // High penalty
        score -= reused.length * 5;      // Medium penalty
        score -= weak.length * 5;        // Medium penalty
        score = Math.max(0, Math.floor(score)); // Ensure score is not negative

        return { score, compromised, reused, weak, strong };
    };

    const isWeak = (password, userProfile) => {
        const lowerCasePassword = password.toLowerCase();

        // 1. Basic checks
        let weaknessFound = password.length < 8 || /^[a-zA-Z]+$/.test(password) || /^[0-9]+$/.test(password);
        if (weaknessFound) return true;

        // 2. Common weak passwords
        const commonWeakPasswords = [
            "password", "123456", "12345678", "qwerty", "123456789", "12345", "1234",
            "p@ssword", "admin", "guest", "welcome", "secret", "master", "dragon",
            "football", "iloveyou", "america", "princess", "superman", "batman",
            "starwars", "pokemon", "computer", "internet", "qazwsx", "asdfgh", "zxcvbn",
            "qwert", "asdfg", "zxcvb", "12345", "23456", "34567", "45678", "56789",
            "ytrewq", "lkjhgf", "mnbvcx", "pass", "test", "user", "login", "admin1",
            "password123", "123password", "abcde", "edcba", "abcdef", "fedcba"
        ];
        if (commonWeakPasswords.includes(lowerCasePassword)) {
            return true;
        }

        // 3. Sequential characters (e.g., "abc", "123", "321")
        const checkSequential = (str, len = 3) => {
            for (let i = 0; i <= str.length - len; i++) {
                const sub = str.substring(i, i + len);
                // Ascending sequence (e.g., abc, 123)
                let isAscending = true;
                for (let j = 0; j < sub.length - 1; j++) {
                    if (sub.charCodeAt(j + 1) - sub.charCodeAt(j) !== 1) {
                        isAscending = false;
                        break;
                    }
                }
                if (isAscending) return true;

                // Descending sequence (e.g., cba, 321)
                let isDescending = true;
                for (let j = 0; j < sub.length - 1; j++) {
                    if (sub.charCodeAt(j) - sub.charCodeAt(j + 1) !== 1) {
                        isDescending = false;
                        break;
                    }
                }
                if (isDescending) return true;
            }
            return false;
        };
        if (checkSequential(lowerCasePassword, 3)) { // Check for sequences of 3 or more
            return true;
        }

        // 4. Repeated characters (e.g., "aaa", "111")
        if (/(.)\1\1/.test(lowerCasePassword)) { // Checks for any character repeated 3 or more times
            return true;
        }

        // 5. User profile details
        if (userProfile) {
            const cleanAndNormalize = (str) => {
                if (!str || typeof str !== 'string') return [];
                // Remove common special characters and split by spaces or non-alphanumeric
                return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ').filter(s => s.length > 2);
            };

            let personalInfoParts = [];

            // Add all relevant user profile fields
            personalInfoParts.push(...cleanAndNormalize(userProfile.fullName));
            personalInfoParts.push(...cleanAndNormalize(userProfile.userName));
            personalInfoParts.push(...cleanAndNormalize(userProfile.email));
            personalInfoParts.push(...cleanAndNormalize(userProfile.mobile));
            personalInfoParts.push(...cleanAndNormalize(userProfile.educationalBackground));
            personalInfoParts.push(...cleanAndNormalize(userProfile.favoriteSportsTeam));
            personalInfoParts.push(...cleanAndNormalize(userProfile.favoriteMovieBook));
            personalInfoParts.push(...cleanAndNormalize(userProfile.address));
            personalInfoParts.push(...cleanAndNormalize(userProfile.pin));
            personalInfoParts.push(...cleanAndNormalize(userProfile.petName));
            personalInfoParts.push(...cleanAndNormalize(userProfile.name)); // Assuming 'name' might be a separate field

            // Extract parts from email
            if (userProfile.email && typeof userProfile.email === 'string') {
                const emailParts = userProfile.email.split('@');
                if (emailParts[0]) personalInfoParts.push(...cleanAndNormalize(emailParts[0]));
                if (emailParts[1]) personalInfoParts.push(...cleanAndNormalize(emailParts[1].split('.')[0])); // Domain part without .com
            }

            // Extract parts from DOB
            if (userProfile.dob) {
                try {
                    const dobDate = new Date(userProfile.dob);
                    if (!isNaN(dobDate.getTime())) {
                        const year = dobDate.getFullYear().toString();
                        const month = (dobDate.getMonth() + 1).toString();
                        const day = dobDate.getDate().toString();

                        personalInfoParts.push(year);
                        personalInfoParts.push(month);
                        personalInfoParts.push(day);
                        if (month.length === 1) personalInfoParts.push('0' + month);
                        if (day.length === 1) personalInfoParts.push('0' + day);
                        personalInfoParts.push(month + day); // e.g., 0101 for Jan 1
                        personalInfoParts.push(day + month); // e.g., 0101 for Jan 1
                        personalInfoParts.push(year.substring(2)); // last two digits of year
                    }
                } catch (e) {
                    console.warn('Could not parse DOB:', userProfile.dob, e);
                }
            }

            // Extract parts from importantDates
            if (userProfile.importantDates && typeof userProfile.importantDates === 'string') {
                try {
                    const impDate = new Date(userProfile.importantDates);
                    if (!isNaN(impDate.getTime())) {
                        const year = impDate.getFullYear().toString();
                        const month = (impDate.getMonth() + 1).toString();
                        const day = impDate.getDate().toString();
                        personalInfoParts.push(year);
                        personalInfoParts.push(month);
                        personalInfoParts.push(day);
                        if (month.length === 1) personalInfoParts.push('0' + month);
                        if (day.length === 1) personalInfoParts.push('0' + day);
                        personalInfoParts.push(month + day);
                        personalInfoParts.push(day + month);
                        personalInfoParts.push(year.substring(2));
                    }
                } catch (e) {
                    // Handle parsing error if necessary
                }
                personalInfoParts.push(...cleanAndNormalize(userProfile.importantDates));
            }

            // Remove duplicates and filter out very short parts
            personalInfoParts = [...new Set(personalInfoParts)].filter(part => part.length > 2);

            for (const part of personalInfoParts) {
                if (lowerCasePassword.includes(part)) {
                    return true; // Password contains a significant part of personal info
                }
            }
        }

        return false; // If no weakness found
    };

    const renderDashboard = (analysis) => {
        setTimeout(() => {
            scoreCircle.style.setProperty('--score', analysis.score);
        }, 100);
        scoreText.textContent = `${analysis.score}%`;
        
        if(analysis.score > 90) scoreSummary.textContent = "Excellent! Your vault is very secure.";
        else if(analysis.score > 70) scoreSummary.textContent = "Good, but there's room for improvement.";
        else scoreSummary.textContent = "Your vault needs attention. Please review the items below.";

        compromisedCard.querySelector('.count').textContent = analysis.compromised.length;
        reusedCard.querySelector('.count').textContent = analysis.reused.length;
        weakCard.querySelector('.count').textContent = analysis.weak.length;
        if (strongCard) { // Update strong card if it exists
            strongCard.querySelector('.count').textContent = analysis.strong;
        }

        vulnerableListContainer.innerHTML = '';
        let hasVulnerabilities = false;

        // Consolidate vulnerable items
        const consolidatedVulnerabilities = new Map(); // Map<credentialId, {cred, reasons[]}>

        analysis.compromised.forEach(c => {
            if (!consolidatedVulnerabilities.has(c.id)) {
                consolidatedVulnerabilities.set(c.id, { cred: c, reasons: [] });
            }
            consolidatedVulnerabilities.get(c.id).reasons.push('Compromised - Found in a data breach. Change it immediately.');
        });
        analysis.reused.forEach(c => {
            if (!consolidatedVulnerabilities.has(c.id)) {
                consolidatedVulnerabilities.set(c.id, { cred: c, reasons: [] });
            }
            consolidatedVulnerabilities.get(c.id).reasons.push('Reused - This password is used on multiple sites.');
        });
        analysis.weak.forEach(c => {
            if (!consolidatedVulnerabilities.has(c.id)) {
                consolidatedVulnerabilities.set(c.id, { cred: c, reasons: [] });
            }
            consolidatedVulnerabilities.get(c.id).reasons.push('Weak - Password is too simple or short or contains personal information.');
        });

        // Render consolidated items
        if (consolidatedVulnerabilities.size > 0) {
            hasVulnerabilities = true;
            consolidatedVulnerabilities.forEach(({ cred, reasons }) => {
                const item = document.createElement('div');
                item.className = 'vulnerable-item';
                // Determine icon based on highest risk (Compromised > Reused > Weak)
                let icon = '🩹'; // Default to weak
                if (reasons.some(r => r.includes('Compromised'))) icon = '🔥';
                else if (reasons.some(r => r.includes('Reused'))) icon = '🔁';

                item.innerHTML = `
                    <div class="vulnerable-icon">${icon}</div>
                    <div class="vulnerable-details">
                        <h4>${cred.title}</h4>
                        <p><strong>Reasons:</strong> ${reasons.join('<br>')}</p>
                    </div>
                    <div class="vulnerable-action">
                        <a href="vault.html" class="button secondary">Go to Vault</a>
                    </div>
                `;
                vulnerableListContainer.appendChild(item);
            });
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
        const analysisResults = analyzeVault(userProfile);
        renderDashboard(analysisResults);
    };

    showMasterPasswordPopup();
});