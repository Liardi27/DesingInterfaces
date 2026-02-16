
// Initialize Supabase Client
// Simple, clean version to rule out recent bugs
const SUPABASE_URL = 'https://qtcdkqqjlrphfxrhzpkx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Y2RrcXFqbHJwaGZ4cmh6cGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjYxNjEsImV4cCI6MjA4NTYwMjE2MX0.43vwOFUXGMTRLKary-rYct95g5ZRjGRpuU6h6qYMoW8';

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('Supabase Client Initialized (Minimal Version)');

// Simple test (Silent)
(async () => {
    try {
        const { count, error } = await window.supabaseClient.from('transactions').select('*', { count: 'exact', head: true });
        if (error) console.error('Supabase Error:', error);
        else console.log('Supabase Connected. Count:', count);
    } catch (e) {
        console.error('Supabase Exception:', e);
    }
})();
