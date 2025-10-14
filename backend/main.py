# backend/main.py
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
from filterpy.kalman import KalmanFilter
import shap
import numpy as np
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

# Initialize the FastAPI application
app = FastAPI(title="SmartPredict AI Platform API")

# --- CORS Middleware Setup ---
# This allows your React frontend (running on localhost:3000) to communicate with this backend
origins = [
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# 1. LOAD ALL MODELS AND EXPLAINERS ON STARTUP
# ==============================================================================

# --- Battery Model ---
try:
    battery_model = joblib.load('backend/rul_predictor_model.joblib')
    print("✅ Battery model loaded successfully.")
except FileNotFoundError:
    print("❌ Battery model file not found.")
    battery_model = None

# --- Motor Model ---
try:
    motor_model = joblib.load('backend/motor_model.joblib')
    print("✅ Motor model loaded successfully.")
except FileNotFoundError:
    print("❌ Motor model file not found.")
    motor_model = None

# --- Hydraulic Model ---
try:
    hydraulic_model = joblib.load('backend/hydraulic_model.joblib')
    hydraulic_status_labels = {
        3: 'Optimal Efficiency',
        20: 'Reduced Efficiency',
        100: 'Close to Total Failure'
    }
    print("✅ Hydraulic model and labels loaded successfully.")
except FileNotFoundError:
    hydraulic_model = None

# --- SHAP Explainer for Motor Model (Using the robust modern Explainer) ---
try:
    motor_model_explainer = shap.Explainer(motor_model)
    print("✅ SHAP explainer for motor model created successfully.")
except Exception as e:
    motor_model_explainer = None
    print(f"❌ Could not create SHAP explainer: {e}")

# ==============================================================================
# 2. DEFINE INPUT DATA MODELS (PYDANTIC)
# ==============================================================================

class BatteryFeatures(BaseModel):
    cycle: int
    capacity: float
    temp_mean: float
    voltage_mean: float
    current_mean: float
    degradation_anomaly_score: float

class MotorFeatures(BaseModel):
    air_temperature_k: float
    process_temperature_k: float
    rotational_speed_rpm: float
    torque_nm: float
    tool_wear_min: float

class HydraulicFeatures(BaseModel):
    PS1: float
    PS2: float
    PS3: float
    PS4: float
    PS5: float
    PS6: float
    EPS1: float
    FS1: float
    TS1: float
    TS2: float
    TS3: float
    TS4: float
    VS1: float
    CE: float
    CP: float
    SE: float

# ==============================================================================
# 3. DEFINE API ENDPOINTS
# ==============================================================================

@app.get("/")
def read_root():
    return {"message": "Welcome to the SmartPredict Predictive Maintenance API!"}

@app.post("/predict/battery")
def predict_rul(features: BatteryFeatures):
    if battery_model is None:
        return {"error": "Battery model not loaded."}
    input_df = pd.DataFrame([features.dict()])
    prediction = battery_model.predict(input_df)
    predicted_rul = prediction[0]
    return {"predicted_RUL": round(float(predicted_rul), 2)}

@app.post("/predict/motor")
def predict_motor_failure(features: MotorFeatures):
    if motor_model is None:
        return {"error": "Motor model not loaded."}
    
    feature_dict = features.dict()
    feature_dict['Air temperature [K]'] = feature_dict.pop('air_temperature_k')
    feature_dict['Process temperature [K]'] = feature_dict.pop('process_temperature_k')
    feature_dict['Rotational speed [rpm]'] = feature_dict.pop('rotational_speed_rpm')
    feature_dict['Torque [Nm]'] = feature_dict.pop('torque_nm')
    feature_dict['Tool wear [min]'] = feature_dict.pop('tool_wear_min')
    input_df = pd.DataFrame([feature_dict])

    prediction = motor_model.predict(input_df)
    probability = motor_model.predict_proba(input_df)
    status = "At Risk" if prediction[0] == 1 else "Normal"
    health_score = (1 - probability[0][1]) * 100
    return {"status": status, "health_score": f"{health_score:.2f}"}

@app.post("/predict/hydraulic")
def predict_hydraulic_failure(features: HydraulicFeatures):
    if hydraulic_model is None:
        return {"error": "Hydraulic model not loaded."}
    input_df = pd.DataFrame([features.dict()])
    prediction_code = hydraulic_model.predict(input_df)[0]
    status = hydraulic_status_labels.get(prediction_code, "Unknown Condition")
    health_score = 100 - prediction_code
    return {"status": status, "health_score": f"{health_score:.2f}"}

# --- THIS IS THE FULLY CORRECTED AND ROBUST EXPLAINABILITY ENDPOINT ---
@app.post("/explain/motor")
def explain_motor_prediction(features: MotorFeatures):
    if motor_model is None or motor_model_explainer is None:
        return {"error": "Model or explainer not loaded."}

    # Prepare the input DataFrame exactly as before
    feature_dict = features.dict()
    feature_dict['Air temperature [K]'] = feature_dict.pop('air_temperature_k')
    feature_dict['Process temperature [K]'] = feature_dict.pop('process_temperature_k')
    feature_dict['Rotational speed [rpm]'] = feature_dict.pop('rotational_speed_rpm')
    feature_dict['Torque [Nm]'] = feature_dict.pop('torque_nm')
    feature_dict['Tool wear [min]'] = feature_dict.pop('tool_wear_min')
    input_df = pd.DataFrame([feature_dict])

    # Use the explainer object directly. This returns a rich Explanation object.
    shap_explanation = motor_model_explainer(input_df)
    
    # For a binary classifier, the output has two sets of values.
    # We want the values for class 1 ("At Risk").
    # The .values attribute contains the SHAP values.
    # The [0, :, 1] slicing gets:
    # [0]   - The first (and only) prediction sample.
    # [:]   - All features for that sample.
    # [1]   - The values for class 1 ("At Risk").
    shap_values_for_failure = shap_explanation.values[0, :, 1]

    feature_importance = pd.DataFrame({
        'feature': input_df.columns,
        'importance': shap_values_for_failure
    }).sort_values('importance', ascending=False)
    
    return feature_importance.to_dict('records')

# In backend/main.py

# ... (keep all your existing imports and code)


# ==============================================================================
# 4. UNIVERSAL DRIFT DETECTION ENDPOINT
# ==============================================================================
@app.get("/drift-analysis/{machine_type}")
def get_drift_analysis(machine_type: str):
    """
    Simulates and returns data drift for a specified machine type and its key feature.
    """
    try:
        # --- Configure parameters based on machine type ---
        if machine_type == 'battery':
            filepath = 'data/processed_battery_data.csv'
            feature_column = 'capacity'
            drift_simulation = -0.15  # Simulate capacity fade
        elif machine_type in ['motor', 'pump']: # Reuse motor data for pump
            filepath = 'data/ai4i2020.csv'
            feature_column = 'Torque [Nm]'
            drift_simulation = 6.5  # Simulate increased torque load
        elif machine_type == 'hydraulic':
            # NOTE: Using the motor dataset as a stand-in for hydraulic for demo purposes
            # In a full project, you'd load the actual hydraulic_data.csv
            filepath = 'data/ai4i2020.csv'
            feature_column = 'Process temperature [K]' # Using temperature as a proxy for PS1
            drift_simulation = 10.0 # Simulate system overheating
        else:
            return {"error": "Unknown machine type"}

        # 1. Load the original training data
        df_original = pd.read_csv(filepath)
        original_data = df_original[feature_column]

        # 2. Simulate "live" data with drift
        live_data = original_data + drift_simulation

        # 3. Calculate distributions for charting
        combined_min = min(original_data.min(), live_data.min())
        combined_max = max(original_data.max(), live_data.max())
        bins = np.linspace(combined_min, combined_max, 40)
        original_counts, _ = np.histogram(original_data, bins=bins)
        live_counts, _ = np.histogram(live_data, bins=bins)

        # 4. Format the data for the frontend
        chart_data = [
            {
                "bin_start": bins[i],
                "original_distribution": int(original_counts[i]),
                "live_distribution": int(live_counts[i]),
            }
            for i in range(len(original_counts))
        ]
        
        return {"status": "success", "data": chart_data}

    except FileNotFoundError:
        return {"error": f"Dataset for '{machine_type}' not found at {filepath}."}
    except Exception as e:
        return {"error": str(e)}
    

# In backend/main.py

# ==============================================================================
# 5. MODEL RETRAINING ENDPOINT (SIMULATION)
# ==============================================================================
@app.get("/retrain/{machine_type}")
def retrain_model(machine_type: str):
    """
    Simulates the initiation of a model retraining pipeline.
    In a real-world scenario, this would trigger a cloud-based training job.
    """
    print(f"✅ Retraining process initiated for machine type: {machine_type}")
    return {
        "status": "success",
        "message": f"Retraining pipeline for {machine_type} model has been successfully initiated."
    }

# In backend/main.py

# ==============================================================================
# 6. CLUSTERING INSIGHTS ENDPOINT
# ==============================================================================
# In backend/main.py, find the /fleet-clusters/{machine_type} endpoint
# In backend/main.py

@app.get("/fleet-clusters/{machine_type}")
def get_fleet_clusters(machine_type: str):
    """
    Returns the pre-computed clustering analysis for a specified machine type.
    """
    try:
        if machine_type == 'battery':
            filepath = 'data/clustered_fleet_data.csv'
            df_clusters = pd.read_csv(filepath)

        elif machine_type == 'motor':
            filepath = 'data/clustered_motor_data.csv'
            df_clusters = pd.read_csv(filepath)

            # --- THIS IS THE FIX ---
            # If the data is too large, take a random sample of 300 points
            if len(df_clusters) > 300:
                df_clusters = df_clusters.sample(n=300, random_state=42)
            # --- END OF FIX ---

        else:
            return {"error": "Clustering analysis not available for this machine type."}

        return df_clusters.to_dict('records')

    except FileNotFoundError:
        return {"error": f"Clustered data for '{machine_type}' not found."}

# In backend/main.py

# ==============================================================================
# 7. DATA PREPROCESSING VISUALIZATION
# ==============================================================================
@app.get("/visualize/noise-filter")
def get_noise_filter_visualization():
    """
    Generates a sample of a noisy signal and its smoothed version
    using a moving average to demonstrate data preprocessing.
    """
    # 1. Create a clean sine wave as our "true signal"
    x = np.linspace(0, 10, 100)
    true_signal = np.sin(x) * 10 + 50  # e.g., a temperature oscillating around 50°C

    # 2. Add random noise to simulate a real-world sensor
    noise = np.random.normal(0, 2.5, 100) # Add random fluctuations
    noisy_signal = true_signal + noise

    # 3. Apply a moving average filter to smooth the noise
    window_size = 5
    smoothed_signal = pd.Series(noisy_signal).rolling(window=window_size).mean()

    # 4. Format the data for the frontend chart
    chart_data = []
    for i in range(len(x)):
        chart_data.append({
            "time_step": i,
            "raw_noisy_data": noisy_signal[i],
            # Handle initial null values from rolling average
            "smoothed_data": smoothed_signal.iloc[i] if pd.notna(smoothed_signal.iloc[i]) else None,
        })

    return chart_data
# ==============================================================================
# 8. KALMAN FILTER VISUALIZATION
# ==============================================================================
# ...existing code...

@app.get("/visualize/kalman-filter")
def get_kalman_filter_visualization():
    """
    Generates a noisy signal and shows the superior smoothing
    of a Kalman Filter compared to a standard Moving Average.
    """
    # 1. Create a clean signal (e.g., rising temperature)
    true_signal = np.linspace(50, 80, 100)

    # 2. Add significant noise
    noise = np.random.normal(0, 4, 100)
    noisy_signal = true_signal + noise

    # 3. Apply a Moving Average (for comparison)
    smoothed_signal_ma = pd.Series(noisy_signal).rolling(window=10).mean()

    # 4. Apply a Kalman Filter
    kf = KalmanFilter(dim_x=2, dim_z=1)
    kf.x = np.array([[50.], [0.]])  # Initial state [position; velocity]
    kf.F = np.array([[1., 1.], [0., 1.]])   # State Transition Matrix
    kf.H = np.array([[1., 0.]])    # Measurement Function
    kf.P *= 1000.                  # Covariance Matrix
    kf.R = 5                       # Measurement Noise
    kf.Q = np.array([[(0.05**2)/4, (0.05**2)/2], [(0.05**2)/2, 0.05**2]]) # Process Noise

    # Unpack the tuple returned by batch_filter, keeping only the first item (predictions)
    predictions, *_ = kf.batch_filter(noisy_signal)
    smoothed_signal_kf = predictions[:, 0, 0]

    # 5. Format for frontend
    chart_data = [
        {
            "time_step": i,
            "raw_noisy_data": noisy_signal[i],
            "moving_average": smoothed_signal_ma.iloc[i] if pd.notna(smoothed_signal_ma.iloc[i]) else None,
            "kalman_filter": smoothed_signal_kf[i],
        }
        for i in range(len(true_signal))
    ]

    return chart_data
# ...existing code...