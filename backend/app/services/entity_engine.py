import numpy as np
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.schema import UpiEntity, Transaction, FraudReport


class EntityIntelligenceEngine:
    """
    Module B & C: Evaluates receiver UPI entity behavior, unique sender distribution,
    money mule characteristics, inflow velocity spikes, and business category mismatches.
    """

    SUSPICIOUS_PAYMENT_KEYWORDS = {
        "kyc", "verification", "unblock", "bonus", "lottery", "crypto", "investment",
        "guaranteed return", "telegram task", "part time job", "loan processing",
        "customs fee", "security deposit", "refund charge"
    }

    async def analyze(
        self,
        db: AsyncSession,
        receiver_upi: str,
        current_amount: float,
        description: Optional[str] = None,
        tx_timestamp: Optional[datetime] = None
    ) -> Dict[str, Any]:
        now = tx_timestamp or datetime.now(timezone.utc)

        # 1. Fetch UPI Entity Record
        entity_res = await db.execute(select(UpiEntity).where(UpiEntity.upi_id == receiver_upi))
        entity = entity_res.scalar_one_or_none()

        # 2. Fetch Entity's Recent Inflow Transactions
        tx_res = await db.execute(
            select(Transaction)
            .where(and_(Transaction.receiver_upi == receiver_upi, Transaction.status == "COMPLETED"))
            .order_by(Transaction.timestamp.desc())
            .limit(500)
        )
        entity_txs = tx_res.scalars().all()

        # 3. Fetch Fraud Reports
        report_res = await db.execute(
            select(FraudReport)
            .where(FraudReport.reported_upi == receiver_upi)
            .order_by(FraudReport.timestamp.desc())
        )
        fraud_reports = report_res.scalars().all()

        # Metrics calculation
        total_tx_count = len(entity_txs) if entity_txs else (entity.total_transactions if entity else 0)
        total_inflow = sum(tx.amount for tx in entity_txs) if entity_txs else (entity.total_inflow if entity else 0.0)
        senders = {tx.sender_id for tx in entity_txs if tx.sender_id}
        unique_senders_count = len(senders) if senders else (entity.unique_senders_count if entity else 0)
        
        # Account Age (Days)
        first_seen = entity.first_seen if entity and entity.first_seen else now
        if first_seen.tzinfo is None:
            first_seen = first_seen.replace(tzinfo=timezone.utc)
        account_age_days = max(1, (now - first_seen).days)

        # Unique Sender Ratio
        unique_sender_ratio = (unique_senders_count / total_tx_count) if total_tx_count > 0 else 1.0

        # Inflow Velocity: Last 24 Hours
        day_ago = now - timedelta(hours=24)
        inflow_last_24h = sum(
            tx.amount for tx in entity_txs 
            if tx.timestamp and tx.timestamp.replace(tzinfo=timezone.utc) >= day_ago
        )
        daily_average_inflow = (total_inflow / account_age_days) if account_age_days > 0 else total_inflow
        inflow_spike_multiplier = (inflow_last_24h / daily_average_inflow) if daily_average_inflow > 0 else 1.0

        # Mule Account Indicator: High inflow + high unique senders on young account
        is_mule_pattern = (
            account_age_days <= 45 and 
            unique_senders_count >= 15 and 
            unique_sender_ratio >= 0.70 and 
            total_inflow >= 100000.0
        )

        # Profile / Declared Business vs Transaction Pattern Mismatch
        declared_cat = (entity.declared_category if entity else "Individual / P2P").lower()
        desc_lower = (description or "").lower()
        has_profile_mismatch = False
        mismatch_reason = ""

        # Check for scam intent keywords in transaction note/description
        matched_scam_kw = [kw for kw in self.SUSPICIOUS_PAYMENT_KEYWORDS if kw in desc_lower]
        if matched_scam_kw:
            has_profile_mismatch = True
            mismatch_reason = f"Payment note contains high-risk trigger keywords: {', '.join(matched_scam_kw)}"
        elif "retail" in declared_cat or "grocery" in declared_cat or "kirana" in declared_cat:
            if unique_sender_ratio > 0.90 and total_tx_count > 50 and inflow_spike_multiplier > 4.0:
                has_profile_mismatch = True
                mismatch_reason = f"Entity declared as '{entity.declared_category}' displays non-retail rapid fund aggregation characteristics"

        # Fraud Reports with Time Decay Weighting
        report_count = len(fraud_reports)
        decayed_report_score = 0.0
        for rep in fraud_reports:
            rep_time = rep.timestamp if rep.timestamp else now
            if rep_time.tzinfo is None:
                rep_time = rep_time.replace(tzinfo=timezone.utc)
            days_old = max(0, (now - rep_time).days)
            # Exponential decay: 0-7 days = 1.0 weight, 30 days = 0.6, 90 days = 0.2
            weight = np.exp(-days_old / 45.0)
            decayed_report_score += 15.0 * weight

        # Compute Entity Risk Score (0 - 100)
        entity_risk = 0.0
        signals_triggered = []

        # 1. Fraud reports
        if report_count > 0:
            rep_pts = min(40.0, decayed_report_score)
            entity_risk += rep_pts
            signals_triggered.append({
                "code": "RECEIVER_FRAUD_REPORTS",
                "message": f"Receiver UPI has {report_count} active fraud complaints registered against it",
                "weight": rep_pts
            })

        # 2. Mule Pattern
        if is_mule_pattern:
            entity_risk += 35.0
            signals_triggered.append({
                "code": "MULE_ACCOUNT_BEHAVIOR",
                "message": f"Receiver displays money mule pattern: New account ({account_age_days}d old) with {unique_senders_count} unique senders and ₹{total_inflow:,.0f} aggregate inflow",
                "weight": 35.0
            })
        elif unique_sender_ratio >= 0.85 and unique_senders_count >= 25:
            entity_risk += 20.0
            signals_triggered.append({
                "code": "HIGH_SENDER_DISPERSION",
                "message": f"High unique sender dispersion ({unique_sender_ratio:.0%} of {total_tx_count} transactions from distinct individuals)",
                "weight": 20.0
            })

        # 3. Sudden Inflow Spike
        if inflow_spike_multiplier >= 4.0 and inflow_last_24h >= 50000.0:
            entity_risk += 25.0
            signals_triggered.append({
                "code": "INFLOW_VELOCITY_SPIKE",
                "message": f"Receiver has sudden 24-hour inflow surge of ₹{inflow_last_24h:,.2f} ({inflow_spike_multiplier:.1f}x daily baseline)",
                "weight": 25.0
            })

        # 4. Profile Mismatch
        if has_profile_mismatch:
            entity_risk += 20.0
            signals_triggered.append({
                "code": "PROFILE_TRANSACTION_MISMATCH",
                "message": mismatch_reason,
                "weight": 20.0
            })

        final_entity_score = min(100.0, max(0.0, entity_risk))

        return {
            "entity_risk_score": final_entity_score,
            "account_holder": entity.account_holder if entity else "Unverified Account",
            "declared_category": entity.declared_category if entity else "General",
            "account_age_days": account_age_days,
            "total_inflow": total_inflow,
            "total_transactions": total_tx_count,
            "unique_senders_count": unique_senders_count,
            "unique_sender_ratio": round(unique_sender_ratio, 2),
            "inflow_last_24h": inflow_last_24h,
            "inflow_spike_multiplier": round(inflow_spike_multiplier, 2),
            "fraud_reports_count": report_count,
            "is_mule_pattern": is_mule_pattern,
            "has_profile_mismatch": has_profile_mismatch,
            "signals": signals_triggered
        }


entity_engine = EntityIntelligenceEngine()
