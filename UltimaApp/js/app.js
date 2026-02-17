
// Main App Entry - No imports needed, we assume Global classes exist

// Initialize core modules
window.auth = new window.Auth();
window.store = new window.Store();
window.ui = new window.UI();
window.router = new window.Router();

// Init app
document.addEventListener('DOMContentLoaded', async () => {
    // Wait a tick just to be safe
    setTimeout(async () => {
        if (window.i18n) window.i18n.init(); // Initialize language
        window.ui.applyAccessibilityModes(); // Apply saved preferences first
        await window.auth.init(); // Check session
        await window.store.init(); // Load data
        window.router.init(); // Handle initial URL
    }, 10);

    // Global Connectivity Listeners
    window.addEventListener('online', () => {
        console.log('Network is ONLINE. Attempting reconnection...');
        if (window.ui) window.ui.showNotification('Conexión restaurada', 'success');
        // Reload data if we were in offline mode
        if (window.IS_OFFLINE_MODE && window.store) {
            window.store.init();
        }
    });

    window.addEventListener('offline', () => {
        console.log('Network is OFFLINE.');
        if (window.ui) window.ui.showNotification('Conexión perdida. Modo Offline activado.', 'error');
        window.IS_OFFLINE_MODE = true;
    });
});
