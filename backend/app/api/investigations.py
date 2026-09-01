from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime, timezone

from app.db.database import get_db
from app.models.schema import (
    RiskAssessment,
    RiskReason,
    Transaction,
    UserConfirmation,
    AnalystReview,
    FraudReport,
    UpiEntity
)
from app.schemas.pydantic_models import (
    UserConfirmationInput,
    AnalystReviewInput,
    FraudReportInput
)

router = APIRouter(tags=["Case Investigations & Feedback Loop"])


@router.get("/investigations/cases")
async def get_investigation_cases(
    limit: int = Query(30, ge=1, le=100),
    verdict_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(RiskAssessment).order_by(RiskAssessment.created_at.desc()).limit(limit)
    res = await db.execute(query)
    assessments = res.scalars().all()

    cases = []
    for a in assessments:
        # Fetch reasons
        reasons_res = await db.execute(
            select(RiskReason).where(RiskReason.assessment_id == a.id).order_by(RiskReason.rank_order)
        )
        reasons = reasons_res.scalars().all()

        # Fetch transaction
        tx_res = await db.execute(select(Transaction).where(Transaction.id == a.transaction_id))
        tx = tx_res.scalar_one_or_none()

        # Fetch user confirmation
        conf_res = await db.execute(select(UserConfirmation).where(UserConfirmation.assessment_id == a.id))
        conf = conf_res.scalar_one_or_none()

        # Fetch analyst review
        rev_res = await db.execute(select(AnalystReview).where(AnalystReview.assessment_id == a.id))
        rev = rev_res.scalar_one_or_none()

        if verdict_filter and (not rev or rev.verdict != verdict_filter):
            continue

        cases.append({
            "assessment_id": a.id,
            "transaction_id": a.transaction_id,
            "sender_id": tx.sender_id if tx else "U102",
            "receiver_upi": tx.receiver_upi if tx else "merchant@upi",
            "amount": tx.amount if tx else 0.0,
            "location": tx.location if tx else "Unknown",
            "risk_score": a.final_risk_score,
            "risk_level": a.risk_level,
            "recommended_action": a.recommended_action,
            "user_decision": conf.user_decision if conf else "PENDING",
            "analyst_verdict": rev.verdict if rev else "UNREVIEWED",
            "analyst_notes": rev.notes if rev else None,
            "reasons": [{"code": r.code, "message": r.message, "weight": r.severity_weight} for r in reasons],
            "scores_breakdown": {
                "rule_score": a.rule_score,
                "ml_probability": a.ml_probability,
                "voice_score": a.voice_score,
                "entity_score": a.entity_score,
                "network_score": a.network_score
            },
            "created_at": a.created_at.isoformat() if a.created_at else None
        })

    return cases


@router.post("/investigations/review")
async def review_case(
    payload: AnalystReviewInput,
    db: AsyncSession = Depends(get_db)
):
    """
    Records Analyst feedback verdict: CONFIRMED_FRAUD, LEGITIMATE, FALSE_POSITIVE.
    This creates ground truth labels for feedback retraining.
    """
    res = await db.execute(select(AnalystReview).where(AnalystReview.assessment_id == payload.assessment_id))
    existing_rev = res.scalar_one_or_none()

    if existing_rev:
        existing_rev.verdict = payload.verdict
        existing_rev.notes = payload.notes or existing_rev.notes
        existing_rev.reviewed_at = datetime.now(timezone.utc)
    else:
        new_rev = AnalystReview(
            id=f"REV_{uuid.uuid4().hex[:10].upper()}",
            assessment_id=payload.assessment_id,
            analyst_id="ANALYST_SEC_01",
            verdict=payload.verdict,
            notes=payload.notes,
            reviewed_at=datetime.now(timezone.utc)
        )
        db.add(new_rev)

    # Update associated transaction status if confirmed fraud
    assess_res = await db.execute(select(RiskAssessment).where(RiskAssessment.id == payload.assessment_id))
    assess = assess_res.scalar_one_or_none()
    if assess and assess.transaction_id:
        tx_res = await db.execute(select(Transaction).where(Transaction.id == assess.transaction_id))
        tx = tx_res.scalar_one_or_none()
        if tx:
            if payload.verdict == "CONFIRMED_FRAUD":
                tx.status = "BLOCKED"
            elif payload.verdict in ["LEGITIMATE", "FALSE_POSITIVE"]:
                tx.status = "COMPLETED"

    await db.commit()
    return {"status": "success", "assessment_id": payload.assessment_id, "verdict": payload.verdict}


@router.post("/user/confirmation")
async def record_user_confirmation(
    payload: UserConfirmationInput,
    db: AsyncSession = Depends(get_db)
):
    """
    Records whether user cancelled payment or continued after being shown the risk warning modal.
    """
    res = await db.execute(select(UserConfirmation).where(UserConfirmation.assessment_id == payload.assessment_id))
    existing = res.scalar_one_or_none()

    decision_val = "CANCELLED" if payload.decision.upper() in ["CANCEL", "CANCELLED"] else "CONTINUED"

    if existing:
        existing.user_decision = decision_val
        existing.feedback_comment = payload.feedback_comment
        existing.decided_at = datetime.now(timezone.utc)
    else:
        new_conf = UserConfirmation(
            id=f"CNF_{uuid.uuid4().hex[:10].upper()}",
            assessment_id=payload.assessment_id,
            user_decision=decision_val,
            feedback_comment=payload.feedback_comment,
            decided_at=datetime.now(timezone.utc)
        )
        db.add(new_conf)

    # Update transaction status
    assess_res = await db.execute(select(RiskAssessment).where(RiskAssessment.id == payload.assessment_id))
    assess = assess_res.scalar_one_or_none()
    if assess and assess.transaction_id:
        tx_res = await db.execute(select(Transaction).where(Transaction.id == assess.transaction_id))
        tx = tx_res.scalar_one_or_none()
        if tx:
            tx.status = "CANCELLED" if decision_val == "CANCELLED" else "COMPLETED"

    await db.commit()
    return {
        "status": "success",
        "assessment_id": payload.assessment_id,
        "user_decision": decision_val
    }


@router.post("/reports")
async def submit_fraud_report(
    payload: FraudReportInput,
    db: AsyncSession = Depends(get_db)
):
    report_id = f"REP_{uuid.uuid4().hex[:10].upper()}"
    new_report = FraudReport(
        id=report_id,
        reported_upi=payload.reported_upi,
        reported_by_user=payload.reported_by_user,
        category=payload.category,
        description=payload.description,
        loss_amount=payload.loss_amount,
        timestamp=datetime.now(timezone.utc),
        status="CONFIRMED"
    )
    db.add(new_report)

    # Increment entity report count if exists
    ent_res = await db.execute(select(UpiEntity).where(UpiEntity.upi_id == payload.reported_upi))
    entity = ent_res.scalar_one_or_none()
    if entity:
        entity.fraud_reports_count = (entity.fraud_reports_count or 0) + 1
        entity.entity_risk_score = min(100.0, (entity.entity_risk_score or 0.0) + 20.0)

    await db.commit()
    return {"status": "success", "report_id": report_id, "reported_upi": payload.reported_upi}
