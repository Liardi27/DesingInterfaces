// client/src/components/AddServerModal.jsx
import React, { useState, useEffect } from 'react';

const AddServerModal = ({ isOpen, onClose, onSave }) => {
    const [mode, setMode] = useState('scan'); // 'scan' or 'manual'
    const [scannedVMs, setScannedVMs] = useState([]);
    const [networkAdapters, setNetworkAdapters] = useState([]);
    const [scanning, setScanning] = useState(false);

    // Manual Form State
    const [formData, setFormData] = useState({
        name: '',
        host: '',
        username: '',
        password: '',
        type: 'linux'
    });

    // Auto Config State
    const [selectedVMId, setSelectedVMId] = useState(null);
    const [selectedNetAdapter, setSelectedNetAdapter] = useState('');
    const [configStatus, setConfigStatus] = useState(null); // 'configuring', 'success', 'error'

    useEffect(() => {
        if (isOpen && mode === 'scan') {
            scanSystem();
        }
    }, [isOpen, mode]);

    const scanSystem = () => {
        setScanning(true);
        // Fetch VMs
        fetch('http://localhost:3001/api/vbox/list')
            .then(res => res.json())
            .then(data => setScannedVMs(data))
            .catch(console.error);

        // Fetch Net Adapters
        fetch('http://localhost:3001/api/vbox/interfaces')
            .then(res => res.json())
            .then(data => {
                setNetworkAdapters(data);
                if (data.length > 0) setSelectedNetAdapter(data[0]); // Default to first
            })
            .catch(console.error)
            .finally(() => setScanning(false));
    };

    const handleAutoConfigure = async () => {
        if (!selectedVMId) return;

        setConfigStatus('configuring');
        try {
            const res = await fetch('http://localhost:3001/api/vbox/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedVMId,
                    adapter: selectedNetAdapter
                })
            });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            setConfigStatus('success');
            // Populate manual form partially to let user fill credentials
            const vm = scannedVMs.find(v => v.id === selectedVMId);
            setFormData(prev => ({ ...prev, name: vm.name }));

            // Switch to manual to finish adding (need user/pass)
            alert("VM Network Configured!\nNow just enter the User/Password to finish.");
            setMode('manual');

        } catch (err) {
            console.error(err);
            alert(`Error: ${err.message}`);
            setConfigStatus('error');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        setFormData({ name: '', host: '', username: '', password: '', type: 'linux' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800/90 rounded-2xl border border-white/10 w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in-up transform transition-all">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-white">Deploy Node</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-lg hover:bg-white/10">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5">
                    <button
                        onClick={() => setMode('scan')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'scan' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        🔍 Scan Local System
                    </button>
                    <button
                        onClick={() => setMode('manual')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'manual' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        ✍️ Manual Entry
                    </button>
                </div>

                {mode === 'scan' ? (
                    <div className="p-6">
                        <div className="text-sm text-slate-400 mb-4">
                            Select a local VirtualBox VM to configure automatically. We'll set it to <strong>Bridged Mode</strong> for you.
                        </div>

                        {scanning ? (
                            <div className="flex justify-center items-center py-10">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                                    {scannedVMs.map(vm => (
                                        <div
                                            key={vm.id}
                                            onClick={() => setSelectedVMId(vm.id)}
                                            className={`p-3 rounded-xl border cursor-pointer flex justify-between items-center transition-all ${selectedVMId === vm.id ? 'bg-blue-600/20 border-blue-500/50' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                                        >
                                            <div>
                                                <div className="font-bold text-white">{vm.name}</div>
                                                <div className="text-xs text-slate-500 font-mono">{vm.state}</div>
                                            </div>
                                            <div className="text-xs text-slate-400 font-mono bg-black/40 px-2 py-1 rounded">{vm.nic1 === 'bridged' ? '✅ Ready' : '⚠️ NAT'}</div>
                                        </div>
                                    ))}
                                    {scannedVMs.length === 0 && <div className="text-center text-slate-500 py-4">No VMs found. Is VirtualBox installed?</div>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Bridge To (Internet Adapter)</label>
                                    <select
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
                                        value={selectedNetAdapter}
                                        onChange={(e) => setSelectedNetAdapter(e.target.value)}
                                    >
                                        {networkAdapters.map(net => (
                                            <option key={net} value={net}>{net}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    onClick={handleAutoConfigure}
                                    disabled={!selectedVMId || configStatus === 'configuring'}
                                    className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {configStatus === 'configuring' ? 'Configuring...' : '✨ Auto-Configure Network'}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Same Manual Form as before */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Friendly Name</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-slate-600"
                                placeholder="e.g., Production DB"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Host Address</label>
                            <div className="relative">
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono text-sm placeholder-slate-600"
                                    placeholder="192.168.1.x"
                                    value={formData.host}
                                    onChange={e => setFormData({ ...formData, host: e.target.value })}
                                />
                                <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 ml-1 leading-tight">
                                Run <code>ip a</code> in your VM to find this IP.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Username</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    placeholder="root"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Password</label>
                                <input
                                    type="password"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    placeholder="••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end space-x-3 border-t border-white/5 mt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-500/25 border border-transparent hover:border-blue-400/50 transition-all"
                            >
                                Connect Server
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AddServerModal;
