import uuid
import hashlib
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext

from app.models.schema import (
    AuthUser,
    User,
    Device,
    UserDevice,
    UpiEntity,
    Transaction,
    CallRecord,
    FraudReport,
    RiskAssessment,
    RiskReason,
    UserConfirmation,
    AnalystReview
)
from app.api.auth import get_password_hash


async def seed_database(db: AsyncSession):
    # Check if already seeded
    user_check = await db.execute(select(AuthUser).limit(1))
    if user_check.scalar_one_or_none():
        print("Database already contains data. Skipping initial seeding.")
        return

    print("Starting rich synthetic data generation for Fraud Shield Engine...")
    now = datetime.now(timezone.utc)

    # 1. Auth Users
    admin = AuthUser(
        id="AUTH_ADMIN_01",
        username="admin",
        hashed_password=get_password_hash("admin123"),
        role="ADMIN",
        full_name="Chief Security Officer"
    )
    analyst = AuthUser(
        id="AUTH_ANALYST_01",
        username="analyst",
        hashed_password=get_password_hash("analyst123"),
        role="ANALYST",
        full_name="Lead Fraud Analyst"
    )
    db.add_all([admin, analyst])

    # 2. Users (Senders)
    users_data = [
        ("U101", "Aarav Sharma", "aarav.s@example.com", 1200.0, 8000.0, 48),
        ("U102", "Priya Patel", "priya.p@example.com", 2500.0, 15000.0, 62),
        ("U103", "Rohan Verma", "rohan.v@example.com", 950.0, 4500.0, 31),
        ("U104", "Sneha Rao", "sneha.r@example.com", 3100.0, 20000.0, 85),
        ("U105", "Vikram Singh", "vikram.s@example.com", 1800.0, 10000.0, 54),
        ("U106", "Ananya Gupta", "ananya.g@example.com", 1400.0, 7500.0, 29),
        ("U107", "Karan Malhotra", "karan.m@example.com", 4200.0, 25000.0, 92),
        ("U108", "Neha Sen", "neha.s@example.com", 800.0, 3500.0, 22),
    ]

    for uid, name, email, avg_tx, max_tx, count in users_data:
        u = User(
            id=uid,
            full_name=name,
            phone_hash=hashlib.sha256(f"+91{uid}".encode()).hexdigest()[:16],
            email=email,
            avg_tx_amount=avg_tx,
            max_tx_amount=max_tx,
            tx_count=count,
            created_at=now - timedelta(days=180)
        )
        db.add(u)

    # 3. Devices
    devices_data = [
        ("DEV_S23_01", "FP_SAM_S23_8892", "Android 14", "Samsung Galaxy S23", False),
        ("DEV_PIXEL_02", "FP_GOOG_PX8_1120", "Android 14", "Google Pixel 8", False),
        ("DEV_IPHONE_03", "FP_APPL_IP15_4491", "iOS 17.4", "iPhone 15 Pro", False),
        ("DEV_ONEPLUS_04", "FP_OP_12_3342", "Android 14", "OnePlus 12", False),
        ("DEV_ROG_99", "FP_EMU_ROG_9981", "Android 11", "Rooted Multiplex Emulator", True),
    ]

    for did, fp, os_name, model, is_susp in devices_data:
        d = Device(
            id=did,
            device_fingerprint=fp,
            os=os_name,
            model=model,
            first_seen=now - timedelta(days=120),
            last_seen=now,
            is_suspicious=is_susp
        )
        db.add(d)

    # 4. User-Device Associations
    user_devices = [
        ("U101", "DEV_S23_01"),
        ("U102", "DEV_PIXEL_02"),
        ("U103", "DEV_IPHONE_03"),
        ("U104", "DEV_ONEPLUS_04"),
        ("U105", "DEV_S23_01"),
        # Suspicious shared device multiplexing across accounts
        ("U106", "DEV_ROG_99"),
        ("U107", "DEV_ROG_99"),
        ("U108", "DEV_ROG_99"),
    ]

    for uid, did in user_devices:
        ud = UserDevice(
            id=f"UD_{uid}_{did}",
            user_id=uid,
            device_id=did,
            first_used=now - timedelta(days=90),
            last_used=now
        )
        db.add(ud)

    # 5. Receiver UPI Entities
    entities_data = [
        # Legitimate Merchants
        ("dmart.retail@axis", "Avenue Supermarts Ltd (DMart)", "Grocery & Retail", 4500000.0, 3200, 2800, 0, 5.0, 365),
        ("swiggy.pay@icici", "Bundl Technologies (Swiggy)", "Food & Dining", 8900000.0, 14500, 12000, 1, 8.0, 400),
        ("electricity.cesu@sbi", "TPCODL Electricity Board", "Utility Services", 12000000.0, 9800, 9100, 0, 4.0, 500),
        ("apollo.pharmacy@hdfcbank", "Apollo Health & Pharmacy", "Healthcare Retail", 2800000.0, 2100, 1900, 0, 6.0, 300),
        ("zomato.online@hdfcbank", "Zomato Media Ltd", "Food & Dining", 7500000.0, 11200, 9800, 0, 7.0, 350),

        # High Risk / Mule Entities
        ("quick.fast.cash@paytm", "Karanjit Traders (Mule)", "P2P Collection", 920000.0, 110, 85, 12, 94.0, 14),
        ("kyc.verification.desk@ybl", "KYC Helpdesk Services (Scam)", "Financial Services", 410000.0, 48, 42, 8, 88.0, 8),
        ("crypto.trader99@okhdfcbank", "Global Wealth Crypto (Telegram)", "Investment", 1850000.0, 160, 145, 15, 92.0, 21),
        ("customs.security.fee@icici", "FedEx Customs Clearing Desk", "Logistics Fee", 650000.0, 35, 33, 9, 96.0, 6),
    ]

    for upi, holder, cat, inflow, tx_cnt, senders, reports, score, age in entities_data:
        e = UpiEntity(
            upi_id=upi,
            account_holder=holder,
            declared_category=cat,
            total_inflow=inflow,
            total_transactions=tx_cnt,
            unique_senders_count=senders,
            fraud_reports_count=reports,
            entity_risk_score=score,
            first_seen=now - timedelta(days=age),
            last_seen=now
        )
        db.add(e)

    # 6. Fraud Reports
    fraud_reports_data = [
        ("quick.fast.cash@paytm", "U103", "Telegram Task Scam", "Promised hotel review job commission, demanded 20,000 deposit.", 20000.0, 2),
        ("quick.fast.cash@paytm", "U104", "Investment Fraud", "High yield crypto investment group on WhatsApp.", 35000.0, 4),
        ("quick.fast.cash@paytm", "U106", "Part-time Job Scam", "Asked for VIP unlocking deposit.", 15000.0, 7),
        ("kyc.verification.desk@ybl", "U105", "KYC Threat Scam", "Caller claimed SBI account blocked, asked for verification transfer.", 25000.0, 3),
        ("crypto.trader99@okhdfcbank", "U107", "Crypto Arbitrage Scam", "Transferred funds for guaranteed 50% daily return.", 50000.0, 10),
        ("customs.security.fee@icici", "U108", "Digital Arrest / Customs", "Claimed parcel seized by Delhi Narcotics police.", 40000.0, 1),
    ]

    for upi, reporter, cat, desc_text, amt, days_ago in fraud_reports_data:
        fr = FraudReport(
            id=f"REP_{uuid.uuid4().hex[:10].upper()}",
            reported_upi=upi,
            reported_by_user=reporter,
            category=cat,
            description=desc_text,
            loss_amount=amt,
            timestamp=now - timedelta(days=days_ago),
            status="CONFIRMED"
        )
        db.add(fr)

    # 7. Historical Call Records (Linking Serial Scammers)
    serial_caller = "+919876500111"
    calls_data = [
        (serial_caller, "U103", "Sir I am calling from SBI KYC desk. Your account is expiring today. Transfer 15000 to verify.", 92.0, 2),
        (serial_caller, "U104", "SBI Bank Manager calling. Your account is frozen due to pending KYC documents. Pay verification charge.", 88.0, 4),
        (serial_caller, "U106", "Officer from Delhi Police Cyber Crime. Your parcel has contraband items. Pay security deposit.", 95.0, 5),
        ("+919123456789", "U101", "Hello sir, we are calling regarding your Amazon order delivery status.", 10.0, 10),
        ("+919988776655", "U102", "Dear customer, your Swiggy delivery partner is at your doorstep.", 5.0, 8),
    ]

    for caller, recip, transcript, v_score, days_ago in calls_data:
        cr = CallRecord(
            id=f"CAL_{uuid.uuid4().hex[:10].upper()}",
            caller_number=caller,
            recipient_id=recip,
            transcript=transcript,
            voice_risk_score=v_score,
            detected_intents="['AUTHORITY_IMPERSONATION', 'URGENCY_AND_THREAT', 'FINANCIAL_EXTRACTION_DEMAND']" if v_score > 50 else "[]",
            timestamp=now - timedelta(days=days_ago)
        )
        db.add(cr)

    # 8. Historical Transactions & Assessments
    tx_history = [
        # Normal everyday transactions for U101
        ("U101", "dmart.retail@axis", "DEV_S23_01", 650.0, "Mumbai", "Groceries", 15, "COMPLETED", 12.0, "LOW", "ALLOW"),
        ("U101", "swiggy.pay@icici", "DEV_S23_01", 420.0, "Mumbai", "Lunch order", 10, "COMPLETED", 8.0, "LOW", "ALLOW"),
        ("U101", "apollo.pharmacy@hdfcbank", "DEV_S23_01", 1150.0, "Mumbai", "Medicines", 5, "COMPLETED", 14.0, "LOW", "ALLOW"),
        ("U101", "electricity.cesu@sbi", "DEV_S23_01", 2400.0, "Mumbai", "Electricity bill", 2, "COMPLETED", 18.0, "LOW", "ALLOW"),

        # High risk / flagged cases
        ("U103", "quick.fast.cash@paytm", "DEV_IPHONE_03", 20000.0, "Delhi", "Job task", 2, "CANCELLED", 89.0, "CRITICAL", "STRONG_WARN_CONFIRM"),
        ("U104", "quick.fast.cash@paytm", "DEV_ONEPLUS_04", 35000.0, "Bengaluru", "VIP task", 4, "BLOCKED", 94.0, "CRITICAL", "STRONG_WARN_CONFIRM"),
        ("U105", "kyc.verification.desk@ybl", "DEV_S23_01", 25000.0, "Hyderabad", "Verification", 3, "CANCELLED", 91.0, "CRITICAL", "STRONG_WARN_CONFIRM"),
        ("U107", "crypto.trader99@okhdfcbank", "DEV_ROG_99", 50000.0, "Kolkata", "Crypto deposit", 1, "COMPLETED", 93.0, "CRITICAL", "STRONG_WARN_CONFIRM"),
    ]

    for sender, receiver, dev, amt, loc, desc_txt, days_ago, status, r_score, r_lvl, act in tx_history:
        t_id = f"TX_{uuid.uuid4().hex[:10].upper()}"
        a_id = f"RSK_{uuid.uuid4().hex[:10].upper()}"
        tx_time = now - timedelta(days=days_ago)

        tx = Transaction(
            id=t_id,
            sender_id=sender,
            receiver_upi=receiver,
            device_id=dev,
            amount=amt,
            location=loc,
            description=desc_txt,
            timestamp=tx_time,
            status=status
        )
        db.add(tx)

        assessment = RiskAssessment(
            id=a_id,
            transaction_id=t_id,
            final_risk_score=r_score,
            risk_level=r_lvl,
            recommended_action=act,
            rule_score=r_score * 0.9,
            ml_probability=r_score / 100.0,
            voice_score=90.0 if r_score > 80 else 0.0,
            entity_score=85.0 if r_score > 80 else 10.0,
            network_score=75.0 if r_score > 80 else 5.0,
            created_at=tx_time
        )
        db.add(assessment)

        # Add reason
        if r_score > 50:
            rsn = RiskReason(
                id=f"RSN_{uuid.uuid4().hex[:8].upper()}",
                assessment_id=a_id,
                code="SUSPICIOUS_PAYMENT_PATTERN",
                message=f"Elevated risk: High inflow velocity or scam pattern link detected on receiver '{receiver}'",
                severity_weight=r_score,
                rank_order=1
            )
            db.add(rsn)

        # Add user confirmation / analyst review for some cases
        if status == "CANCELLED":
            cnf = UserConfirmation(
                id=f"CNF_{uuid.uuid4().hex[:8].upper()}",
                assessment_id=a_id,
                user_decision="CANCELLED",
                feedback_comment="Warning was helpful. Caller seemed suspicious.",
                decided_at=tx_time + timedelta(minutes=2)
            )
            db.add(cnf)
        elif status == "BLOCKED":
            rev = AnalystReview(
                id=f"REV_{uuid.uuid4().hex[:8].upper()}",
                assessment_id=a_id,
                analyst_id="ANALYST_SEC_01",
                verdict="CONFIRMED_FRAUD",
                notes="Confirmed mule account part of serial scam ring.",
                reviewed_at=tx_time + timedelta(hours=1)
            )
            db.add(rev)

    await db.commit()
    print("Database seeding completed successfully!")
