
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
});
