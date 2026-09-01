import re
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.schema import CallRecord


class VoicePhishingEngine:
    """
    Module E: Detects voice phishing intent, authority impersonation,
    urgency coercion, threats, and unauthorized financial demands from call transcripts.
    """

    INTENT_RULES = [
        {
            "intent": "AUTHORITY_IMPERSONATION",
            "category": "Impersonation",
            "patterns": [
                r"\b(calling from (the )?(bank|sbi|hdfc|icici|rbi|axis|pnb))\b",
                r"\b(bank manager|customs officer|cyber crime|police officer|cbi officer|telecom department|trai)\b",
                r"\b(electricity board|power corporation|income tax department)\b"
            ],
            "weight": 30.0,
            "description": "Financial / Regulatory / Law Enforcement Impersonation"
        },
        {
            "intent": "URGENCY_AND_THREAT",
            "category": "Psychological Coercion",
            "patterns": [
                r"\b(immediately|right now|within (\d+|15|30) minutes|today itself|last chance)\b",
                r"\b(account (will be )?blocked|permanently suspended|sim deactivated|power cut|disconnected)\b",
                r"\b(digital arrest|police team|warrant|fir (will be|registered))\b"
            ],
            "weight": 25.0,
            "description": "Artificial Urgency & Threat of Suspension/Arrest"
        },
        {
            "intent": "FINANCIAL_EXTRACTION_DEMAND",
            "category": "Coercive Payment Demand",
            "patterns": [
                r"\b(transfer (rs|rupees|₹|\d+)|pay (rs|rupees|₹|\d+)|send money|deposit)\b",
                r"\b(verification fee|security deposit|clearance charge|gst charge|unblock fee)\b",
                r"\b(to (this|our) (upi|account|server))\b"
            ],
            "weight": 30.0,
            "description": "Explicit Financial Transfer or Security Deposit Demand"
        },
        {
            "intent": "CREDENTIAL_OR_REMOTE_ACCESS_HARVESTING",
            "category": "Data Compromise",
            "patterns": [
                r"\b(otp|one time password|upi pin|atm pin|cvv|card details|password)\b",
                r"\b(install|download) (anydesk|quicksupport|teamviewer|rustdesk|screen share)\b",
                r"\b(share your screen|enter pin)\b"
            ],
            "weight": 35.0,
            "description": "Coercive Request for OTP, PIN, or Remote Desktop Control"
        },
        {
            "intent": "FAKE_REWARD_OR_JOB_PROMISE",
            "category": "Social Engineering Lure",
            "patterns": [
                r"\b(won (a )?prize|lottery|lucky draw|cash reward|crorepati)\b",
                r"\b(part[- ]time job|rating task|youtube like|telegram task|guaranteed daily income)\b",
                r"\b(order refund|excess payment refund)\b"
            ],
            "weight": 20.0,
            "description": "Fake Prize, Lottery, Refund, or Telegram Job Lure"
        }
    ]

    def analyze_transcript(self, transcript: str) -> Dict[str, Any]:
        text = transcript.lower()
        total_score = 0.0
        detected_intents = []
        indicators = []

        for rule in self.INTENT_RULES:
            matched_snippets = []
            for pattern in rule["patterns"]:
                matches = re.finditer(pattern, text, re.IGNORECASE)
                for match in matches:
                    matched_snippets.append(match.group(0))

            if matched_snippets:
                total_score += rule["weight"]
                detected_intents.append(rule["intent"])
                indicators.append({
                    "intent": rule["intent"],
                    "category": rule["category"],
                    "description": rule["description"],
                    "evidence": list(set(matched_snippets))[:3],
                    "weight": rule["weight"]
                })

        final_voice_score = min(100.0, max(0.0, total_score))

        if final_voice_score >= 80.0:
            risk_level = "CRITICAL"
        elif final_voice_score >= 50.0:
            risk_level = "HIGH"
        elif final_voice_score >= 25.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        return {
            "voice_risk_score": final_voice_score,
            "risk_level": risk_level,
            "detected_intents": detected_intents,
            "indicators": indicators,
            "has_voice_phishing": final_voice_score >= 50.0
        }


voice_engine = VoicePhishingEngine()
