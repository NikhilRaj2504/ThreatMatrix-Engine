import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix, precision_recall_fscore_support
from sklearn.ensemble import RandomForestClassifier

FEATURE_NAMES = [
    "amount_ratio_avg",
    "z_score",
    "iqr_factor",
    "tx_last_1h",
    "tx_last_24h",
    "is_new_receiver",
    "is_new_device",
    "is_location_anomaly",
    "unique_sender_ratio",
    "inflow_spike_multiplier",
    "fraud_reports_count",
    "has_voice_phishing",
    "voice_risk_score",
    "network_risk_score"
]


def generate_synthetic_training_data(n_samples: int = 5000) -> pd.DataFrame:
    np.random.seed(42)

    # 1. Generate Legitimate Transactions (85%)
    n_legit = int(n_samples * 0.85)
    legit_data = {
        "amount_ratio_avg": np.random.exponential(scale=0.8, size=n_legit) + 0.2,
        "z_score": np.random.normal(loc=0.0, scale=0.8, size=n_legit),
        "iqr_factor": np.clip(np.random.normal(loc=0.2, scale=0.3, size=n_legit), 0, None),
        "tx_last_1h": np.random.poisson(lam=0.4, size=n_legit),
        "tx_last_24h": np.random.poisson(lam=2.5, size=n_legit),
        "is_new_receiver": np.random.binomial(n=1, p=0.20, size=n_legit),
        "is_new_device": np.random.binomial(n=1, p=0.05, size=n_legit),
        "is_location_anomaly": np.random.binomial(n=1, p=0.04, size=n_legit),
        "unique_sender_ratio": np.random.beta(a=2, b=5, size=n_legit),
        "inflow_spike_multiplier": np.random.lognormal(mean=0.0, sigma=0.3, size=n_legit),
        "fraud_reports_count": np.random.choice([0, 1], size=n_legit, p=[0.98, 0.02]),
        "has_voice_phishing": np.random.binomial(n=1, p=0.01, size=n_legit),
        "voice_risk_score": np.random.exponential(scale=5.0, size=n_legit),
        "network_risk_score": np.random.exponential(scale=8.0, size=n_legit),
        "is_fraud": 0
    }

    # 2. Generate Fraudulent Transactions (15%)
    n_fraud = n_samples - n_legit
    fraud_data = {
        "amount_ratio_avg": np.random.exponential(scale=4.5, size=n_fraud) + 2.5,
        "z_score": np.random.normal(loc=3.2, scale=1.5, size=n_fraud),
        "iqr_factor": np.clip(np.random.normal(loc=3.5, scale=1.8, size=n_fraud), 0, None),
        "tx_last_1h": np.random.poisson(lam=4.0, size=n_fraud),
        "tx_last_24h": np.random.poisson(lam=12.0, size=n_fraud),
        "is_new_receiver": np.random.binomial(n=1, p=0.85, size=n_fraud),
        "is_new_device": np.random.binomial(n=1, p=0.65, size=n_fraud),
        "is_location_anomaly": np.random.binomial(n=1, p=0.55, size=n_fraud),
        "unique_sender_ratio": np.random.beta(a=6, b=2, size=n_fraud),
        "inflow_spike_multiplier": np.random.lognormal(mean=1.5, sigma=0.8, size=n_fraud),
        "fraud_reports_count": np.random.choice([0, 1, 2, 4, 8], size=n_fraud, p=[0.20, 0.30, 0.25, 0.15, 0.10]),
        "has_voice_phishing": np.random.binomial(n=1, p=0.60, size=n_fraud),
        "voice_risk_score": np.clip(np.random.normal(loc=75.0, scale=20.0, size=n_fraud), 0, 100),
        "network_risk_score": np.clip(np.random.normal(loc=70.0, scale=22.0, size=n_fraud), 0, 100),
        "is_fraud": 1
    }

    df_legit = pd.DataFrame(legit_data)
    df_fraud = pd.DataFrame(fraud_data)
    df = pd.concat([df_legit, df_fraud], ignore_index=True).sample(frac=1.0, random_state=42).reset_index(drop=True)
    return df


def train_and_save_model(model_save_path: str = "app/ml/fraud_model.joblib"):
    df = generate_synthetic_training_data(n_samples=6000)
    X = df[FEATURE_NAMES]
    y = df["is_fraud"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)

    # Try XGBoost or fallback to Random Forest
    try:
        from xgboost import XGBClassifier
        clf = XGBClassifier(
            n_estimators=120,
            max_depth=5,
            learning_rate=0.08,
            subsample=0.85,
            colsample_bytree=0.85,
            random_state=42,
            eval_metric="logloss"
        )
        model_type = "XGBoost Classifier"
    except Exception:
        clf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
        model_type = "Random Forest Classifier"

    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]

    roc_auc = float(roc_auc_score(y_test, y_prob))
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="binary")
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()

    fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
    fnr = float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0

    # Feature Importances
    importances = clf.feature_importances_
    feat_imp = [
        {"feature": name, "importance": round(float(imp), 4)}
        for name, imp in sorted(zip(FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True)
    ]

    metrics_payload = {
        "model_name": model_type,
        "version": "1.0.0-prod",
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1_score": round(float(f1), 4),
        "roc_auc": round(roc_auc, 4),
        "false_positive_rate": round(fpr, 4),
        "false_negative_rate": round(fnr, 4),
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "feature_importances": feat_imp
    }

    os.makedirs(os.path.dirname(model_save_path), exist_ok=True)
    artifact = {
        "model": clf,
        "feature_names": FEATURE_NAMES,
        "metrics": metrics_payload
    }
    joblib.dump(artifact, model_save_path)
    print(f"Model successfully trained and saved to {model_save_path}. ROC-AUC: {roc_auc:.4f}, F1: {f1:.4f}")
    return metrics_payload


if __name__ == "__main__":
    train_and_save_model()
