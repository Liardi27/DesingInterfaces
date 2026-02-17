
// Initialize Supabase Client
// Simple, clean version to rule out recent bugs
// Initialize Supabase Client (Standard Configuration)
// Initialize Supabase Client (Standard Configuration)
// Valid config restored from debug-gh.html (Original Project)
const SUPABASE_URL = 'https://qtcdkqqjlrphfxrhzpkx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Y2RrcXFqbHJwaGZ4cmh6cGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjYxNjEsImV4cCI6MjA4NTYwMjE2MX0.43vwOFUXGMTRLKary-rYct95g5ZRjGRpuU6h6qYMoW8';

// BROKEN CONFIG (Invalid Key Format):
// const SUPABASE_URL = 'https://vedpoayvzzoozpshghwy.supabase.co'.trim();
// const SUPABASE_KEY = 'sb_publishable_2KQubV3vQT3oVH6qRMyS3g_q3iT6wH6'.trim();

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
