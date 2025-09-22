import compromisedChecker from './compromisedPasswords.js';

function isWeak(password, userProfile) {
    const lowerCasePassword = password.toLowerCase();

    // 1. Basic checks
    if (password.length < 8) return { weak: true, reason: "Too short (less than 8 characters)" };
    if (!/[A-Z]/.test(password)) return { weak: true, reason: "Missing uppercase letters" };
    if (!/[a-z]/.test(password)) return { weak: true, reason: "Missing lowercase letters" };
    if (!/[0-9]/.test(password)) return { weak: true, reason: "Missing numbers" };
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { weak: true, reason: "Missing special characters" };

    // 2. Common weak passwords (this list should ideally be in a separate file or config)
    const commonWeakPasswords = [
        "password", "123456", "12345678", "qwerty", "123456789", "12345", "1234",
        "p@ssword", "admin", "guest", "welcome", "secret", "master", "dragon",
        "football", "iloveyou", "america", "princess", "superman", "batman",
    ];
    if (commonWeakPasswords.includes(lowerCasePassword)) {
        return { weak: true, reason: "Commonly used password" };
    }

    // 3. Checks against user profile data
    if (userProfile) {
        const personalInfo = [
            userProfile.fullName,
            userProfile.userName,
            userProfile.email,
            userProfile.petName,
            userProfile.dob,
        ].filter(Boolean).map(info => info.toLowerCase());

        for (const info of personalInfo) {
            if (lowerCasePassword.includes(info)) {
                return { weak: true, reason: "Contains personal information" };
            }
        }
    }

    return { weak: false, reason: "" };
}

function analyzePasswordHealth(credentials, userProfile) {
    const total = credentials.length;
    if (total === 0) {
        return {
            total: 0, strong: 0, weak: 0, reused: 0, compromised: 0, healthScore: 100,
            details: { compromisedPasswords: [], reusedPasswords: [], weakPasswords: [] }
        };
    }

    const analysis = {
        strong: 0, weak: 0, reused: 0, compromised: 0,
        details: { compromisedPasswords: [], reusedPasswords: [], weakPasswords: [] }
    };

    const passwordCounts = new Map();
    credentials.forEach(cred => {
        passwordCounts.set(cred.password, (passwordCounts.get(cred.password) || 0) + 1);
    });

    const vulnerableCreds = new Set();

    credentials.forEach(cred => {
        let isVulnerable = false;

        // Check for compromised
        if (compromisedChecker.isPasswordCompromised(cred.password)) {
            isVulnerable = true;
            analysis.details.compromisedPasswords.push({
                title: cred.title,
                username: cred.username,
                reason: 'Password found in known data breaches'
            });
        }

        // Check for reused
        const count = passwordCounts.get(cred.password);
        if (count > 1) {
            isVulnerable = true;
            analysis.details.reusedPasswords.push({
                title: cred.title,
                username: cred.username,
                count: count
            });
        }

        // Check for weak
        const weakness = isWeak(cred.password, userProfile);
        if (weakness.weak) {
            isVulnerable = true;
            analysis.details.weakPasswords.push({
                title: cred.title,
                username: cred.username,
                reason: weakness.reason
            });
        }

        if (isVulnerable) {
            vulnerableCreds.add(cred.id);
        }
    });

    // Set the counts based on the details arrays
    analysis.compromised = analysis.details.compromisedPasswords.length;
    analysis.reused = analysis.details.reusedPasswords.length;
    analysis.weak = analysis.details.weakPasswords.length;

    // Strong passwords are those with no vulnerabilities
    analysis.strong = total - vulnerableCreds.size;

    // Calculate health score based on unique vulnerable credentials
    const score = (
        (analysis.strong * 1.0) +
        ((total - analysis.strong) * 0.2) // Simplified penalty for any vulnerability
    ) / total;

    analysis.healthScore = Math.round(score * 100);
    analysis.total = total;

    return analysis;
}

export { analyzePasswordHealth };
