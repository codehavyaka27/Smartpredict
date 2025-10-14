// src/App.js
// import React, { useState } from 'react';
import React, { useState, useRef } from 'react'; // Add useRef
import ReportGenerator from './ReportGenerator';
import BusinessImpact from './BusinessImpact';
import MaintenanceTicketModal from './MaintenanceTicketModal';
import RecommendationGuide from './RecommendationGuide';
import DriftAnalysisChart from './DriftAnalysisChart';
import axios from 'axios';
import './App.css'; // We'll style this later

function App() {
  // State to hold the form input data
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const reportContentRef = useRef();
  const [features, setFeatures] = useState({
    cycle: 50,
    capacity: 1.5,
    temp_mean: 30,
    voltage_mean: 3.6,
    current_mean: -1.5,
    degradation_anomaly_score: 0.02
  });

  // State to hold the prediction result
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState('');

  // Handle changes in the input fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFeatures(prev => ({ ...prev, [name]: parseFloat(value) }));
  };

  // Handle form submission to get a prediction
  const getPrediction = async () => {
    setError('');
    setPrediction(null);
    try {
      // Make a POST request to our FastAPI backend
      const response = await axios.post('http://127.0.0.1:8000/predict/battery', features);
      setPrediction(response.data.predicted_RUL);
    } catch (err) {
      setError('Failed to get prediction. Make sure the backend server is running.');
      console.error(err);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🔋 BatteryCare Dashboard</h1>
      </header>
      <main className="container">
        <div className="prediction-card">
          <h2>Predict Battery Life</h2>
          <p>Enter the latest sensor readings to predict the Remaining Useful Life (RUL).</p>
          <DriftAnalysisChart machineType="battery" featureName="Capacity (Ah)" />
          <div className="input-grid">
            {Object.keys(features).map(key => (
              <div className="input-group" key={key}>
                <label>{key.replace(/_/g, ' ')}</label>
                <input
                  type="number"
                  name={key}
                  value={features[key]}
                  onChange={handleChange}
                />
              </div> 
            ))}
          </div>

          <button onClick={getPrediction}>Predict RUL</button>

          {prediction !== null && (
            <div className="result">
              <h3>Predicted RUL: <span>{prediction} cycles</span></h3>
            </div>
          )}
          {error && <p className="error">{error}</p>}
        </div>
        <BusinessImpact
          status={prediction < 30 ? 'At Risk' : 'Normal'} // Derive status from RUL
          costPerHourDowntime={8000} // e.g., cost of a vehicle being out of service
          hoursToRepairFailure={24}
          costOfProactiveMaintenance={150000} // e.g., cost of early battery replacement
        />
        {/* --- ADD THIS NEW COMPONENT --- */}
<RecommendationGuide 
  machineType="battery"
  status={prediction < 30 ? 'At Risk' : 'Normal'} // Derive status from RUL
/>
        {/* We will add our charts and tables here later */}
        {/* <HealthChart /> */}
        {/* <FleetTable /> */}
      </main>
    </div>
  );
}

export default App;