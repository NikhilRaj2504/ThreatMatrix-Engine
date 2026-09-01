import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from app.ml.train import FEATURE_NAMES, train_and_save_model

MODEL_PATH = os.path.join(os.path.dirname(__file__), "fraud_model.joblib")


class FraudMLService:
    def __init__(self):
        self.model = None
        self.metrics = None
        self._ensure_model_loaded()

    def _ensure_model_loaded(self):
        if not os.path.exists(MODEL_PATH):
            print("Model artifact not found. Training initial model...")
            self.metrics = train_and_save_model(MODEL_PATH)

        try:
            artifact = joblib.load(MODEL_PATH)
            self.model = artifact["model"]
            self.metrics = artifact.get("metrics", {})
        except Exception as e:
            print(f"Error loading model: {e}. Retraining...")
            self.metrics = train_and_save_model(MODEL_PATH)
            artifact = joblib.load(MODEL_PATH)
            self.model = artifact["model"]

    def predict_fraud_probability(self, feature_dict: Dict[str, Any]) -> float:
        if self.model is None:
            self._ensure_model_loaded()

        row = []
        for feat in FEATURE_NAMES:
            val = feature_dict.get(feat, 0.0)
            if isinstance(val, bool):
                val = 1.0 if val else 0.0
            elif val is None:
                val = 0.0
            row.append(float(val))

        df_row = pd.DataFrame([row], columns=FEATURE_NAMES)
        try:
            prob = self.model.predict_proba(df_row)[0, 1]
            return float(prob)
        except Exception:
            return 0.5

    def get_metrics(self) -> Dict[str, Any]:
        if not self.metrics:
            self._ensure_model_loaded()
        return self.metrics or {}


ml_service = FraudMLService()
