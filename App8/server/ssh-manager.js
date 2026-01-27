// server/ssh-manager.js
const { Client } = require('ssh2');

class SSHManager {
    constructor() {
        this.connections = new Map();
    }

    // Helper to get connection config (passwords should ideally be separate)
    // For this demo, we assume the user might put password in the request or config
    // In a real app, use SSH Agent or key paths
    getConfig(serverConfig) {
        return {
            host: serverConfig.host,
            port: 22,
            username: serverConfig.username,
            // We will accept password from the 'connect' request usually
        };
    }

    // Check if we can connect (simple handshake)
    async testConnection(serverConfig, password) {
        return new Promise((resolve) => {
            const conn = new Client();
            // Timeout fast for status checks
            const config = {
                host: serverConfig.host,
                port: 22,
                username: serverConfig.username,
                password: password,
                readyTimeout: 2000, // 2 seconds timeout
                keepaliveInterval: 0
            };

            conn.on('ready', () => {
                conn.end();
                resolve(true);
            }).on('error', (err) => {
                // console.error('Connection check failed:', err.message);
                resolve(false);
            }).connect(config);
        });
    }

    async execCommand(serverConfig, command, socketId, password) {
        return new Promise((resolve, reject) => {
            const conn = new Client();

            const config = {
                host: serverConfig.host,
                port: 22,
                username: serverConfig.username,
                password: password, // PASSED FROM FRONTEND FOR NOW (SIMPLEST FOR DEMO)
                readyTimeout: 5000
            };

            conn.on('ready', () => {
                conn.exec(command, (err, stream) => {
                    if (err) {
                        conn.end();
                        return reject(err);
                    }
                    let output = '';
                    stream.on('close', (code, signal) => {
                        conn.end();
                        resolve({ output, code });
                    }).on('data', (data) => {
                        output += data;
                    }).stderr.on('data', (data) => {
                        output += data;
                    });
                });
            }).on('error', (err) => {
                reject(err);
            }).connect(config);
        });
    }

    // Mock execution for development
    async mockExec(serverConfig, command) {
        console.log(`[MOCK] Executing on ${serverConfig.name}: ${command}`);
        if (command.includes('systemctl status')) {
            return { output: 'Active: active (running)', code: 0 };
        }
        if (command.includes('ip a')) {
            return { output: `inet ${serverConfig.host}/24`, code: 0 };
        }
        return { output: `Mock output for: ${command}`, code: 0 };
    }

    async getStats(serverConfig, password) {
        // Command to get CPU and RAM usage
        // CPU: top -bn1 | grep "Cpu(s)"
        // RAM: free -m
        const cmd = `top -bn1 | grep "Cpu(s)" && free -m`;
        try {
            const result = await this.execCommand(serverConfig, cmd, null, password);
            const output = result.output;

            // Parse CPU
            // Cpu(s):  1.5%us,  0.5%sy, ... -> extract us+sy or using IDLE to calc load
            // Linux top output varies. Simplest for percent: 100 - idle
            let cpu = 0;
            const cpuMatch = output.match(/id,\s*(\d+\.?\d*)\s*wa/); // matches "... id, ... wa" typical in some tops
            // Or generic: ... 95.0 id ...
            const generalCpu = output.match(/(\d+\.?\d*)\s*id/);
            if (generalCpu) {
                cpu = 100 - parseFloat(generalCpu[1]);
            }

            // Parse RAM
            // Mem:   16384   8000 ...
            // free -m output:
            //               total        used        free      shared  buff/cache   available
            // Mem:           7961        3922         466         396        3573        3378
            const memMatch = output.match(/Mem:\s+(\d+)\s+(\d+)/);
            let ram = 0;
            if (memMatch) {
                const total = parseInt(memMatch[1]);
                const used = parseInt(memMatch[2]);
                if (total > 0) ram = (used / total) * 100;
            }

            return { cpu: Math.round(cpu * 10) / 10, ram: Math.round(ram * 10) / 10 };

        } catch (e) {
            console.error("Stats error", e);
            return { cpu: 0, ram: 0 };
        }
    }
}

module.exports = new SSHManager();
