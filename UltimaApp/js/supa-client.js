// Initialize Supabase Client
// We attach it to window so it's globally available like our Store and UI
const SUPABASE_URL = 'https://qtcdkqqjlrphfxrhzpkx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Y2RrcXFqbHJwaGZ4cmh6cGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjYxNjEsImV4cCI6MjA4NTYwMjE2MX0.43vwOFUXGMTRLKary-rYct95g5ZRjGRpuU6h6qYMoW8';

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.IS_LOCAL_FILE = window.location.protocol === 'file:';

console.log('Supabase Client Initialized');

// Check for invalid protocols (file://)
if (window.IS_LOCAL_FILE) {
    console.warn('Running via file:// protocol. Suppressing network errors.');

    // Create a blocking overlay that forces the user to understand the issue
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(5px);';

    overlay.innerHTML = `
        <div style="background:white;padding:2rem;border-radius:1rem;max-width:500px;text-align:center;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);font-family:sans-serif;color:#1f2937;">
            <div style="font-size:3rem;margin-bottom:1rem;">⚠️</div>
            <h2 style="font-size:1.5rem;font-weight:bold;margin-bottom:0.5rem;color:#1f2937;">Modo Archivo Detectado</h2>
            <p style="margin-bottom:1.5rem;line-height:1.5;color:#4b5563;">
                Has abierto la aplicación directamente desde la carpeta. <br>
                <strong>Así NO se pueden ver tus datos</strong> por seguridad del navegador.
            </p>
            
            <div style="background:#eff6ff;padding:1.5rem;border-radius:0.75rem;margin-bottom:1.5rem;text-align:left;">
                <p style="font-weight:bold;color:#1e40af;margin-bottom:0.5rem;">Solución:</p>
                <p style="font-size:0.9rem;color:#1e3a8a;margin-bottom:1rem;">Usa el servidor local que ya está abierto:</p>
                <a href="http://localhost:5500" style="display:block;width:100%;padding:1rem;background:#2563eb;color:white;text-align:center;text-decoration:none;font-weight:bold;border-radius:0.5rem;transition:background 0.2s;">
                    👉 Abrir en Localhost
                </a>
            </div>

            <button onclick="this.closest('div').parentElement.remove()" style="background:none;border:none;color:#9ca3af;text-decoration:underline;cursor:pointer;font-size:0.875rem;">
                Entiendo, quiero ver la app vacía
            </button>
        </div>
    `;

    // Wait for body to be ready
    if (document.body) {
        document.body.appendChild(overlay);
    } else {
        window.addEventListener('DOMContentLoaded', () => document.body.appendChild(overlay));
    }
}

// Simple connection check
(async () => {
    // Skip network check if local file to avoid scary CORS errors
    if (window.IS_LOCAL_FILE) return;

    try {
        const { error } = await window.supabaseClient.from('transactions').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('Supabase Client Failed. Trying Raw Fetch...');

            // INTENTO DE CÓDIGO PURO (Sin librería) para ver si tienes razón
            try {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/transactions?select=count`, {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                });
                if (response.ok) {
                    console.log('✅ ¡EL FETCH PURO FUNCIONA! Es culpa de la librería.');
                    alert('¡Descubierto! El código de la librería fallaba, pero el Fetch manual funciona. Vamos a arreglarlo.');
                    return; // Si esto funciona, salimos y no mostramos error
                } else {
                    console.error('❌ El Fetch puro también falla:', response.status);
                }
            } catch (fetchErr) {
                console.error('❌ Error de Red en Fetch puro:', fetchErr);
            }

            // Si llegamos aquí, fallaron los dos
            console.error('Supabase Connection Error:', error);

            // Global Error Handler for UI
            window.SUPABASE_CONNECTION_ERROR = error;

            let errorMsg = 'Error desconocida';
            let errorTip = 'Verifica tu conexión a internet.';

            // Check for Network/CORS errors which are common with Supabase on localhost if not configured
            if (error.message && (error.message.includes('FetchError') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch'))) {
                errorMsg = 'Error de Conexión (CORS)';
                errorTip = 'Es posible que tu URL actual no esté autorizada en Supabase.';
            } else if (error.code === 'PGRST301') {
                errorMsg = 'Recurso no encontrado';
            }

            const alert = document.createElement('div');
            alert.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl z-[9000] flex items-center gap-4 animate-bounce max-w-md';
            alert.innerHTML = `
                <i class="fa-solid fa-wifi text-2xl"></i>
                <div>
                    <h3 class="font-bold text-lg">${errorMsg}</h3>
                    <p class="text-sm opacity-90">${errorTip}</p>
                    <p class="text-xs mt-1 font-mono opacity-75">${error.message}</p>
                </div>
                <button onclick="this.parentElement.remove()" class="text-white hover:text-gray-200"><i class="fa-solid fa-xmark"></i></button>
            `;
            document.body.appendChild(alert);

            // Auto-hide after 15s
            setTimeout(() => alert.remove(), 15000);

        } else {
            console.log('Supabase Connection OK');
        }
    } catch (err) {
        console.error('Critical Supabase Error:', err);
    }
})();
