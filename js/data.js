// js/data.js

// This file will act as our temporary, shared database.
let credentials = [
    { 
        id: 1, 
        title: 'Google', 
        url: 'https://google.com', 
        username: 'user@example.com', 
        password: 'complex_and_long_password_#123', 
        category: 'work', 
        tags: ['email', 'productivity'],
        lastUpdated: '2025-06-15',
        compromised: false 
    },
    { 
        id: 2, 
        title: 'Facebook', 
        url: 'https://facebook.com', 
        username: 'myusername', 
        password: 'Password123!', // Reused password
        category: 'social', 
        tags: ['social', 'networking'],
        lastUpdated: '2024-11-20',
        compromised: false 
    },
    { 
        id: 3, 
        title: 'Old Bank Site', 
        url: 'https://bofa.com', 
        username: 'account123', 
        password: 'Password123!', // Reused password
        category: 'bank', 
        tags: ['finance', 'banking'],
        lastUpdated: '2023-01-05',
        compromised: false 
    },
    { 
        id: 4, 
        title: 'Weak Test Site', 
        url: 'https://weak.com', 
        username: 'testuser', 
        password: 'password', // Weak password
        category: 'other', 
        tags: ['testing'],
        lastUpdated: '2025-03-01',
        compromised: false 
    },
    { 
        id: 5, 
        title: 'Leaked Forum', 
        url: 'https://leaked.com', 
        username: 'forum_user', 
        password: 'MyLeakedPassword!2022', // Compromised password
        category: 'social', 
        tags: ['forum'],
        lastUpdated: '2022-05-10',
        compromised: true // Manually flagged as compromised
    },
];
