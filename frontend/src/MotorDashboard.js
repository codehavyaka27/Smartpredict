// src/MotorDashboard.js
import React, { useState, useRef } from 'react';
import BusinessImpact from './BusinessImpact';
import ReportGenerator from './ReportGenerator';
import RecommendationGuide from './RecommendationGuide';
import MaintenanceTicketModal from './MaintenanceTicketModal';
import DriftAnalysisModal from './DriftAnalysisModal';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css'; // Reuse the same styles

function MotorDashboard() {
    const reportContentRef = useRef();
    const [features, setFeatures] = useState({
        air_temperature_k: '',
        process_temperature_k: '',
        rotational_speed_rpm: '',
        torque_nm: '',
        tool_wear_min: '',
    });

    const [prediction, setPrediction] = useState(null);
    const [error, setError] = useState('');
    const [shapData, setShapData] = useState(null);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [isDriftModalOpen, setIsDriftModalOpen] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFeatures(prev => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
    };

    const getPrediction = async () => {
        setError('');
        setPrediction(null);
        setShapData(null);
        try {
            const response = await axios.post('http://127.0.0.1:8000/predict/motor', features);
            setPrediction(response.data);

            if (response.data.status === 'At Risk') {
                const shapResponse = await axios.post('http://127.0.0.1:8000/explain/motor', features);
                setShapData(shapResponse.data);
            }
        } catch (err) {
            setError('Failed to get prediction. Ensure the backend server is running.');
            console.error(err);
        }
    };
    
    const sensorDataForChart = [
      { name: 'Rotational Speed', value: features.rotational_speed_rpm, unit: 'rpm' },
      { name: 'Torque', value: features.torque_nm, unit: 'Nm' },
      { name: 'Tool Wear', value: features.tool_wear_min, unit: 'min' },
    ];

    return (
        <div className="px-8 py-12">
            {/* --- HEADER SECTION --- */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-5xl font-black text-slate-900">Motor MOT-007</h1>
                <div className="flex space-x-4">
                    <button onClick={() => setIsDriftModalOpen(true)} className="font-bold text-sky-600 hover:text-sky-500 transition-colors">
                        Check for Model Drift
                    </button>
                    <ReportGenerator machineId="Motor-MOT-007" reportContentRef={reportContentRef} />
                </div>
            </div>

            {/* --- WRAPPER FOR PDF CONTENT --- */}
            <div ref={reportContentRef} className="p-4 bg-white">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* --- LEFT COLUMN: CONTROL PANEL & RESULTS --- */}
                    <div className="space-y-6">
                        {/* Box 1: Control Panel */}
                        <div className="bg-white border border-slate-200 rounded-lg shadow-md p-6 h-fit">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Live Sensor Input</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.keys(features).map(key => (
                                    <div key={key}>
                                        <label className="text-sm font-medium text-slate-700 capitalize">{key.replace(/_/g, ' ')}</label>
                                        <input
                                            type="number" name={key} value={features[key]} onChange={handleChange} step="0.1"
                                            className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                            <button onClick={getPrediction} className="mt-6 w-full bg-yellow-400 text-black font-bold uppercase py-3 rounded-none text-center hover:bg-yellow-500 transition-colors">
                                Predict Health
                            </button>
                        </div>
                        
                        {/* Box 2: Prediction Result (appears after prediction) */}
                        {prediction && (
                            <div className={`p-6 rounded-lg border-l-4 ${prediction.status === 'At Risk' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
                                <h3 className="font-bold text-lg text-slate-900">Prediction Result</h3>
                                <p className="text-xl mt-2">
                                    Status: <span className={`font-extrabold ${prediction.status === 'At Risk' ? 'text-red-600' : 'text-green-600'}`}>{prediction.status}</span>
                                </p>
                                <p className="text-xl mt-1">
                                    Health Score: <strong className="text-slate-900">{prediction.health_score} / 100</strong>
                                </p>
                                {prediction.status === 'At Risk' && (
                                    <button onClick={() => setIsTicketModalOpen(true)} className="mt-4 w-full bg-red-600 text-white font-bold py-2 rounded-md hover:bg-red-500">
                                        🎫 Create Maintenance Ticket
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Box 3 & 4: Business Impact and Recommendations now appear here */}
                        {prediction && <BusinessImpact status={prediction.status} costPerHourDowntime={50000} hoursToRepairFailure={8} costOfProactiveMaintenance={75000} />}
                        {prediction && <RecommendationGuide machineType="motor" status={prediction.status} />}

                        {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
                    </div>

                    {/* --- RIGHT COLUMN: VISUALIZATIONS --- */}
                    <div className="space-y-8">
                        {/* Live Data Chart is now here */}
                        <div className="bg-white border border-slate-200 rounded-lg shadow-md p-6">
                           <h3 className="text-xl font-bold text-slate-900 mb-4">Live Operational Data</h3>
                           <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={sensorDataForChart}>
                                    <CartesianGrid stroke="#e5e7eb" />
                                    <XAxis dataKey="name" stroke="#6b7280" />
                                    <YAxis stroke="#6b7280" />
                                    <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb' }} />
                                    <Bar dataKey="value" fill="#0ea5e9" name="Sensor Reading" />
                                </BarChart>
                           </ResponsiveContainer>
                        </div>
                        
                        {/* SHAP Chart appears here when needed */}
                        {shapData && (
                            <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6">
                                <h3 className="text-xl font-semibold mb-2 text-gray-800">Why is it "At Risk"? (XAI)</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={shapData} layout="vertical" margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
                                        <CartesianGrid stroke="#e5e7eb" />
                                        <XAxis type="number" stroke="#6b7280" />
                                        <YAxis type="category" dataKey="feature" stroke="#6b7280" tick={{ fill: '#374151' }} />
                                        <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb' }} />
                                        <Bar dataKey="importance" fill="#ef4444" name="Contribution to Risk" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}
            {isDriftModalOpen && <DriftAnalysisModal machineType="motor" featureName="Torque (Nm)" onClose={() => setIsDriftModalOpen(false)} />}
            {isTicketModalOpen && <MaintenanceTicketModal machineId="Motor-MOT-007" details={`AI detected 'At Risk' status (Health Score: ${prediction?.health_score}). Suspected cause from XAI: High Torque & Tool Wear.`} onClose={() => setIsTicketModalOpen(false)} />}
        </div>
    );
}

export default MotorDashboard;