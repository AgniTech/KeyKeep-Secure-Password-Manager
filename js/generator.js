// js/generator.js

document.addEventListener('DOMContentLoaded', () => {
    const passwordLengthSlider = document.getElementById('passwordLength');
    const lengthValueSpan = document.getElementById('lengthValue');
    const includeUppercaseCheckbox = document.getElementById('includeUppercase');
    const includeLowercaseCheckbox = document.getElementById('includeLowercase');
    const includeNumbersCheckbox = document.getElementById('includeNumbers');
    const includeSymbolsCheckbox = document.getElementById('includeSymbols');
    const generateButton = document.getElementById('generateButton');
    const generatedPasswordInput = document.getElementById('generatedPassword');
    const copyPasswordButton = document.getElementById('copyPassword');

    // Update password length display
    if (passwordLengthSlider && lengthValueSpan) {
        passwordLengthSlider.addEventListener('input', () => {
            lengthValueSpan.textContent = passwordLengthSlider.value;
        });
    }

    // Password generation function
    function generatePassword() {
        const length = parseInt(passwordLengthSlider.value);
        let chars = '';
        if (includeUppercaseCheckbox.checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (includeLowercaseCheckbox.checked) chars += 'abcdefghijklmnopqrstuvwxyz';
        if (includeNumbersCheckbox.checked) chars += '0123456789';
        if (includeSymbolsCheckbox.checked) chars += '!@#$%^&*()_+=-`~[]\{}|;\':",./<>?';

        let password = '';
        if (chars.length === 0) {
            return '';
        }
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * chars.length);
            password += chars.charAt(randomIndex);
        }
        return password;
    }

    // Generate password on button click
    if (generateButton && generatedPasswordInput) {
        generateButton.addEventListener('click', () => {
            generatedPasswordInput.value = generatePassword();
        });
    }

    // Copy password to clipboard
    if (copyPasswordButton && generatedPasswordInput) {
        copyPasswordButton.addEventListener('click', () => {
            const password = generatedPasswordInput.value;
            if (password) {
                navigator.clipboard.writeText(password).then(() => {
                    window.showToast('Password copied to clipboard!', 'success');
                    window.setupClipboardAutoClear();
                }).catch(err => {
                    console.error('Failed to copy password: ', err);
                    showToast('Failed to copy password.');
                });
            } else {
                showToast('No password to copy.');
            }
        });
    }

    // Initial password generation on page load (optional)
    if (generateButton) {
        generateButton.click();
    }
});