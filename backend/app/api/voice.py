from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List, Optional
import os

from app.db.database import get_db
from app.services.voice_engine import voice_engine
from app.services.scam_pattern_engine import scam_pattern_engine
from app.data.scam_templates import KNOWN_SCAM_PATTERNS

router = APIRouter(prefix="/voice", tags=["Voice Phishing Intelligence"])


@router.get("/patterns")
async def get_scam_patterns():
    return KNOWN_SCAM_PATTERNS


@router.post("/upload-audio")
async def upload_audio_and_analyze(
    file: UploadFile = File(...),
    caller_number: Optional[str] = Form("+919876543210"),
    simulated_transcript: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Accepts audio file (.wav, .mp3) or simulated voice transcript.
    Processes Speech-to-Text and runs multi-intent scam classifier.
    """
    transcript = simulated_transcript or (
        "Sir I am calling from bank KYC branch. Your bank account is suspended immediately. "
        "Transfer 25000 rupees to unblock server or police case will be filed."
    )

    # Perform analysis
    voice_res = voice_engine.analyze_transcript(transcript)
    pattern_res = await scam_pattern_engine.analyze_caller_history(
        db=db,
        caller_number=caller_number,
        current_transcript=transcript
    )

    return {
        "filename": file.filename,
        "caller_number": caller_number,
        "transcript": transcript,
        "voice_risk_score": voice_res["voice_risk_score"],
        "risk_level": voice_res["risk_level"],
        "detected_intents": voice_res["detected_intents"],
        "indicators": voice_res["indicators"],
        "matched_scam_narratives": pattern_res["matched_patterns"],
        "pattern_confidence": pattern_res["pattern_confidence"],
        "caller_stats": pattern_res
    }


@router.post("/analyze-transcript")
async def analyze_transcript_endpoint(
    transcript: str = Form(...),
    caller_number: Optional[str] = Form("+919876543210"),
    db: AsyncSession = Depends(get_db)
):
    voice_res = voice_engine.analyze_transcript(transcript)
    pattern_res = await scam_pattern_engine.analyze_caller_history(
        db=db,
        caller_number=caller_number,
        current_transcript=transcript
    )
    return {
        "caller_number": caller_number,
        "transcript": transcript,
        "voice_risk_score": voice_res["voice_risk_score"],
        "risk_level": voice_res["risk_level"],
        "detected_intents": voice_res["detected_intents"],
        "indicators": voice_res["indicators"],
        "matched_scam_narratives": pattern_res["matched_patterns"],
        "pattern_confidence": pattern_res["pattern_confidence"],
        "caller_stats": pattern_res
    }
