
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qtcdkqqjlrphfxrhzpkx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Y2RrcXFqbHJwaGZ4cmh6cGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjYxNjEsImV4cCI6MjA4NTYwMjE2MX0.43vwOFUXGMTRLKary-rYct95g5ZRjGRpuU6h6qYMoW8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
    console.log('Testing Supabase Connection...');
    try {
        const { data, error } = await supabase.from('transactions').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection FAILED:', error.message);
            console.error('Full Error:', error);
        } else {
            console.log('✅ Connection SUCCESSFUL!');
            console.log('Data:', data);
        }
    } catch (err) {
        console.error('❌ CRITICAL ERROR:', err);
    }
}

testConnection();
