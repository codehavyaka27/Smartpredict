// src/RecommendationGuide.js
import React from 'react';

// This object holds all our specific recommendation steps.
const recommendationSteps = {
  battery: {
    'At Risk': [
      '1. **Immediate Action:** Schedule a diagnostic test for the battery pack.',
      '2. **Inspect:** Check for physical signs of swelling, leaking, or corrosion.',
      '3. **Analyze Usage:** Review recent usage patterns for high-drain activities that could accelerate degradation.',
      '4. **Plan Replacement:** Based on the predicted RUL, schedule a replacement to avoid unplanned downtime.'
    ]
  },
  motor: {
    'At Risk': [
      '1. **Safety First:** Isolate the machine from power before any inspection.',
      '2. **Investigate Cause (XAI):** Review the "Why is it at risk?" chart. High Torque suggests overload; high Tool Wear suggests the tool needs replacement.',
      '3. **Inspect:** Perform a vibration analysis and check for unusual noises or overheating.',
      '4. **Schedule Maintenance:** Based on the XAI insights, schedule the appropriate maintenance (e.g., tool replacement, load adjustment).'
    ]
  }
  // You can easily add more recommendations for 'pump', 'hydraulic', etc.
};

const RecommendationGuide = ({ machineType, status }) => {
  // Find the correct set of steps, or default to null if none exist
  const steps = recommendationSteps[machineType]?.[status];

  // If there are no steps for this status/machine, don't render anything
  if (!steps) {
    return null;
  }

  return (
    <div className="bg-sky-50 border-l-4 border-sky-500 rounded-lg shadow-md p-6 mt-8">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">📋 Actionable Recommendation Guide</h3>
      <ul className="space-y-3 text-gray-700">
        {steps.map((step, index) => (
          <li key={index} dangerouslySetInnerHTML={{ __html: step.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        ))}
      </ul>
    </div>
  );
};

export default RecommendationGuide;