const supabase = require('./supabase');

class Database {
    async getAll() {
        const { data, error } = await supabase.from('servers').select('*');
        if (error) {
            console.error('Supabase Read Error:', error);
            return [];
        }
        return data;
    }

    async add(server) {
        // Ensure vboxId is present if type is vbox
        if (server.type === 'vbox' && !server.vboxId) {
            console.warn('Adding VBox server without vboxId');
        }

        const { data, error } = await supabase.from('servers').insert([server]).select();
        if (error) {
            console.error('Supabase Insert Error:', error);
            throw error;
        }
        return data ? data[0] : server;
    }

    async update(id, updates) {
        const { data, error } = await supabase
            .from('servers')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Supabase Update Error:', error);
            return null;
        }
        return data ? data[0] : null;
    }

    async delete(id) {
        const { error } = await supabase.from('servers').delete().eq('id', id);
        if (error) {
            console.error('Supabase Delete Error:', error);
        }
        return true;
    }
}

module.exports = new Database();
