// server/vbox-manager.js
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Try to find VBoxManage in common locations
const POSSIBLE_PATHS = [
    'C:\\Program Files\\Oracle\\VirtualBox\\VBoxManage.exe',
    'VBoxManage' // If in PATH
];

class VBoxManager {
    constructor() {
        this.vboxPath = null;
        this.detectPath();
    }

    detectPath() {
        for (const p of POSSIBLE_PATHS) {
            try {
                if (p === 'VBoxManage' || fs.existsSync(p)) {
                    this.vboxPath = p;
                    // console.log(`[VBoxManager] Using executable: ${p}`);
                    break;
                }
            } catch (e) { }
        }
        if (!this.vboxPath) {
            console.error('[VBoxManager] WARNING: VBoxManage not found. VBox scanning will fail.');
        }
    }

    execute(args) {
        return new Promise((resolve, reject) => {
            if (!this.vboxPath) return reject(new Error('VBoxManage not found'));

            // If path has spaces and isn't just "VBoxManage", wrap in quotes for shell execution
            const cmd = this.vboxPath.includes(' ') && this.vboxPath !== 'VBoxManage'
                ? `"${this.vboxPath}"`
                : this.vboxPath;

            exec(`${cmd} ${args}`, (err, stdout, stderr) => {
                if (err) {
                    console.error(`[VBoxManager] Error executing ${args}:`, stderr);
                    return reject(err);
                }
                resolve(stdout.trim());
            });
        });
    }

    async listVMs() {
        try {
            const output = await this.execute('list vms');
            // Output format: "Name" {uuid}
            const vms = [];
            const lines = output.split('\r\n');
            for (const line of lines) {
                const match = line.match(/"([^"]+)" \{([^\}]+)\}/);
                if (match) {
                    vms.push({ name: match[1], id: match[2] });
                }
            }
            return vms;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    async getVMInfo(id) {
        try {
            const output = await this.execute(`showvminfo "${id}" --machinereadable`);
            const info = {};
            output.split('\r\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    // Remove quotes
                    let value = parts[1];
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.substring(1, value.length - 1);
                    }
                    info[parts[0]] = value;
                }
            });

            // Extract interesting fields
            return {
                id: id,
                name: info['name'],
                state: info['VMState'],
                ostype: info['ostype'],
                cpus: info['cpus'],
                memory: info['memory'],
                nic1: info['nic1'], // "bridged", "nat", etc.
                bridgeadapter1: info['bridgeadapter1']
            };
        } catch (e) {
            return null;
        }
    }

    async setBridgedMode(id, adapterName) {
        // VM must be powered off ideally, or use modifyvm if supported live (nic change usually requires poweroff)
        // Check state first
        const info = await this.getVMInfo(id);
        if (info.state === 'running') {
            await this.execute(`controlvm "${id}" poweroff`);
            // Wait a bit? Or just proceed (might fail if not instant)
            await new Promise(r => setTimeout(r, 2000));
        }

        return await this.execute(`modifyvm "${id}" --nic1 bridged --bridgeadapter1 "${adapterName}"`);
    }

    async startVM(id, type = 'headless') {
        return await this.execute(`startvm "${id}" --type ${type}`);
    }

    async stopVM(id) {
        return await this.execute(`controlvm "${id}" poweroff`);
    }

    async rebootVM(id) {
        // Soft reboot if possible, otherwise reset
        return await this.execute(`controlvm "${id}" reset`);
    }

    async getMetrics(id) {
        // VBoxManage metrics collect is complex (requires running metrics collector).
        // For this MVP, we will rely on checking if it's running.
        // If running, we return generic active stats or try to fetch host process stats if possible.
        // For now, we will return simulated "live" stats if the VM is running.
        const info = await this.getVMInfo(id);
        if (info && info.state === 'running') {
            return {
                cpu: Math.floor(Math.random() * 20) + 5, // Simulated load
                ram: Math.floor(Math.random() * 30) + 10
            };
        }
        return { cpu: 0, ram: 0 };
    }

    async executeGuestCommand(id, command, username, password) {
        // Requires Guest Additions
        // VBoxManage guestcontrol <uuid|vmname> run --exe "/bin/sh" --username <user> --password <pass> -- -c "command"
        // Windows guests might need "cmd.exe" and "/c"

        // AUTO-DETECT OS TYPE to choose shell?
        // Simple heuristic: try to execute directly or assume Linux "sh -c" / Windows "cmd /c" based on user input or VM OS type.
        // For MVP, letting user specify full command or wrapping it commonly.

        // Let's assume we pass the command directly to the shell wrapper 
        // CAUTION: quoting provided command is tricky.

        const info = await this.getVMInfo(id);
        if (info.state !== 'running') throw new Error('VM is not running');

        const isWindows = info.ostype.toLowerCase().includes('windows');
        // Use bash for Linux to support $HOME and better syntax
        const exe = isWindows ? 'C:\\Windows\\System32\\cmd.exe' : '/bin/bash';

        let finalCommand = command;
        if (!isWindows) {
            // Force execution in user's home directory
            // We MUST quote this deeply to ensure it survives the Windows Host shell AND VBox argument parsing.
            // On Windows Host, we wrap in double quotes for the arg.
            // Escape inner double quotes.
            finalCommand = `cd $HOME 2>/dev/null; ${command}`;
        }

        // Escape quotes for the wrapping below
        const safeCommand = finalCommand.replace(/"/g, '\\"');

        // We wrap the command argument in quotes so standard shell spaces are kept together
        const args = isWindows
            ? ['/c', `"${safeCommand}"`]
            : ['-c', `"${safeCommand}"`];

        // Build the VBoxManage arguments
        const cmdStr = `guestcontrol "${id}" run --exe "${exe}" --username "${username}" --password "${password}" --wait-stdout -- ${args.join(' ')}`;

        try {
            return await this.execute(cmdStr);
        } catch (e) {
            if (e.message.includes('guest execution service is not ready') || e.message.includes('VBOX_E_IPRT_ERROR')) {
                throw new Error('VirtualBox Guest Additions not detected or not running. Please install Guest Additions on the VM and try again.');
            }
            throw e;
        }
    }
}

module.exports = new VBoxManager();
