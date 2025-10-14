// src/MotorDashboard.js
// import React, { useState } from 'react';
import React, { useState, useRef } from 'react'; // Add useRef
import ReportGenerator from './ReportGenerator';
import axios from 'axios';
import BusinessImpact from './BusinessImpact';
import DriftAnalysisChart from './DriftAnalysisChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css'; // Reuse the same styles

function PumpDashboard() {
  // State for the motor's specific input features
 const [features, setFeatures] = useState({
    air_temperature_k: 300.2,
    process_temperature_k: 310.8,
    // RE-LABEL the features for a pump
    rotational_speed_rpm: 1200, // We'll call this "Flow Rate" in the UI label
    torque_nm: 60.5,           // We'll call this "Pressure" in the UI label
    tool_wear_min: 25,         // We'll call this "Vibration" in the UI label
  });
  const reportContentRef = useRef();
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
      // IMPORTANT: We still call the /predict/motor endpoint!
      const response = await axios.post('http://127.0.0.1:8000/predict/motor', features);
      setPrediction(response.data);
    } catch (err) {
      setError('Failed to get prediction. Ensure the backend server is running.');
      console.error(err);
    }
  };
  
  // Format data for the bar chart
//   const sensorDataForChart = [
//     { name: 'Rotational Speed', value: features.rotational_speed_rpm, unit: 'rpm' },
//     { name: 'Torque', value: features.torque_nm, unit: 'Nm' },
//     { name: 'Tool Wear', value: features.tool_wear_min, unit: 'min' },
//   ];

  return (
    <div className="container">
      <div className="prediction-card">
        <h2>Pump PMP-003 - Health Analysis</h2> {/* <--- Change title */}
        <p>Enter sensor readings to predict the pump's health status.</p>
<DriftAnalysisChart machineType="pump" featureName="Pressure (PSI)" />


        <div className="input-grid">
          {/* Manually create inputs for clearer labels */}
          <div className="input-group">
            <label>Air Temperature (K)</label>
            <input type="number" name="air_temperature_k" value={features.air_temperature_k} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Process Temperature (K)</label>
            <input type="number" name="process_temperature_k" value={features.process_temperature_k} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Flow Rate (L/min)</label> {/* <--- Change label */}
            <input type="number" name="rotational_speed_rpm" value={features.rotational_speed_rpm} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Pressure (PSI)</label> {/* <--- Change label */}
            <input type="number" name="torque_nm" value={features.torque_nm} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Vibration (mm/s)</label> {/* <--- Change label */}
            <input type="number" name="tool_wear_min" value={features.tool_wear_min} onChange={handleChange} />
          </div>
        </div>

      
        <button onClick={getPrediction}>Predict Health</button>

        {/* The prediction display logic remains exactly the same */}
        {prediction && (
          <>
            <div className="result" style={{ borderColor: prediction.status === 'At Risk' ? '#dc3545' : '#28a745' }}>
              <h3>Prediction Result</h3>
              <p style={{ fontSize: '1.2rem' }}>Status: <span style={{ color: prediction.status === 'At Risk' ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>{prediction.status}</span></p>
              <p style={{ fontSize: '1.2rem' }}>Health Score: <strong>{prediction.health_score} / 100</strong></p>
            </div>
            {/* Business Impact component for pump */}
            <BusinessImpact 
              status={prediction.status} 
              costPerHourDowntime={30000} // Different cost for a pump
              hoursToRepairFailure={6}
              costOfProactiveMaintenance={40000}
            />
          </>
        )}
        {error && <p className="error">{error}</p>}

      </div>
    </div>
  );
}

export default PumpDashboard;