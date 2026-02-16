// Initialize Supabase Client
// We attach it to window so it's globally available like our Store and UI
const SUPABASE_URL = 'https://qtcdkqqjlrphfxrhzpkx.supabase.co';
const SUPABASE_KEY = 'sb_publishable__ukvb9Cg1nF0h337pkTLDw_FA1hwm-k';

// Note: Usually Supabase Keys start with 'ey...'. 
// The user provided a 'sb_publishable' key. We will try to use it.
// If it fails, we might need the standard ANON key.

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('Supabase Client Initialized');

// Simple connection check
(async () => {
    try {
        const { data, error } = await window.supabaseClient.from('transactions').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('Supabase Connection Error:', error);
            // Optionally show toast or alert?
            // Let's create a global error handler for auth/init
            if (error.code === 'PGRST301' || error.message === 'NetworkError' || error.message.includes('FetchError')) {
                // Often 301/404 means URL is wrong. 401/403 means Key is wrong.
                window.SUPABASE_CONNECTION_ERROR = error;
                const alert = document.createElement('div');
                alert.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg z-[9999] font-bold animate-bounce';
                alert.innerText = `Error de Conexión Supabase: ${error.message || 'Clave Incorrecta'}`;
                document.body.appendChild(alert);
                setTimeout(() => alert.remove(), 10000);
            }
        } else {
            console.log('Supabase Connection OK');
        }
    } catch (err) {
        console.error('Critical Supabase Error:', err);
        const alert = document.createElement('div');
        alert.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg z-[9999] font-bold animate-bounce';
        alert.innerText = `Error Crítico: ${err.message}`;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 10000);
    }
})();
