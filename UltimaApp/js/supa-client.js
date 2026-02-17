
// Initialize Supabase Client
// Simple, clean version to rule out recent bugs
// Initialize Supabase Client (Standard Configuration)
// Initialize Supabase Client (Standard Configuration)
const SUPABASE_URL = 'https://vedpoayvzzoozpshghwy.supabase.co'.trim();
const SUPABASE_KEY = 'sb_publishable_2KQubV3vQT3oVH6qRMyS3g_q3iT6wH6'.trim();

console.log('Supabase Config:', {
    url: SUPABASE_URL,
    keyLength: SUPABASE_KEY.length
});

// Create client with explicit options to ensure consistency
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: true, // Default
        autoRefreshToken: true, // Default
    }
});

console.log('Supabase Client Initialized (Standard Check)');

// Connection Check
(async () => {
    console.log('Testing Supabase Connection...');
    try {
        const { count, error } = await window.supabaseClient
            .from('transactions')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Supabase Connection FAILED:', error);
            console.error('Details:', JSON.stringify(error, null, 2));
        } else {
            console.log('✅ Supabase Connection SUCCESS. Count:', count);
        }
    } catch (e) {
        console.error('❌ Supabase Exception:', e);
    }
})();
