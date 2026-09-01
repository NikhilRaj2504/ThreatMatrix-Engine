from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class AuthUser(Base):
    __tablename__ = "auth_users"

    id = Column(String(50), primary_key=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="ANALYST")  # ADMIN, ANALYST, VIEWER
    full_name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    phone_hash = Column(String(64), index=True)
    email = Column(String(100))
    avg_tx_amount = Column(Float, default=1000.0)
    max_tx_amount = Column(Float, default=5000.0)
    tx_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)

    transactions = relationship("Transaction", back_populates="sender")
    calls = relationship("CallRecord", back_populates="recipient")


class Device(Base):
    __tablename__ = "devices"

    id = Column(String(50), primary_key=True, index=True)
    device_fingerprint = Column(String(100), index=True)
    os = Column(String(50), default="Android")
    model = Column(String(100), default="Pixel")
    first_seen = Column(DateTime, default=utcnow)
    last_seen = Column(DateTime, default=utcnow)
    is_suspicious = Column(Boolean, default=False)

    transactions = relationship("Transaction", back_populates="device")


class UserDevice(Base):
    __tablename__ = "user_devices"

    id = Column(String(50), primary_key=True)
    user_id = Column(String(50), ForeignKey("users.id"), index=True)
    device_id = Column(String(50), ForeignKey("devices.id"), index=True)
    first_used = Column(DateTime, default=utcnow)
    last_used = Column(DateTime, default=utcnow)


class UpiEntity(Base):
    __tablename__ = "upi_entities"

    upi_id = Column(String(100), primary_key=True, index=True)
    account_holder = Column(String(100), nullable=False)
    declared_category = Column(String(100), default="Retail")
    total_inflow = Column(Float, default=0.0)
    total_transactions = Column(Integer, default=0)
    unique_senders_count = Column(Integer, default=0)
    fraud_reports_count = Column(Integer, default=0)
    entity_risk_score = Column(Float, default=0.0)
    first_seen = Column(DateTime, default=utcnow)
    last_seen = Column(DateTime, default=utcnow)

    transactions = relationship("Transaction", back_populates="receiver")
    fraud_reports = relationship("FraudReport", back_populates="entity")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(50), primary_key=True, index=True)
    sender_id = Column(String(50), ForeignKey("users.id"), index=True, nullable=False)
    receiver_upi = Column(String(100), ForeignKey("upi_entities.upi_id"), index=True, nullable=False)
    device_id = Column(String(50), ForeignKey("devices.id"), index=True)
    amount = Column(Float, nullable=False)
    location = Column(String(100), default="Unknown")
    ip_address = Column(String(50), default="127.0.0.1")
    description = Column(String(255), default="Payment")
    timestamp = Column(DateTime, default=utcnow, index=True)
    status = Column(String(20), default="COMPLETED")  # PENDING, COMPLETED, CANCELLED, BLOCKED

    sender = relationship("User", back_populates="transactions")
    receiver = relationship("UpiEntity", back_populates="transactions")
    device = relationship("Device", back_populates="transactions")
    risk_assessment = relationship("RiskAssessment", back_populates="transaction", uselist=False)


class CallRecord(Base):
    __tablename__ = "call_records"

    id = Column(String(50), primary_key=True, index=True)
    caller_number = Column(String(50), index=True, nullable=False)
    recipient_id = Column(String(50), ForeignKey("users.id"), index=True)
    transcript = Column(Text, nullable=False)
    audio_path = Column(String(255), nullable=True)
    voice_risk_score = Column(Float, default=0.0)
    detected_intents = Column(Text, default="[]")
    timestamp = Column(DateTime, default=utcnow, index=True)

    recipient = relationship("User", back_populates="calls")
    risk_assessments = relationship("RiskAssessment", back_populates="call_record")


class FraudReport(Base):
    __tablename__ = "fraud_reports"

    id = Column(String(50), primary_key=True, index=True)
    reported_upi = Column(String(100), ForeignKey("upi_entities.upi_id"), index=True, nullable=False)
    reported_by_user = Column(String(50), index=True)
    category = Column(String(50), nullable=False)  # KYC Scam, Investment, Impersonation, OTP Scam
    description = Column(Text)
    loss_amount = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=utcnow, index=True)
    status = Column(String(20), default="CONFIRMED")

    entity = relationship("UpiEntity", back_populates="fraud_reports")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(String(50), primary_key=True, index=True)
    transaction_id = Column(String(50), ForeignKey("transactions.id"), index=True, nullable=True)
    call_record_id = Column(String(50), ForeignKey("call_records.id"), index=True, nullable=True)
    final_risk_score = Column(Float, nullable=False, index=True)
    risk_level = Column(String(20), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    recommended_action = Column(String(50), nullable=False)  # ALLOW, MONITOR, WARN_CONFIRM, STRONG_WARN_CONFIRM
    rule_score = Column(Float, default=0.0)
    ml_probability = Column(Float, default=0.0)
    voice_score = Column(Float, default=0.0)
    entity_score = Column(Float, default=0.0)
    network_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utcnow, index=True)

    transaction = relationship("Transaction", back_populates="risk_assessment")
    call_record = relationship("CallRecord", back_populates="risk_assessments")
    reasons = relationship("RiskReason", back_populates="assessment", cascade="all, delete-orphan")
    user_confirmation = relationship("UserConfirmation", back_populates="assessment", uselist=False)
    analyst_review = relationship("AnalystReview", back_populates="assessment", uselist=False)


class RiskReason(Base):
    __tablename__ = "risk_reasons"

    id = Column(String(50), primary_key=True)
    assessment_id = Column(String(50), ForeignKey("risk_assessments.id"), index=True, nullable=False)
    code = Column(String(50), nullable=False)
    message = Column(String(255), nullable=False)
    severity_weight = Column(Float, default=1.0)
    rank_order = Column(Integer, default=1)

    assessment = relationship("RiskAssessment", back_populates="reasons")


class UserConfirmation(Base):
    __tablename__ = "user_confirmations"

    id = Column(String(50), primary_key=True)
    assessment_id = Column(String(50), ForeignKey("risk_assessments.id"), index=True, nullable=False)
    user_decision = Column(String(20), nullable=False)  # CANCELLED, CONTINUED
    feedback_comment = Column(Text, nullable=True)
    decided_at = Column(DateTime, default=utcnow)

    assessment = relationship("RiskAssessment", back_populates="user_confirmation")


class AnalystReview(Base):
    __tablename__ = "analyst_reviews"

    id = Column(String(50), primary_key=True)
    assessment_id = Column(String(50), ForeignKey("risk_assessments.id"), index=True, nullable=False)
    analyst_id = Column(String(50), nullable=False)
    verdict = Column(String(30), nullable=False)  # CONFIRMED_FRAUD, LEGITIMATE, FALSE_POSITIVE, NEEDS_REVIEW
    notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, default=utcnow)

    assessment = relationship("RiskAssessment", back_populates="analyst_review")
