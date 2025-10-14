// src/App.js
import React from 'react';
import { motion } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import BatteryDashboard from './BatteryDashboard';
import MotorDashboard from './MotorDashboard';
import PumpDashboard from './PumpDashboard';
import KalmanFilterPage from './KalmanFilterPage';
import PreprocessingPage from './PreprocessingPage';
import MotorClusteringPage from './MotorClusteringPage';
import HydraulicDashboard from './HydraulicDashboard';
import AdminTicketView from './AdminTicketView';
import ModelOpsCenter from './ModelOpsCenter';
import ClusteringInsights from './ClusteringInsights';
import './App.css';

// Data remains the same
const fleetData = [
    { id: 'EVB-001', type: 'EV Battery', status: 'At Risk', link: '/machine/battery/EVB-001' },
    { id: 'MOT-007', type: 'Electric Motor', status: 'Normal', link: '/machine/motor/MOT-007' },
    { id: 'PMP-003', type: 'Compressor Pump', status: 'Caution', link: '/machine/pump/PMP-003' },
    { id: 'UPS-SRV-2', type: 'Server UPS', status: 'Optimal Efficiency', link: '/machine/battery/UPS-SRV-2' },
    { id: 'CNV-BELT-A', type: 'Conveyor', status: 'Normal', link: '/machine/motor/CNV-BELT-A' },
    { id: 'HTS-004', type: 'Hydraulic System', status: 'Optimal Efficiency', link: '/machine/hydraulic/HTS-004' },
];

// --- Status Indicator with colors optimized for a white background ---
const StatusIndicator = ({ status }) => {
    const statusConfig = {
        'At Risk': { color: 'text-red-600', animation: 'animate-pulse' },
        'Caution': { color: 'text-amber-500', animation: '' },
        'Normal': { color: 'text-green-600', animation: '' },
        'Optimal Efficiency': { color: 'text-sky-500', animation: '' }
    };

    const config = statusConfig[status] || { color: 'text-gray-600', animation: '' };

    return (
        <span className={`font-bold text-lg inline-flex items-center ${config.color}`}>
            <span className={`mr-2 text-2xl ${config.animation}`}>●</span>
            {status}
        </span>
    );
};

// The main fleet overview component, now with a white theme
const FleetOverview = () => (
    <div className="container mx-auto p-8 max-w-7xl">
        {/* Text changed to be dark and readable */}
        <h1 className="text-4xl font-bold text-gray-800 mb-2">SmartPredict AI Fleet Command</h1>
        <p className="text-lg text-gray-600 mb-8">Unified monitoring for diverse industrial assets.</p>

        {/* Table changed to a white theme */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
            <table className="w-full text-left">
                {/* Header changed to a light gray */}
                <thead className="bg-gray-50">
                    <tr>
                        <th className="p-4 font-semibold text-gray-700">Asset ID</th>
                        <th className="p-4 font-semibold text-gray-700">Machine Type</th>
                        <th className="p-4 font-semibold text-gray-700">Live Status</th>
                        <th className="p-4 font-semibold text-gray-700">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {fleetData.map((machine, index) => (
                        <motion.tr
                            key={machine.id}
                            // Row borders and hover effect changed to light gray
                            className="border-t border-gray-200 hover:bg-gray-100 transition-colors"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <td className="p-4 font-mono text-gray-900">{machine.id}</td>
                            <td className="p-4 text-gray-600">{machine.type}</td>
                            <td className="p-4"><StatusIndicator status={machine.status} /></td>
                            <td className="p-4">
                                <Link to={machine.link} className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-md hover:bg-indigo-500 transition-colors">
                                    Deep Dive &raquo;
                                </Link>
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

function App() {
    return (
        <Router>
            <div className="App">
                <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
                    <div className="container mx-auto flex justify-between items-center">
                        <Link to="/" className="text-2xl font-bold text-gray-800">SmartPredict AI</Link>
                        <div className="space-x-6">
                            {/* --- RENAME and REORGANIZE LINKS --- */}
                            <div className="group inline-block relative">
                                <button className="font-semibold text-teal-600 hover:text-teal-500 py-2 px-4 rounded inline-flex items-center">
                                    <span>Clustering Insights ▼</span>
                                </button>
                                <ul className="absolute hidden text-gray-700 pt-1 group-hover:block w-48 bg-white border rounded shadow-lg">
                                    <li><Link to="/clustering-insights/battery" className="block px-4 py-2 hover:bg-gray-100">Batteries</Link></li>
                                    <li><Link to="/clustering-insights/motor" className="block px-4 py-2 hover:bg-gray-100">Motors</Link></li>
                                </ul>
                            </div>
                            {/* <Link to="/preprocessing" className="font-semibold text-gray-600 hover:text-gray-900">
                                Preprocessing
                            </Link> */}
                            <Link to="/kalman-filter" className="font-semibold text-gray-600 hover:text-gray-900">
                               Noise Filter
                            </Link>
                            <Link to="/model-ops" className="font-semibold text-blue-600 hover:text-blue-500">Model Ops</Link>
                            <Link to="/admin/tickets" className="font-semibold text-indigo-600 hover:text-indigo-500">Ticket Admin</Link>
                        </div>
                    </div>
                </header>
                <main>
                    <Routes>
                        <Route path="/" element={<FleetOverview />} />
                        <Route path="/machine/battery/:id" element={<BatteryDashboard />} />
                        <Route path="/machine/motor/:id" element={<MotorDashboard />} />
                        <Route path="/machine/pump/:id" element={<PumpDashboard />} />
                        <Route path="/machine/hydraulic/:id" element={<HydraulicDashboard />} />
                        <Route path="/admin/tickets" element={<AdminTicketView />} />
                        <Route path="/model-ops" element={<ModelOpsCenter />} />
                        <Route path="/clustering-insights/battery" element={<ClusteringInsights />} />
                        <Route path="/clustering-insights/motor" element={<MotorClusteringPage />} />
                        <Route path="/kalman-filter" element={<KalmanFilterPage />} />
                        {/* <Route path="/preprocessing" element={<PreprocessingPage />} /> */}
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;