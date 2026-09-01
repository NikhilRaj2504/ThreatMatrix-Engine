import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.services.transaction_engine import transaction_engine
from app.services.entity_engine import entity_engine
from app.services.voice_engine import voice_engine
from app.services.scam_pattern_engine import scam_pattern_engine
from app.services.network_engine import network_engine
from app.services.explainability import explainability_engine
from app.services.decision_engine import decision_engine
from app.ml.model import ml_service
from app.models.schema import RiskAssessment, RiskReason, Transaction, CallRecord


class UnifiedRiskEngine:
    """
    Primary Risk Fusion Engine combining Rule Engine (Layer 1),
    Supervised ML Model (Layer 2), Entity Behavioral Profiler,
    Voice Phishing Intent, and Graph Network Analytics.
    """

    async def analyze_combined(
        self,
        db: AsyncSession,
        sender_id: str,
        receiver_upi: str,
        amount: float,
        device_id: Optional[str] = "DEV100",
        location: Optional[str] = "Mumbai",
        description: Optional[str] = "Payment",
        caller_number: Optional[str] = None,
        call_transcript: Optional[str] = None,
        audio_path: Optional[str] = None,
        save_records: bool = True
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        all_signals: List[Dict[str, Any]] = []

        # 1. Module A: Transaction Intelligence
        tx_result = await transaction_engine.analyze(
            db=db,
            sender_id=sender_id,
            receiver_upi=receiver_upi,
            amount=amount,
            device_id=device_id,
            location=location,
            tx_timestamp=now
        )
        all_signals.extend(tx_result["signals"])

        # 2. Module B & C: Entity Intelligence
        entity_result = await entity_engine.analyze(
            db=db,
            receiver_upi=receiver_upi,
            current_amount=amount,
            description=description,
            tx_timestamp=now
        )
        all_signals.extend(entity_result["signals"])

        # 3. Module E & F: Voice Phishing & Scam Pattern Analysis
        voice_result = {
            "voice_risk_score": 0.0,
            "has_voice_phishing": False,
            "detected_intents": [],
            "indicators": []
        }
        scam_pattern_result = {
            "is_serial_scam_caller": False,
            "matched_patterns": [],
            "pattern_confidence": 0.0
        }

        if call_transcript and call_transcript.strip():
            voice_result = voice_engine.analyze_transcript(call_transcript)
            for ind in voice_result["indicators"]:
                all_signals.append({
                    "code": f"VOICE_{ind['intent']}",
                    "message": f"Voice Phishing Signal: {ind['description']} detected ({', '.join(ind['evidence'])})",
                    "weight": ind["weight"]
                })

            if caller_number:
                scam_pattern_result = await scam_pattern_engine.analyze_caller_history(
                    db=db,
                    caller_number=caller_number,
                    current_transcript=call_transcript
                )
                if scam_pattern_result["matched_patterns"]:
                    top_pat = scam_pattern_result["matched_patterns"][0]
                    all_signals.append({
                        "code": "SCAM_PATTERN_NARRATIVE_MATCH",
                        "message": f"Transcript semantically matches known scam campaign '{top_pat['category']}' ({top_pat['similarity_score']*100:.0f}% confidence)",
                        "weight": 25.0
                    })
                if scam_pattern_result["is_serial_scam_caller"]:
                    all_signals.append({
                        "code": "SERIAL_SCAM_CALLER_CAMPAIGN",
                        "message": f"Caller phone '{caller_number}' has made suspicious calls to {scam_pattern_result['distinct_victims_targeted']} distinct targets",
                        "weight": 35.0
                    })

        # 4. Module G: Payment Network Intelligence
        net_result = await network_engine.analyze_transaction_network(
            db=db,
            sender_id=sender_id,
            receiver_upi=receiver_upi,
            caller_number=caller_number,
            device_id=device_id
        )
        all_signals.extend(net_result["signals"])

        # 5. Layer 1: Rule Engine Score
        rule_score = min(100.0, sum(s.get("weight", 0.0) for s in all_signals))

        # 6. Layer 2: Machine Learning Probability
        ml_features = {
            "amount_ratio_avg": tx_result["amount_ratio_avg"],
            "z_score": tx_result["z_score"],
            "iqr_factor": tx_result["iqr_factor"],
            "tx_last_1h": tx_result["tx_last_1h"],
            "tx_last_24h": tx_result["tx_last_24h"],
            "is_new_receiver": tx_result["is_new_receiver"],
            "is_new_device": tx_result["is_new_device"],
            "is_location_anomaly": tx_result["is_location_anomaly"],
            "unique_sender_ratio": entity_result["unique_sender_ratio"],
            "inflow_spike_multiplier": entity_result["inflow_spike_multiplier"],
            "fraud_reports_count": entity_result["fraud_reports_count"],
            "has_voice_phishing": voice_result["has_voice_phishing"],
            "voice_risk_score": voice_result["voice_risk_score"],
            "network_risk_score": net_result["network_risk_score"]
        }
        ml_prob = ml_service.predict_fraud_probability(ml_features)

        # 7. Layer 3: Risk Fusion Formula
        w_rule = settings.WEIGHT_RULE
        w_ml = settings.WEIGHT_ML
        w_entity = settings.WEIGHT_ENTITY
        w_voice = settings.WEIGHT_VOICE
        w_net = settings.WEIGHT_NETWORK

        raw_fused_score = (
            w_rule * rule_score +
            w_ml * (ml_prob * 100.0) +
            w_entity * entity_result["entity_risk_score"] +
            w_voice * voice_result["voice_risk_score"] +
            w_net * net_result["network_risk_score"]
        )

        # Compound Amplifiers: Multiple independent high-risk factors
        high_risk_dimensions = 0
        if tx_result["transaction_risk_score"] >= 40.0:
            high_risk_dimensions += 1
        if entity_result["entity_risk_score"] >= 40.0:
            high_risk_dimensions += 1
        if voice_result["voice_risk_score"] >= 40.0:
            high_risk_dimensions += 1
        if net_result["network_risk_score"] >= 40.0:
            high_risk_dimensions += 1

        if high_risk_dimensions >= 3:
            raw_fused_score = max(raw_fused_score, 88.0)
        elif high_risk_dimensions >= 2:
            raw_fused_score = max(raw_fused_score, 68.0)

        final_score = round(min(100.0, max(0.0, raw_fused_score)), 1)

        # 8. Explainability & Policy Decisions
        explanations = explainability_engine.generate_explanations(all_signals, top_k=6)
        policy = decision_engine.evaluate_policy(final_score)

        assessment_id = f"RSK_{uuid.uuid4().hex[:12].upper()}"
        tx_id = f"TXN_{uuid.uuid4().hex[:12].upper()}"
        call_id = f"CAL_{uuid.uuid4().hex[:12].upper()}" if call_transcript else None

        # 9. Persist into Database if required
        if save_records:
            # Create transaction record
            db_tx = Transaction(
                id=tx_id,
                sender_id=sender_id,
                receiver_upi=receiver_upi,
                device_id=device_id,
                amount=amount,
                location=location or "Unknown",
                description=description or "Payment",
                timestamp=now,
                status="COMPLETED" if policy["risk_level"] in ["LOW", "MEDIUM"] else "PENDING"
            )
            db.add(db_tx)

            # Create call record if present
            if call_id and caller_number:
                db_call = CallRecord(
                    id=call_id,
                    caller_number=caller_number,
                    recipient_id=sender_id,
                    transcript=call_transcript,
                    audio_path=audio_path,
                    voice_risk_score=voice_result["voice_risk_score"],
                    detected_intents=str(voice_result["detected_intents"]),
                    timestamp=now
                )
                db.add(db_call)

            # Create risk assessment
            db_assessment = RiskAssessment(
                id=assessment_id,
                transaction_id=tx_id,
                call_record_id=call_id,
                final_risk_score=final_score,
                risk_level=policy["risk_level"],
                recommended_action=policy["recommended_action"],
                rule_score=round(rule_score, 1),
                ml_probability=round(ml_prob, 4),
                voice_score=round(voice_result["voice_risk_score"], 1),
                entity_score=round(entity_result["entity_risk_score"], 1),
                network_score=round(net_result["network_risk_score"], 1),
                created_at=now
            )
            db.add(db_assessment)

            # Create risk reasons
            for exp in explanations:
                db_reason = RiskReason(
                    id=f"RSN_{uuid.uuid4().hex[:10].upper()}",
                    assessment_id=assessment_id,
                    code=exp["code"],
                    message=exp["message"],
                    severity_weight=exp["severity_weight"],
                    rank_order=exp["rank_order"]
                )
                db.add(db_reason)

            await db.commit()

        return {
            "assessment_id": assessment_id,
            "transaction_id": tx_id,
            "call_record_id": call_id,
            "final_risk_score": final_score,
            "risk_level": policy["risk_level"],
            "recommended_action": policy["recommended_action"],
            "requires_user_confirmation": policy["requires_user_confirmation"],
            "user_warning_title": policy["user_warning_title"],
            "guidance": policy["guidance"],
            "reasons": explanations,
            "scores_breakdown": {
                "final_risk_score": final_score,
                "transaction_risk": round(tx_result["transaction_risk_score"], 1),
                "entity_risk": round(entity_result["entity_risk_score"], 1),
                "voice_risk": round(voice_result["voice_risk_score"], 1),
                "network_risk": round(net_result["network_risk_score"], 1),
                "rule_score": round(rule_score, 1),
                "ml_probability": round(ml_prob, 4)
            },
            "detailed_signals": {
                "transaction": tx_result,
                "entity": entity_result,
                "voice": voice_result,
                "scam_pattern": scam_pattern_result,
                "network": net_result
            },
            "timestamp": now.isoformat()
        }


risk_engine = UnifiedRiskEngine()
