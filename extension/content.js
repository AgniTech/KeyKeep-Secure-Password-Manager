let detectedPasswordForms = new Set();

function findPasswordForms() {
    // Find all password fields that are not part of a login form (e.g., registration, change password)
    document.querySelectorAll('input[type="password"]').forEach(passwordField => {
        const form = passwordField.form;
        if (form && !detectedPasswordForms.has(form)) {
            // Heuristic: If a form has more than one password field, it's likely a registration or change password form.
            const passwordFieldsInForm = form.querySelectorAll('input[type="password"]').length;
            if (passwordFieldsInForm > 1) {
                detectedPasswordForms.add(form);
                form.addEventListener('submit', handleSubmit.bind(null, form));
            }
        }
    });
}

function handleSubmit(form, event) {
    const formData = new FormData(form);
    let username = '';
    let password = '';

    // Find username and password from the form data
    for (let [key, value] of formData.entries()) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('email') || lowerKey.includes('user')) {
            username = value;
        }
        if (lowerKey.includes('password')) {
            // This will grab the last password field, which is often the confirmation
            password = value;
        }
    }

    // Only proceed if we found a username and password
    if (username && password) {
        // Send the detected credentials to the background script to trigger the save popup
        chrome.runtime.sendMessage({
            type: 'CREDENTIAL_DETECTED',
            payload: {
                username,
                password,
                url: window.location.origin
            }
        });
    }
}

// Run the detection logic
findPasswordForms();

// Also, use a MutationObserver to detect forms added to the page dynamically (e.g., in single-page apps)
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
            findPasswordForms();
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });
