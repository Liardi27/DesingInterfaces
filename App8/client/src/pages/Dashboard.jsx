// client/src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import ServerCard from '../components/ServerCard';
import AddServerModal from '../components/AddServerModal';

// API BASE URL
const API_URL = 'http://localhost:3001/api';

const Dashboard = ({ onSelectServer }) => {
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadServers = () => {
        fetch(`${API_URL}/servers`)
            .then(res => res.json())
            .then(data => {
                setServers(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load servers", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        loadServers();
    }, []);

    const handleAddServer = (serverData) => {
        fetch(`${API_URL}/servers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(serverData)
        })
            .then(res => res.json())
            .then(newServer => {
                setServers([...servers, newServer]);
                setIsModalOpen(false);
            })
            .catch(console.error);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400 font-mono text-sm animate-pulse">Scanning infrastructure nodes...</p>
            </div>
        </div>
    );

    return (
        <div>
            <div className="mb-10 flex justify-between items-end backdrop-blur-sm">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2 leading-tight">Network Overview</h2>
                    <p className="text-slate-400 font-light">Monitor and manage your virtualization clusters.</p>
                </div>
                <div className="flex space-x-4">
                    <button
                        onClick={() => {
                            setLoading(true);
                            fetch(`${API_URL}/vbox/scan`, { method: 'POST' })
                                .then(res => res.json())
                                .then(data => {
                                    alert(`Scan Complete. Found ${data.added} new VMs.`);
                                    loadServers();
                                })
                                .catch(err => {
                                    console.error(err);
                                    setLoading(false);
                                });
                        }}
                        className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all shadow-lg flex items-center space-x-2 font-medium"
                    >
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Scan VMs</span>
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="group px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 flex items-center space-x-2 font-medium overflow-hidden relative"
                    >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        <span>Deploy Node</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {servers.map(server => (
                    <ServerCard
                        key={server.id}
                        server={server}
                        onClick={onSelectServer}
                        onRefresh={loadServers}
                    />
                ))}

                {/* Empty State / Add Button */}
                <div
                    onClick={() => setIsModalOpen(true)}
                    className="group border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-500 hover:text-blue-400 hover:border-blue-500/30 transition-all duration-300 cursor-pointer h-full min-h-[240px]"
                >
                    <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:bg-blue-500/10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <span className="font-semibold text-lg">Connect New Server</span>
                    <span className="text-xs text-slate-600 mt-2 font-mono group-hover:text-blue-500/60">SSH Protocol Ready</span>
                </div>
            </div>

            <AddServerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleAddServer}
            />
        </div >
    );
};

export default Dashboard;
