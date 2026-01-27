import React, { useState } from 'react';

const CommandModal = ({ isOpen, onClose, server, onExecute }) => {
    const [command, setCommand] = useState('');
    const [output, setOutput] = useState('');
    const [username, setUsername] = useState(server.username || '');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    // Quick Command Presets
    const QUICK_COMMANDS = [
        { label: 'System Info', cmd_linux: 'uname -a && cat /etc/os-release', cmd_win: 'systeminfo' },
        { label: 'Disk Usage', cmd_linux: 'df -h', cmd_win: 'wmic logicaldisk get size,freespace,caption' },
        { label: 'Memory', cmd_linux: 'free -m', cmd_win: 'systeminfo | findstr /C:"Total Physical Memory"' },
        { label: 'List Files', cmd_linux: 'ls -la', cmd_win: 'dir' },
        { label: 'Network', cmd_linux: 'ip a', cmd_win: 'ipconfig' },
        { label: 'Processes', cmd_linux: 'ps aux --sort=-%mem | head -5', cmd_win: 'tasklist' },
    ];

    const handleQuickCommand = (cmdObj) => {
        // Simple heuristic: if VBox says "windows" or user types windows commands, default to win.
        // For now, let's just populate the input so user can verify.
        const isWin = server.os && server.os.toLowerCase().includes('windows');
        setCommand(isWin ? cmdObj.cmd_win : cmdObj.cmd_linux);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setOutput('Executing...');

        const payload = { command };
        if (server.type === 'vbox') {
            payload.username = username;
            payload.password = password;
        } else {
            if (password) payload.password = password;
        }

        onExecute(server.id, payload)
            .then(data => {
                setOutput(data.output || 'No output returned');
                setLoading(false);
            })
            .catch(err => {
                setOutput(`Error: ${err.message}`);
                setLoading(false);
            });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-[#0f172a] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-4xl border border-white/10 overflow-hidden flex flex-col h-[80vh] animate-fadeIn">

                {/* Header */}
                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                            <span className="text-blue-400 font-mono text-lg">{'>_'}</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-wide">{server.name}</h3>
                            <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">{server.type} • {server.host}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar - Quick Commands */}
                    <div className="w-64 bg-black/20 border-r border-white/5 p-4 flex flex-col space-y-2 overflow-y-auto">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block pl-2">Quick Actions</span>
                        {QUICK_COMMANDS.map((qc, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleQuickCommand(qc)}
                                className="text-left px-3 py-2.5 rounded-lg bg-white/5 hover:bg-blue-600/20 hover:text-blue-300 border border-transparent hover:border-blue-500/30 text-slate-300 text-sm font-medium transition-all group flex items-center"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-blue-400 mr-3 transition-colors"></span>
                                {qc.label}
                            </button>
                        ))}
                    </div>

                    {/* Main Terminal Area */}
                    <div className="flex-1 flex flex-col bg-[#020617] relative">
                        {/* Scanlines Effect Overlay (Subtle) */}
                        <div className="absolute inset-0 pointer-events-none bg-[url('https://transparenttextures.com/patterns/dark-matter.png')] opacity-20"></div>

                        {/* Output Window */}
                        <div className="flex-1 p-6 font-mono text-sm overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative z-10">
                            {output ? (
                                <div>
                                    <div className="text-slate-500 mb-2 text-xs border-b border-dashed border-white/10 pb-1">LAST EXECUTION RESULT</div>
                                    <pre className={`whitespace-pre-wrap ${output.includes('Error') ? 'text-red-400' : 'text-emerald-400'} drop-shadow-[0_0_5px_rgba(0,0,0,0.5)]`}>{output}</pre>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-2 select-none">
                                    <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <span className="text-sm">Ready for command input...</span>
                                </div>
                            )}

                            {output.includes('Guest Additions') && (
                                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-200 text-xs flex items-start">
                                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    <span>In VirtualBox window, go to <strong>Devices &gt; Insert Guest Additions CD image...</strong> and install it inside the VM.</span>
                                </div>
                            )}

                            {loading && (
                                <div className="mt-4 flex items-center text-blue-400">
                                    <span className="animate-spin h-4 w-4 mr-2 border-2 border-blue-500 border-t-transparent rounded-full"></span>
                                    Executing...
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white/5 border-t border-white/5 backdrop-blur-md relative z-20">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {server.type === 'vbox' && (
                                    <div className="flex space-x-4">
                                        <div className="w-1/3">
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={e => setUsername(e.target.value)}
                                                className={`w-full bg-black/40 border rounded-lg px-3 py-1.5 text-white focus:outline-none text-xs font-mono placeholder-slate-600 ${!username ? 'border-red-500/50' : 'border-white/10 focus:border-blue-500'}`}
                                                placeholder="Guest Username *"
                                            />
                                        </div>
                                        <div className="w-1/3">
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white focus:border-blue-500 focus:outline-none text-xs font-mono placeholder-slate-600"
                                                placeholder="Password"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex space-x-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-3 text-blue-500 font-mono font-bold">{'>'}</span>
                                        <input
                                            type="text"
                                            value={command}
                                            onChange={(e) => setCommand(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:outline-none transition-all shadow-inner"
                                            placeholder="Enter command..."
                                            autoFocus
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading || !command}
                                        className={`px-6 rounded-xl font-bold uppercase text-sm tracking-wider transition-all ${loading || !command ? 'bg-slate-800 text-slate-600' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'}`}
                                    >
                                        Run
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandModal;
