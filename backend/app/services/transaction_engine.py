import numpy as np
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.schema import User, Transaction, UserDevice, Device


class TransactionIntelligenceEngine:
    """
    Module A: Analyzes transaction characteristics, statistical anomalies,
    velocity bursts, circadian patterns, and device/location deltas.
    """

    @staticmethod
    def calculate_z_score(amount: float, mean: float, std: float) -> float:
        if std <= 0.0 or np.isnan(std):
            return 0.0
        return float((amount - mean) / std)

    @staticmethod
    def calculate_iqr_outlier_factor(amount: float, amounts: List[float]) -> float:
        if len(amounts) < 4:
            return 0.0
        q75, q25 = np.percentile(amounts, [75, 25])
        iqr = q75 - q25
        if iqr <= 0:
            return 0.0
        if amount > q75:
            return float((amount - q75) / iqr)
        return 0.0

    async def analyze(
        self,
        db: AsyncSession,
        sender_id: str,
        receiver_upi: str,
        amount: float,
        device_id: Optional[str] = None,
        location: Optional[str] = None,
        tx_timestamp: Optional[datetime] = None
    ) -> Dict[str, Any]:
        now = tx_timestamp or datetime.now(timezone.utc)

        # 1. Fetch Sender Profile and Historical Transactions
        user_res = await db.execute(select(User).where(User.id == sender_id))
        user = user_res.scalar_one_or_none()

        history_res = await db.execute(
            select(Transaction)
            .where(and_(Transaction.sender_id == sender_id, Transaction.status == "COMPLETED"))
            .order_by(Transaction.timestamp.desc())
            .limit(100)
        )
        history = history_res.scalars().all()

        historical_amounts = [tx.amount for tx in history] if history else []
        avg_amount = user.avg_tx_amount if (user and user.avg_tx_amount > 0) else (np.mean(historical_amounts) if historical_amounts else 1000.0)
        max_amount = user.max_tx_amount if (user and user.max_tx_amount > 0) else (np.max(historical_amounts) if historical_amounts else 5000.0)
        std_amount = float(np.std(historical_amounts)) if len(historical_amounts) > 2 else (avg_amount * 0.4)

        # 2. Statistical Deviations
        z_score = self.calculate_z_score(amount, avg_amount, std_amount)
        iqr_factor = self.calculate_iqr_outlier_factor(amount, historical_amounts)
        amount_ratio_avg = float(amount / avg_amount) if avg_amount > 0 else 1.0
        amount_ratio_max = float(amount / max_amount) if max_amount > 0 else 1.0

        # 3. Velocity Checks
        one_hour_ago = now - timedelta(hours=1)
        day_ago = now - timedelta(hours=24)
        five_mins_ago = now - timedelta(minutes=5)

        tx_last_1h = sum(1 for tx in history if tx.timestamp and tx.timestamp.replace(tzinfo=timezone.utc) >= one_hour_ago)
        tx_last_24h = sum(1 for tx in history if tx.timestamp and tx.timestamp.replace(tzinfo=timezone.utc) >= day_ago)
        tx_last_5m = sum(1 for tx in history if tx.timestamp and tx.timestamp.replace(tzinfo=timezone.utc) >= five_mins_ago)

        # 4. Relationship Check: Is this a new receiver for this sender?
        prior_tx_to_receiver = sum(1 for tx in history if tx.receiver_upi == receiver_upi)
        is_new_receiver = (prior_tx_to_receiver == 0)

        # 5. Device Intelligence Check
        is_new_device = False
        if device_id:
            user_dev_res = await db.execute(
                select(UserDevice).where(and_(UserDevice.user_id == sender_id, UserDevice.device_id == device_id))
            )
            is_new_device = (user_dev_res.scalar_one_or_none() is None)

        # 6. Location Anomaly Check
        is_location_anomaly = False
        if location and history:
            frequent_locations = {tx.location for tx in history if tx.location}
            if frequent_locations and location not in frequent_locations:
                is_location_anomaly = True

        # 7. Time-of-day circadian check (e.g. 1 AM - 5 AM)
        is_night_transaction = (now.hour >= 1 and now.hour <= 5)

        # 8. Compute Transaction Risk Score (0 - 100)
        tx_risk_score = 0.0
        signals_triggered = []

        # Amount Anomalies
        if amount_ratio_avg >= 5.0 or z_score >= 3.5 or iqr_factor >= 3.0:
            tx_risk_score += 35.0
            signals_triggered.append({
                "code": "AMOUNT_EXTREME_SPIKE",
                "message": f"Transaction amount ₹{amount:,.2f} is {amount_ratio_avg:.1f}x higher than user average (₹{avg_amount:,.2f})",
                "weight": 35.0
            })
        elif amount_ratio_avg >= 2.5 or z_score >= 2.0:
            tx_risk_score += 20.0
            signals_triggered.append({
                "code": "AMOUNT_DEVIATION",
                "message": f"Amount is significantly elevated ({amount_ratio_avg:.1f}x normal baseline)",
                "weight": 20.0
            })

        # Velocity Anomalies
        if tx_last_5m >= 3:
            tx_risk_score += 25.0
            signals_triggered.append({
                "code": "HIGH_FREQUENCY_BURST",
                "message": f"Rapid payment burst: {tx_last_5m} transactions in last 5 minutes",
                "weight": 25.0
            })
        elif tx_last_1h >= 5:
            tx_risk_score += 15.0
            signals_triggered.append({
                "code": "ELEVATED_HOURLY_VELOCITY",
                "message": f"Elevated velocity: {tx_last_1h} transactions in last hour",
                "weight": 15.0
            })

        # Relationship Risk
        if is_new_receiver:
            tx_risk_score += 15.0
            signals_triggered.append({
                "code": "NEW_RECEIVER_ENTITY",
                "message": f"First-time payment to receiver UPI '{receiver_upi}'",
                "weight": 15.0
            })

        # Device Risk
        if is_new_device:
            tx_risk_score += 15.0
            signals_triggered.append({
                "code": "UNRECOGNIZED_DEVICE",
                "message": f"Payment initiated from newly associated device ID '{device_id}'",
                "weight": 15.0
            })

        # Location Risk
        if is_location_anomaly:
            tx_risk_score += 10.0
            signals_triggered.append({
                "code": "GEOGRAPHIC_DEVIATION",
                "message": f"Location '{location}' is outside user's frequent transaction cities",
                "weight": 10.0
            })

        if is_night_transaction:
            tx_risk_score += 5.0
            signals_triggered.append({
                "code": "UNUSUAL_TIME_WINDOW",
                "message": f"Transaction initiated during non-standard circadian hours ({now.strftime('%H:%M')} UTC)",
                "weight": 5.0
            })

        final_tx_score = min(100.0, max(0.0, tx_risk_score))

        return {
            "transaction_risk_score": final_tx_score,
            "amount": amount,
            "z_score": round(z_score, 2),
            "iqr_factor": round(iqr_factor, 2),
            "amount_ratio_avg": round(amount_ratio_avg, 2),
            "amount_ratio_max": round(amount_ratio_max, 2),
            "tx_last_1h": tx_last_1h,
            "tx_last_24h": tx_last_24h,
            "tx_last_5m": tx_last_5m,
            "is_new_receiver": is_new_receiver,
            "is_new_device": is_new_device,
            "is_location_anomaly": is_location_anomaly,
            "is_night_transaction": is_night_transaction,
            "signals": signals_triggered
        }


transaction_engine = TransactionIntelligenceEngine()
