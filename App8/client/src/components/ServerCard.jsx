// client/src/components/ServerCard.jsx
import React from 'react';
import CommandModal from './CommandModal';

// Status indicators: green for active/online, red for offline
const StatusBadge = ({ isOnline }) => (
    <span className={`flex-shrink-0 whitespace-nowrap inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shadow-[0_0_15px_rgba(0,0,0,0.3)] backdrop-blur-md ${isOnline === true ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
        isOnline === false ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
            'bg-slate-500/20 text-slate-300 border-slate-500/30'
        }`}>
        <span className={`w-2 h-2 mr-2 rounded-full shadow-[0_0_10px_currentColor] ${isOnline === true ? 'bg-emerald-400 animate-pulse' : isOnline === false ? 'bg-rose-500' : 'bg-slate-400'}`}></span>
        {isOnline === true ? 'ONLINE' : isOnline === false ? 'OFFLINE' : 'UNKNOWN'}
    </span>
);

const ActionButton = ({ icon, label, onClick, colorClass, hoverClass }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`relative group p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 ${hoverClass} overflow-hidden`}
        title={label}
    >
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${colorClass}`}></div>
        <div className={`absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine`} />
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
        </svg>
    </button>
);

const ProgressBar = ({ label, value, color }) => (
    <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400 font-bold tracking-wider">{label}</span>
            <span className="text-slate-300 font-mono">{value}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
            <div
                className={`h-full rounded-full ${color} shadow-[0_0_10px_currentColor]`}
                style={{ width: `${value}%` }}
            ></div>
        </div>
    </div>
);

const ServerCard = ({ server, onClick, onRefresh }) => {
    const [isOnline, setIsOnline] = React.useState(null);
    const [stats, setStats] = React.useState({ cpu: 0, ram: 0 });
    const [showTerminal, setShowTerminal] = React.useState(false);

    React.useEffect(() => {
        // Poll status
        const checkStatus = () => {
            fetch(`http://localhost:3001/api/server/${server.id}/status`)
                .then(res => res.json())
                .then(data => setIsOnline(data.online))
                .catch(() => setIsOnline(false));
        };

        // Simulate stats for demo "Premium" feel (since backend stats mock is basic)
        // In real app, fetch /api/server/:id/stats
        const updateStats = () => {
            if (isOnline) {
                fetch(`http://localhost:3001/api/server/${server.id}/stats`)
                    .then(res => res.json())
                    .then(data => setStats(data))
                    .catch(console.error);
            } else {
                setStats({ cpu: 0, ram: 0 });
            }
        };

        checkStatus();
        const interval = setInterval(() => {
            checkStatus();
            updateStats();
        }, 5000);

        return () => clearInterval(interval);
    }, [server.id, isOnline]);

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (!window.confirm(`Are you sure you want to remove ${server.name}?`)) return;

        try {
            await fetch(`http://localhost:3001/api/servers/${server.id}`, { method: 'DELETE' });
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error(error);
            alert("Failed to delete server");
        }
    };

    const handleAction = (action) => {
        const cmd = action === 'reboot' ? 'sudo reboot' : 'sudo shutdown now';
        const confirmMsg = action === 'reboot' ? 'Reboot this server?' : 'Shutdown this server?';

        if (!window.confirm(confirmMsg)) return;

        fetch(`http://localhost:3001/api/server/${server.id}/exec`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: cmd })
        }).catch(console.error);
    };

    const handleExecuteCommand = async (id, payload) => {
        const res = await fetch(`http://localhost:3001/api/server/${id}/exec`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await res.json();
    };

    return (
        <>
            <div
                onClick={() => setShowTerminal(true)}
                className="group relative bg-[#1e293b]/50 backdrop-blur-xl rounded-2xl p-6 border border-white/5 hover:border-blue-500/40 transition-all duration-300 cursor-pointer hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:-translate-y-1 overflow-hidden"
            >
                {/* Dynamic Glow */}
                <div className={`absolute -top-20 -right-20 w-60 h-60 rounded-full blur-[80px] opacity-20 transition-colors duration-500 ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

                {/* Header Section: Improved Flex to prevent badge clipping */}
                <div className="flex justify-between items-start mb-8 relative z-10 w-full">
                    <div className="flex items-center space-x-5 flex-1 min-w-0 pr-4">
                        <div className="w-16 h-16 flex-shrink-0 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                            {/* Server Icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 transition-colors ${isOnline ? 'text-emerald-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-2xl font-bold text-white tracking-tight group-hover:text-blue-300 transition-colors truncate">{server.name}</h3>
                            <div className="flex items-center space-x-2 text-slate-400 text-sm font-mono mt-1">
                                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                <span className="truncate">{server.host}</span>
                            </div>
                        </div>
                    </div>

                    {/* Status Badge & Delete */}
                    <div className="flex flex-col items-end space-y-2 flex-shrink-0 ml-2">
                        {isOnline === null ? (
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <StatusBadge isOnline={isOnline} />
                        )}
                        <button
                            onClick={handleDelete}
                            className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Remove Server"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Stats Bars - Larger */}
                <div className="grid grid-cols-2 gap-6 mb-8 relative z-10 p-5 bg-black/20 rounded-2xl border border-white/5">
                    <ProgressBar label="CPU Usage" value={stats.cpu} color="bg-blue-500" />
                    <ProgressBar label="Memory" value={stats.ram} color="bg-purple-500" />
                </div>

                {/* Footer Controls: Cleaned up */}
                <div className="flex justify-between items-center pt-2 relative z-10">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-500/50 rounded-full mr-2"></span>
                        Management
                    </span>
                    <div className="flex space-x-3">
                        {/* REBOOT */}
                        <ActionButton
                            icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            label="Reboot System"
                            onClick={() => handleAction('reboot')}
                            colorClass="bg-yellow-500"
                            hoverClass="hover:border-yellow-500/50 hover:text-yellow-400"
                        />

                        {/* POWER CONTROLS */}
                        {(!isOnline || server.type === 'vbox') && (
                            <ActionButton
                                icon="M13 10V3L4 14h7v7l9-11h-7z"
                                label={server.type === 'vbox' ? "Start Machine" : "Wake On LAN"}
                                onClick={() => {
                                    if (server.type === 'vbox') {
                                        fetch(`http://localhost:3001/api/vbox/setup`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ id: server.vboxId || server.vboxId })
                                        });
                                    } else {
                                        alert("Wake-on-LAN not configured");
                                    }
                                }}
                                colorClass="bg-emerald-500"
                                hoverClass="hover:border-emerald-500/50 hover:text-emerald-400"
                            />
                        )}

                        <ActionButton
                            icon="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                            label="Power Off"
                            onClick={() => handleAction('shutdown')}
                            colorClass="bg-red-500"
                            hoverClass="hover:border-red-500/50 hover:text-red-400"
                        />
                    </div>
                </div>
            </div>

            <CommandModal
                isOpen={showTerminal}
                onClose={() => setShowTerminal(false)}
                server={server}
                onExecute={handleExecuteCommand}
            />
        </>
    );
};

export default ServerCard;
