from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.db.database import get_db
from app.schemas.pydantic_models import (
    TransactionInput,
    CallInput,
    CombinedRiskInput,
    RiskAssessmentOutput,
    VoiceAnalysisOutput
)
from app.services.risk_engine import risk_engine
from app.services.voice_engine import voice_engine
from app.services.scam_pattern_engine import scam_pattern_engine

router = APIRouter(prefix="/risk", tags=["Risk Analysis Engine"])


@router.post("/analyze-transaction")
async def analyze_transaction(
    payload: TransactionInput,
    db: AsyncSession = Depends(get_db)
):
    """
    Module A / B / C / D / G: Evaluates payment transaction anomalies, receiver profile,
    device context, and network graph risks.
    """
    result = await risk_engine.analyze_combined(
        db=db,
        sender_id=payload.sender_id,
        receiver_upi=payload.receiver_upi,
        amount=payload.amount,
        device_id=payload.device_id,
        location=payload.location,
        description=payload.description,
        save_records=True
    )
    return result


@router.post("/analyze-call")
async def analyze_call(
    payload: CallInput,
    db: AsyncSession = Depends(get_db)
):
    """
    Module E & F: Evaluates call transcript for voice phishing intent, authority impersonation,
    and cross-victim repeated scam patterns.
    """
    voice_res = voice_engine.analyze_transcript(payload.transcript)
    pattern_res = await scam_pattern_engine.analyze_caller_history(
        db=db,
        caller_number=payload.caller_number,
        current_transcript=payload.transcript
    )

    indicators_text = [ind["description"] for ind in voice_res["indicators"]]
    if pattern_res["matched_patterns"]:
        indicators_text.append(f"Semantic match with {pattern_res['top_pattern_category']} narrative")
    if pattern_res["is_serial_scam_caller"]:
        indicators_text.append(f"Serial caller identified ({pattern_res['distinct_victims_targeted']} targeted victims)")

    return {
        "caller_number": payload.caller_number,
        "voice_risk_score": voice_res["voice_risk_score"],
        "risk_level": voice_res["risk_level"],
        "detected_intents": voice_res["detected_intents"],
        "matched_scam_narratives": pattern_res["matched_patterns"],
        "pattern_confidence": pattern_res["pattern_confidence"],
        "indicators": indicators_text,
        "raw_indicators": voice_res["indicators"],
        "caller_stats": pattern_res
    }


@router.post("/analyze-combined")
async def analyze_combined(
    payload: CombinedRiskInput,
    db: AsyncSession = Depends(get_db)
):
    """
    Unified Multi-Signal Endpoint: Ingests transaction parameters and caller/transcript data
    simultaneously to produce fused 0-100 risk score, explainable reasons, and policy actions.
    """
    caller_num = payload.call.caller_number if payload.call else None
    transcript = payload.call.transcript if payload.call else None
    audio_path = payload.call.audio_path if payload.call else None

    result = await risk_engine.analyze_combined(
        db=db,
        sender_id=payload.transaction.sender_id,
        receiver_upi=payload.transaction.receiver_upi,
        amount=payload.transaction.amount,
        device_id=payload.transaction.device_id,
        location=payload.transaction.location,
        description=payload.transaction.description,
        caller_number=caller_num,
        call_transcript=transcript,
        audio_path=audio_path,
        save_records=True
    )
    return result
