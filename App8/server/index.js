// server/index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // Load env vars for Supabase/Config
const config = require('./config');
const sshManager = require('./ssh-manager');
const vboxManager = require('./vbox-manager');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// STORE SERVERS IN DB (Supabase Async)
const db = require('./db');
const { v4: uuidv4 } = require('uuid');

// GET /api/servers
app.get('/api/servers', async (req, res) => {
    try {
        const servers = await db.getAll();
        res.json(servers);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/servers (Add)
app.post('/api/servers', async (req, res) => {
    try {
        const newServer = { id: uuidv4(), ...req.body };
        // Clean up undefined/null values for DB insert if necessary, typically supabase handles it or we ensure schema match
        const added = await db.add(newServer);
        res.json(added);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/servers/:id (Update)
app.put('/api/servers/:id', async (req, res) => {
    try {
        const updated = await db.update(req.params.id, req.body);
        res.json(updated);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE /api/servers/:id
app.delete('/api/servers/:id', async (req, res) => {
    try {
        await db.delete(req.params.id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/server/:id/exec
app.post('/api/server/:id/exec', async (req, res) => {
    const { id } = req.params;
    const { command, password } = req.body;

    try {
        const servers = await db.getAll();
        const server = servers.find(s => s.id === id);

        if (!server) return res.status(404).json({ error: 'Server not found' });

        // VBOX HANDLING
        if (server.type === 'vbox') {
            if (command.includes('shutdown') || command.includes('poweroff')) {
                await vboxManager.stopVM(server.vboxId || server.name);
                return res.json({ output: 'VM Stopping...', code: 0 });
            }
            if (command.includes('reboot')) {
                await vboxManager.rebootVM(server.vboxId || server.name);
                return res.json({ output: 'VM Rebooting...', code: 0 });
            }

            // GUEST EXECUTION
            if (password || true) { // Always attempt execution, UI should prompt/pass password
                const username = req.body.username || server.username || 'user';
                try {
                    const guestRes = await vboxManager.executeGuestCommand(server.vboxId || server.name, command, username, password || server.password);
                    return res.json({ output: guestRes || 'Command Executed', code: 0 });
                } catch (e) {
                    return res.json({ output: `VBox Execution Error: ${e.message}`, code: 1 });
                }
            }
        }

        // SSH HANDLING
        let result;
        if (config.MOCK_MODE) {
            result = await sshManager.mockExec(server, command);
        } else {
            const pwd = password || server.password;
            if (!pwd) return res.status(400).json({ error: 'Password required' });
            result = await sshManager.execCommand(server, command, null, pwd);
        }
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/server/:id/status
app.get('/api/server/:id/status', async (req, res) => {
    const { id } = req.params;
    try {
        const servers = await db.getAll();
        const server = servers.find(s => s.id === id);
        if (!server) return res.status(404).json({ error: 'Server not found' });

        if (config.MOCK_MODE && server.type !== 'vbox') return res.json({ online: true });

        if (server.type === 'vbox') {
            const info = await vboxManager.getVMInfo(server.vboxId || server.name);
            const isOnline = info && info.state === 'running';
            return res.json({ online: isOnline });
        }

        const isOnline = await sshManager.testConnection(server, server.password);
        res.json({ online: isOnline });
    } catch (e) {
        res.json({ online: false });
    }
});

// GET /api/server/:id/stats
app.get('/api/server/:id/stats', async (req, res) => {
    const { id } = req.params;
    try {
        const servers = await db.getAll();
        const server = servers.find(s => s.id === id);
        if (!server) return res.status(404).json({ error: 'Server not found' });

        if (server.type === 'vbox') {
            const metrics = await vboxManager.getMetrics(server.vboxId || server.name);
            return res.json(metrics);
        } else {
            if (config.MOCK_MODE) {
                return res.json({ cpu: Math.floor(Math.random() * 30), ram: Math.floor(Math.random() * 40) });
            }
            const metrics = await sshManager.getStats(server, server.password);
            return res.json(metrics);
        }
    } catch (e) {
        res.json({ cpu: 0, ram: 0 });
    }
});

// VIRTUALBOX API
app.get('/api/vbox/list', async (req, res) => {
    const vms = await vboxManager.listVMs();
    const detailed = await Promise.all(vms.map(async vm => {
        const info = await vboxManager.getVMInfo(vm.id);
        return info || vm;
    }));
    res.json(detailed);
});

// SCAN AND IMPORT
app.post('/api/vbox/scan', async (req, res) => {
    try {
        const vms = await vboxManager.listVMs();
        const existingup = await db.getAll(); // ASYNC now
        let addedCount = 0;

        for (const vm of vms) {
            const exists = existingup.find(s => s.vboxId === vm.id || (s.type === 'vbox' && s.name === vm.name));
            if (!exists) {
                const info = await vboxManager.getVMInfo(vm.id);
                await db.add({
                    id: uuidv4(),
                    name: vm.name,
                    host: 'Local Virtual Machine',
                    type: 'vbox',
                    vboxId: vm.id,
                    username: '',
                    password: '',
                    os: info ? info.ostype : 'Unknown'
                });
                addedCount++;
            }
        }
        res.json({ success: true, added: addedCount });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/vbox/interfaces', (req, res) => {
    exec('powershell "Get-NetAdapter | Where-Object { $_.Status -eq \'Up\' } | Select-Object -ExpandProperty InterfaceDescription"', (err, stdout) => {
        if (err) return res.json([]);
        const adapters = stdout.trim().split('\r\n').filter(a => a);
        res.json(adapters);
    });
});

app.post('/api/vbox/setup', async (req, res) => {
    const { id, adapter } = req.body;
    try {
        if (adapter) await vboxManager.setBridgedMode(id, adapter);
        await vboxManager.startVM(id, 'headless');
        res.json({ success: true, message: 'VM Started' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/vbox/open-gui', async (req, res) => {
    try {
        let vboxId = req.body.id;
        // Resolve vboxId if needed (if internal id passed)
        try {
            const servers = await db.getAll();
            const server = servers.find(s => s.id === vboxId);
            if (server && server.vboxId) vboxId = server.vboxId;
        } catch (e) { } // ignore if db fail

        await vboxManager.startVM(vboxId, 'gui');
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(config.PORT, () => {
    console.log(`Server running on http://localhost:${config.PORT}`);
    console.log(`Supabase Integration Active`);
});
