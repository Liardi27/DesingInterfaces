// client/src/pages/ServerDetail.jsx
import React, { useEffect, useState, useRef } from 'react';

const API_URL = 'http://localhost:3001/api';

const ServerDetail = ({ serverId, onBack }) => {
    const [server, setServer] = useState(null); // Assuming passed by context usually, but here fetching or just IDs
    // For demo purposes, we don't have the server name unless we fetch it again or pass it.
    // Let's assume we proceed.

    const [terminalOutput, setTerminalOutput] = useState([]);
    const [commandHelper, setCommandHelper] = useState('');
    const [loading, setLoading] = useState(false);

    // Quick actions for demo
    const QUICK_ACTIONS = [
        { label: 'Network Info', cmd: 'ip a', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { label: 'Start Nginx', cmd: 'sudo systemctl start nginx', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' },
        { label: 'Stop Nginx', cmd: 'sudo systemctl stop nginx', icon: 'M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z' },
        { label: 'Service Status', cmd: 'systemctl status nginx', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
        { label: 'System Load', cmd: 'uptime', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    ];

    const executeCommand = async (cmd) => {
        setLoading(true);
        // Optimistic update
        setTerminalOutput(prev => [...prev, { type: 'input', text: `$ ${cmd}` }]);

        try {
            const res = await fetch(`${API_URL}/server/${serverId}/exec`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    command: cmd,
                    password: 'demo' // Hardcoded for demo simplicity
                })
            });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            setTerminalOutput(prev => [...prev, { type: 'output', text: data.output || '(No output)' }]);
        } catch (err) {
            setTerminalOutput(prev => [...prev, { type: 'error', text: err.message }]);
        } finally {
            setLoading(false);
        }
    };

    // Auto-scroll terminal
    const terminalRef = useRef(null);
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [terminalOutput]);

    if (!serverId) return <div>Invalid Server ID</div>;

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
                <div className="flex items-center">
                    <button onClick={onBack} className="mr-6 p-3 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-blue-600 transition-all shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Console Access</h2>
                        <p className="text-slate-400 font-mono text-sm mt-1">ID: {serverId}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]">SSH SECURE</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Control Panel */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Instant Actions
                        </h3>
                        <div className="space-y-3">
                            {QUICK_ACTIONS.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => executeCommand(action.cmd)}
                                    disabled={loading}
                                    className="w-full px-4 py-3 bg-white/5 hover:bg-blue-600/20 rounded-xl text-sm text-slate-200 transition-all border border-transparent hover:border-blue-500/30 flex justify-between items-center group relative overflow-hidden"
                                >
                                    <div className="flex items-center z-10">
                                        <svg className="w-4 h-4 mr-3 text-slate-500 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} /></svg>
                                        <span className="font-medium">{action.label}</span>
                                    </div>
                                    <svg className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-transform group-hover:translate-x-1 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
                        <h3 className="text-lg font-bold text-white mb-4">Command Injection</h3>
                        <form onSubmit={(e) => { e.preventDefault(); executeCommand(commandHelper); setCommandHelper(''); }}>
                            <div className="relative">
                                <span className="absolute left-4 top-3 text-blue-500 font-mono">$</span>
                                <input
                                    type="text"
                                    value={commandHelper}
                                    onChange={(e) => setCommandHelper(e.target.value)}
                                    placeholder="sudo apt update..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-mono text-sm mb-3 transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !commandHelper}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Execute Command
                            </button>
                        </form>
                    </div>
                </div>

                {/* Terminal Window */}
                <div className="lg:col-span-2 flex flex-col h-[650px] bg-[#0c0c0c] rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden font-mono text-sm relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="px-2 py-1 bg-white/10 rounded text-xs text-slate-400 cursor-default">bash</span>
                    </div>
                    <div className="bg-[#1a1a1a] px-4 py-3 border-b border-white/5 flex items-center space-x-2">
                        <div className="flex space-x-2">
                            <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                        </div>
                        <span className="ml-4 text-xs text-slate-500 font-medium">root@remote-server:~</span>
                    </div>
                    <div ref={terminalRef} className="flex-1 p-6 overflow-y-auto space-y-2 text-slate-300 font-mono scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        <div className="text-slate-500 mb-4">
                            Welcome to Ubuntu 24.04 LTS (GNU/Linux 5.4.0-104-generic x86_64)<br />
                            * Documentation:  https://help.ubuntu.com<br />
                            * Management:     https://landscape.canonical.com<br />
                            * Support:        https://ubuntu.com/advantage
                        </div>
                        {terminalOutput.map((line, i) => (
                            <div key={i} className={`${line.type === 'input' ? 'text-blue-400 mt-6 font-bold flex' : line.type === 'error' ? 'text-red-400 bg-red-900/20 p-2 rounded border-l-2 border-red-500' : 'text-slate-300 whitespace-pre-wrap leading-relaxed'}`}>
                                {line.type === 'input' && <span className="mr-2 opacity-50">➜</span>}
                                {line.text}
                            </div>
                        ))}
                        {loading && (
                            <div className="flex items-center space-x-1 mt-2">
                                <span className="w-2 h-4 bg-blue-500 animate-pulse"></span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServerDetail;
