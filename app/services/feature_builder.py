import numpy as np
import joblib
import os

BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # app/
MODEL_DIR = os.path.join(BASE_DIR, "models")

feature_order = joblib.load(os.path.join(MODEL_DIR, "feature_order.pkl"))

def build_features(parsed):
    return np.array([[parsed.get(col, 0) for col in feature_order]])