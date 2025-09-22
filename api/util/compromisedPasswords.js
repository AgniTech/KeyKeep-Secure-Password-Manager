import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CompromisedPasswordChecker {
    constructor() {
        this.compromisedPasswords = new Set();
        this.loadCompromisedPasswords();
    }

    loadCompromisedPasswords() {
        try {
            // Path is relative to the `api/util` directory, so we need to go up two levels
            const leakedFilePath = path.join(__dirname, '../../Data/Leaked.txt');
            const fileContent = fs.readFileSync(leakedFilePath, 'utf8');

            // Split by lines and add to Set for O(1) lookup
            const passwords = fileContent.split('\n')
                .map(password => password.trim().toLowerCase())
                .filter(password => password.length > 0);

            this.compromisedPasswords = new Set(passwords);
            console.log(`Loaded ${this.compromisedPasswords.size} compromised passwords`);
        } catch (error) {
            console.error('Error loading compromised passwords:', error);
            this.compromisedPasswords = new Set();
        }
    }

    isPasswordCompromised(password) {
        if (!password) return false;

        // Check both original case and lowercase
        const normalizedPassword = password.toLowerCase().trim();
        return this.compromisedPasswords.has(normalizedPassword) ||
               this.compromisedPasswords.has(password.trim());
    }

    // Refresh the list if needed
    refreshList() {
        this.loadCompromisedPasswords();
    }
}

// Create singleton instance
const compromisedChecker = new CompromisedPasswordChecker();

export default compromisedChecker;
