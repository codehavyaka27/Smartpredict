// src/BusinessImpact.js
import React from 'react';

// The component now accepts props for machine-specific costs
const BusinessImpact = ({ status, costPerHourDowntime, hoursToRepairFailure, costOfProactiveMaintenance }) => {

  // Calculate financial metrics based on the props passed in
  const totalCostOfFailure = costPerHourDowntime * hoursToRepairFailure;
  const predictedSavings = totalCostOfFailure - costOfProactiveMaintenance;

  // Only render the component if the status is 'At Risk'
  if (status !== 'At Risk') {
    return null;
  }

  // The JSX remains the same, but the values it displays are now dynamic
  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg shadow-md p-6 mt-8">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Business Impact Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
        <div className="bg-red-100 p-4 rounded-lg">
          <p className="text-sm text-red-700 font-bold">Estimated Cost of Failure</p>
          <p className="text-3xl font-bold text-red-900">₹{totalCostOfFailure.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <p className="text-sm text-green-700 font-bold">Predicted Savings</p>
          <p className="text-3xl font-bold text-green-900">₹{predictedSavings.toLocaleString('en-IN')}</p>
        </div>
      </div>
    </div>
  );
};

export default BusinessImpact;