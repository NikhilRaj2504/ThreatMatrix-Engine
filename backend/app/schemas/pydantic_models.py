from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    full_name: str


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str


class TransactionInput(BaseModel):
    sender_id: str = Field(..., example="U102")
    receiver_upi: str = Field(..., example="merchant@example")
    amount: float = Field(..., gt=0, example=50000.0)
    device_id: Optional[str] = Field("DEV778", example="DEV778")
    location: Optional[str] = Field("Bhubaneswar", example="Bhubaneswar")
    timestamp: Optional[datetime] = None
    description: Optional[str] = Field("Payment", example="Urgent payment")


class CallInput(BaseModel):
    caller_number: str = Field(..., example="+919876543210")
    recipient_id: Optional[str] = Field(None, example="U102")
    transcript: str = Field(..., example="Sir I am calling from bank. Your KYC expired. Transfer 50000 immediately.")
    audio_path: Optional[str] = None


class CombinedRiskInput(BaseModel):
    transaction: TransactionInput
    call: Optional[CallInput] = None


class RiskReasonOutput(BaseModel):
    code: str
    message: str
    severity_weight: float
    rank_order: int


class RiskAssessmentOutput(BaseModel):
    assessment_id: str
    transaction_id: Optional[str] = None
    final_risk_score: float
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    recommended_action: str  # ALLOW, MONITOR, WARN_CONFIRM, STRONG_WARN_CONFIRM
    requires_user_confirmation: bool
    reasons: List[RiskReasonOutput]
    scores_breakdown: Dict[str, float]  # {transaction_risk, entity_risk, voice_risk, network_risk, ml_probability, rule_score}
    timestamp: datetime


class VoiceAnalysisOutput(BaseModel):
    caller_number: str
    voice_risk_score: float
    risk_level: str
    detected_intents: List[str]
    matched_scam_narratives: List[Dict[str, Any]]
    pattern_confidence: float
    indicators: List[str]


class EntityProfileOutput(BaseModel):
    upi_id: str
    account_holder: str
    declared_category: str
    total_inflow: float
    total_transactions: int
    unique_senders_count: int
    fraud_reports_count: int
    entity_risk_score: float
    first_seen: datetime
    last_seen: datetime
    metrics: Dict[str, Any]
    recent_transactions: List[Dict[str, Any]]
    fraud_reports: List[Dict[str, Any]]


class NetworkGraphOutput(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    stats: Dict[str, Any]


class UserConfirmationInput(BaseModel):
    assessment_id: str
    decision: str  # CONTINUED, CANCELLED
    feedback_comment: Optional[str] = None


class AnalystReviewInput(BaseModel):
    assessment_id: str
    verdict: str  # CONFIRMED_FRAUD, LEGITIMATE, FALSE_POSITIVE, NEEDS_REVIEW
    notes: Optional[str] = None


class FraudReportInput(BaseModel):
    reported_upi: str
    reported_by_user: Optional[str] = "Anonymous"
    category: str
    description: str
    loss_amount: float = 0.0


class DashboardOverviewOutput(BaseModel):
    total_transactions: int
    total_analyzed: int
    low_risk_count: int
    medium_risk_count: int
    high_risk_count: int
    critical_risk_count: int
    confirmed_fraud_count: int
    false_positives_count: int
    fraud_prevented_amount: float
    average_risk_score: float
    recent_trend: List[Dict[str, Any]]


class ModelMetricsOutput(BaseModel):
    model_name: str
    version: str
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    false_positive_rate: float
    false_negative_rate: float
    confusion_matrix: Dict[str, int]
    feature_importances: List[Dict[str, Any]]
