// src/MotorDashboard.js
import React, { useState, useRef } from 'react';
import BusinessImpact from './BusinessImpact';
import ReportGenerator from './ReportGenerator';
import RecommendationGuide from './RecommendationGuide';
import DriftAnalysisChart from './DriftAnalysisChart';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css'; // Reuse the same styles

function MotorDashboard() {
    const reportContentRef = useRef(); // Ref for the PDF content area
    const [features, setFeatures] = useState({
        air_temperature_k: 298.1,
        process_temperature_k: 308.6,
        rotational_speed_rpm: 1551,
        torque_nm: 42.8,
        tool_wear_min: 0,
    });

    const [prediction, setPrediction] = useState(null);
    const [error, setError] = useState('');
    const [shapData, setShapData] = useState(null);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false); // For ticket modal

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFeatures(prev => ({ ...prev, [name]: parseFloat(value) }));
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

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
            {/* --- HEADER SECTION: Title and Download Button --- */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Motor MOT-007 - Health Analysis</h2>
                <ReportGenerator machineId="Motor-MOT-007" reportContentRef={reportContentRef} />
            </div>

            {/* --- WRAPPER FOR PDF CONTENT --- */}
            <div ref={reportContentRef} className="p-4 bg-white">
                {/* Main two-column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* --- LEFT COLUMN: Prediction & Inputs --- */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6 h-fit">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Live Sensor Input</h3>
                        <p className="text-gray-600 mb-6">Enter the latest sensor readings to predict the motor's health status.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.keys(features).map(key => (
                                <div key={key}>
                                    <label className="text-sm font-medium text-gray-700 capitalize">{key.replace(/_/g, ' ')}</label>
                                    <input
                                        type="number" name={key} value={features[key]} onChange={handleChange} step="0.1"
                                        className="w-full mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                            ))}
                        </div>

                        <button onClick={getPrediction} className="mt-6 w-full bg-indigo-600 text-white font-bold py-3 rounded-md hover:bg-indigo-500 transition-colors">
                            Predict Health
                        </button>

                        {prediction && (
                            <div className={`mt-6 p-4 rounded-lg border-l-4 ${prediction.status === 'At Risk' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
                                <h3 className="font-bold text-lg text-gray-900">Prediction Result</h3>
                                <p className="text-xl mt-2">
                                    Status: <span className={`font-extrabold ${prediction.status === 'At Risk' ? 'text-red-600' : 'text-green-600'}`}>{prediction.status}</span>
                                </p>
                                <p className="text-xl mt-1">
                                    Health Score: <strong className="text-gray-900">{prediction.health_score} / 100</strong>
                                </p>

                                {/* --- THIS IS THE CRUCIAL PART --- */}
                                {prediction.status === 'At Risk' && (
                                  <button
                                    onClick={() => setIsTicketModalOpen(true)}
                                    className="mt-4 w-full bg-red-600 text-white font-bold py-2 rounded-md hover:bg-red-500 transition-all"
                                  >
                                    🎫 Create Maintenance Ticket
                                  </button>
                                )}
                            </div>
                        )}

                        {/* --- Business Impact Card --- */}
                        {prediction && (
                            <BusinessImpact
                                status={prediction.status}
                                costPerHourDowntime={50000}
                                hoursToRepairFailure={8}
                                costOfProactiveMaintenance={75000}
                            />
                        )}
 {/* --- ADD THIS NEW COMPONENT --- */}
                        {prediction && (
                            <RecommendationGuide
                                machineType="motor"
                                status={prediction.status}
                            />
                        )}
                        {error && <p className="text-red-600 mt-4">{error}</p>}
                    </div>

                    {/* --- RIGHT COLUMN: Visualizations --- */}
                    <div className="space-y-8">
                        <DriftAnalysisChart machineType="motor" featureName="Torque (Nm)" />
                        {shapData && (
                            <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6">
                                <h3 className="text-xl font-semibold mb-2 text-gray-800">Why is it "At Risk"?</h3>
                                <p className="text-gray-600 mb-4">Explainable AI shows key factors driving the failure prediction.</p>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={shapData} layout="vertical" margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
                                        <CartesianGrid stroke="#e5e7eb" />
                                        <XAxis type="number" stroke="#6b7280" />
                                        <YAxis type="category" dataKey="feature" stroke="#6b7280" tick={{ fill: '#374151' }} />
                                        <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb' }} />
                                        <Legend />
                                        <Bar dataKey="importance" fill="#ef4444" name="Contribution to Failure Risk" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MotorDashboard;