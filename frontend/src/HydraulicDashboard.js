// src/HydraulicDashboard.js
// import React, { useState } from 'react';
import React, { useState, useRef } from 'react'; // Add useRef
import BusinessImpact from './BusinessImpact';
import ReportGenerator from './ReportGenerator';
import axios from 'axios';
import DriftAnalysisChart from './DriftAnalysisChart';
import './App.css'; // Reuse the same styles

function HydraulicDashboard() {
  // --- CHANGE 1: Updated state with all 16 hydraulic sensor features ---
    const reportContentRef = useRef();
  const [features, setFeatures] = useState({
    PS1: 160.67,
    PS2: 109.43,
    PS3: 1.99,
    PS4: 0.00,
    PS5: 9.84,
    PS6: 9.73,
    EPS1: 2538.90,
    FS1: 6.71,
    TS1: 35.62,
    TS2: 40.96,
    TS3: 38.45,
    TS4: 31.58,
    VS1: 0.58,
    CE: 39.60,
    CP: 1.86,
    SE: 59.15,
  });

  // State for the prediction result
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState('');

  // Handle changes in the input fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFeatures(prev => ({ ...prev, [name]: parseFloat(value) }));
  };

  // Call the backend to get a prediction
  const getPrediction = async () => {
    setError('');
    setPrediction(null);
    try {
      // The API endpoint is correctly set to /predict/hydraulic
      const response = await axios.post('http://127.0.0.1:8000/predict/hydraulic', features);
      setPrediction(response.data);
    } catch (err) {
      setError('Failed to get prediction. Ensure the backend server is running.');
      console.error(err);
    }
  };

  return (
    <div className="container">
      <div className="prediction-card">
        <h2>Hydraulic System HTS-004 - Health Analysis</h2>
        <p>Enter the 16 real-time sensor readings to predict the system's operational status.</p>
<DriftAnalysisChart machineType="pump" featureName="Pressure (PSI)" />


        {/* --- CHANGE 2: Dynamically generated grid for all 16 inputs --- */}
        {/* This is much cleaner than writing each input manually */}
        <div className="input-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {Object.keys(features).map(key => (
            <div className="input-group" key={key}>
              <label>{key}</label>
              <input
                type="number"
                name={key}
                value={features[key]}
                onChange={handleChange}
                step="0.01" // Use a smaller step for precision sensors
              />
            </div>
          ))}
        </div>

        <button onClick={getPrediction}>Predict Health</button>


        {prediction && (
          <>
            <div className="result" style={{
              borderColor: prediction.health_score < 80 ? '#dc3545' : '#28a745',
              borderLeftWidth: '5px'
            }}>
              <h3>Prediction Result</h3>
              <p style={{ fontSize: '1.2rem' }}>
                System Status: <span style={{
                  color: prediction.health_score < 80 ? '#dc3545' : '#28a745',
                  fontWeight: 'bold'
                }}>{prediction.status}</span>
              </p>
              <p style={{ fontSize: '1.2rem' }}>
                Health Score: <strong>{prediction.health_score} / 100</strong>
              </p>
            </div>
            {/* Business Impact for Hydraulic System */}
            <BusinessImpact 
              status={prediction.status === 'Close to Total Failure' ? 'At Risk' : 'Normal'} // Map the status
              costPerHourDowntime={100000} // Higher cost for a complex system
              hoursToRepairFailure={12}
              costOfProactiveMaintenance={200000}
            />
          </>
        )}
        {error && <p className="error">{error}</p>}

      </div>
    </div>
  );
}

export default HydraulicDashboard;