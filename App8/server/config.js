// server/config.js
require('dotenv').config();

// Default Mock Servers (Users can override via .env or editing this)
const SERVERS = [
    {
        id: '1',
        name: 'Web Server (Nginx)',
        host: '192.168.1.10',
        username: 'user', // Default
        // password or privateKeyPath should be handled securely
        type: 'linux'
    },
    {
        id: '2',
        name: 'Database (MariaDB)',
        host: '192.168.1.11',
        username: 'user',
        type: 'linux'
    }
];

module.exports = {
    PORT: process.env.PORT || 3001,
    SERVERS: SERVERS,
    // Secret key for mock mode (e.g., if we want to bypass SSH)
    MOCK_MODE: process.env.MOCK_MODE === 'true'
};
