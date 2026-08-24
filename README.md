# Explainable Real-Time Fraud Shield Engine 🛡️⚡

A centralized, privacy-preserving **Fraud Intelligence & Risk Analysis Engine** designed to protect users from UPI payment fraud, voice phishing (vishing), and social-engineering scams in real time.

---

## 🌟 Core Architecture Overview

```
+---------------------------------------------------------------------------------------------------+
|                                       INGESTION & GATEWAY LAYER                                   |
+---------------------------------------------------------------------------------------------------+
|  UPI Payment Gateway / App Sim  |  Telecom / Voice Stream Proxy  |  Bank Dashboard & API Clients  |
+---------------------------------+--------------------------------+--------------------------------+
                                                  │
                                                  ▼
+───────────────────────────────────────────────────────────────────────────────────────────────────+
|                                     FRAUD INTELLIGENCE LAYER                                      |
+───────────────────────────┬───────────────────────────┬───────────────────────────┬───────────────+
| Module A: Transaction     | Module B: Receiver Entity | Module E: Voice Phishing  | Module G:     |
|   Intelligence            |   Intelligence            |   Engine                  |   Network     |
| - Amount Z-Score & IQR    | - Unique sender diversity | - Audio STT (Whisper/wav) |   Graph       |
| - Rolling 1h/24h velocity | - Velocity & inflow spike | - Scam intent extraction  | - NetworkX    |
| - Time-of-day anomaly     | - Mule account behavior   | - Threat & urgency score  | - Mule rings  |
| - Device/Location mismatch| - Business MCC mismatch   | - Impersonation detection | - Shared dev  |
+───────────────────────────┼───────────────────────────┼───────────────────────────┼───────────────+
| Module C: Profile Match   | Module D: Device Intel    | Module F: Scam Narrative  | Module H:     |
| - Declared vs observed    | - Multi-account on device | - Text embeddings         |   Reports     |
| - Suspicious descriptions | - Rapid device switching  | - Cosine similarity       | - Decayed wt  |
+───────────────────────────┴───────────────────────────┴───────────────────────────┴───────────────+
                                                  │
                                                  ▼
                               +─────────────────────────────────────+
                               |        UNIFIED FEATURE ENGINE       |
                               | - Vector assembly & normalization   |
                               | - Statistical historical baseline   |
                               +─────────────────────────────────────+
                                                  │
                                                  ▼
+───────────────────────────────────────────────────────────────────────────────────────────────────+
|                                        HYBRID RISK ENGINE                                         |
+───────────────────────────────────┬───────────────────────────────────┬───────────────────────────+
|      Layer 1: Rule Engine         |    Layer 2: ML Probability Engine | Layer 3: Network Graph    |
|   Transparent weighted heuristics |    XGBoost / Random Forest model  | Entity graph centrality & |
|   Configurable JSON/YAML weights  |    Trained on transaction vector  | Bipartite scam clusters   |
+───────────────────────────────────┴───────────────────────────────────┴───────────────────────────+
                                                  │
                                                  ▼
                               +─────────────────────────────────────+
                               |         FUSED RISK SCORING          |
                               | Composite Score: 0 - 100            |
                               | Levels: LOW / MED / HIGH / CRITICAL |
                               +─────────────────────────────────────+
                                                  │
                                                  ▼
+───────────────────────────────────┬───────────────────────────────────+
|   MODULE K: EXPLAINABILITY        |      MODULE L: POLICY ENGINE      |
| - Natural language reason ranking | - LOW      -> ALLOW               |
| - Feature contribution attribution| - MEDIUM   -> MONITOR             |
| - Exact rule trigger traceability | - HIGH     -> WARN + CONFIRM      |
|                                   | - CRITICAL -> STRONG WARN + CONF  |
+───────────────────────────────────┴───────────────────────────────────+
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows: venv\Scripts\activate, Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- API Docs (Swagger): `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🎯 5 Predefined Hackathon Demonstration Scenarios

1. **Scenario 1 — Safe Everyday Payment**: Known user, normal amount (₹850), verified supermarket merchant, recognized device $\rightarrow$ **LOW Risk (Score: ~12)**, instant allow.
2. **Scenario 2 — High Amount & New Device Anomaly**: 40x amount surge (₹48,000) on unrecognized device to unknown receiver $\rightarrow$ **HIGH Risk (Score: ~72)**, trigger warning modal.
3. **Scenario 3 — Voice Phishing Scam Call**: Fake bank KYC threat call demanding immediate ₹25,000 transfer $\rightarrow$ **CRITICAL Voice Risk (Score: ~92)**.
4. **Scenario 4 — Money Mule Receiver Ring**: 14-day old UPI account receiving bursts from 85 unique senders $\rightarrow$ **HIGH Entity Risk (Score: ~94)**.
5. **Scenario 5 — Full Combined Fraud Attack (Flagship Demo)**: Digital arrest scam call + High amount + Mule receiver + Unrecognized device $\rightarrow$ **CRITICAL Risk (Score: 96+)**, High-friction user modal + 6 ranked explanations.

---

## 📊 Core API Endpoints

- `POST /api/v1/risk/analyze-combined`: Primary multi-modal evaluation endpoint.
- `POST /api/v1/user/confirmation`: Records user decision (`CANCEL` vs `PROCEED`).
- `GET /api/v1/entities/{upi_id}`: Receiver UPI profile and mule risk indicators.
- `GET /api/v1/entities/{upi_id}/network`: Ego-neighborhood graph for Cytoscape/Network visualizer.
- `POST /api/v1/investigations/review`: Bank analyst adjudication and false-positive recording.
- `GET /api/v1/model/metrics`: ROC-AUC, confusion matrix, and feature importances.
