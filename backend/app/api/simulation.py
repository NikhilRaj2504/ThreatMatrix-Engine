from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List

from app.db.database import get_db
from app.services.risk_engine import risk_engine

router = APIRouter(prefix="/simulation", tags=["Demo Simulation Workbench"])

DEMO_SCENARIOS = [
    {
        "id": "scenario_1_safe",
        "title": "Scenario 1 — Safe Everyday Payment",
        "badge": "LOW RISK",
        "badge_color": "green",
        "description": "Legitimate payment of ₹850 to a verified supermarket merchant from a known device.",
        "payload": {
            "transaction": {
                "sender_id": "U101",
                "receiver_upi": "dmart.retail@axis",
                "amount": 850.0,
                "device_id": "DEV_S23_01",
                "location": "Mumbai",
                "description": "Grocery shopping"
            },
            "call": None
        },
        "expected": {
            "score_range": "0–25",
            "level": "LOW",
            "action": "ALLOW"
        }
    },
    {
        "id": "scenario_2_unusual_amount",
        "title": "Scenario 2 — High Amount & New Device Anomaly",
        "badge": "HIGH RISK",
        "badge_color": "amber",
        "description": "Sudden ₹48,000 payment (40x normal average) to an unverified new receiver from an unfamiliar device.",
        "payload": {
            "transaction": {
                "sender_id": "U101",
                "receiver_upi": "crypto.trader99@okhdfcbank",
                "amount": 48000.0,
                "device_id": "DEV_ROG_99",
                "location": "Kolkata",
                "description": "Investment deposit"
            },
            "call": None
        },
        "expected": {
            "score_range": "65–78",
            "level": "HIGH",
            "action": "WARN_CONFIRM"
        }
    },
    {
        "id": "scenario_3_voice_phishing",
        "title": "Scenario 3 — Voice Phishing / Fake Bank KYC Call",
        "badge": "CRITICAL RISK",
        "badge_color": "rose",
        "description": "Incoming scam call from fake bank manager threatening immediate account suspension.",
        "payload": {
            "transaction": {
                "sender_id": "U102",
                "receiver_upi": "kyc.verification.desk@ybl",
                "amount": 25000.0,
                "device_id": "DEV_S23_01",
                "location": "Bengaluru",
                "description": "KYC unblock fee"
            },
            "call": {
                "caller_number": "+919876500111",
                "recipient_id": "U102",
                "transcript": "Sir I am calling from bank KYC branch. Your bank account and UPI are suspended immediately. Transfer 25000 rupees right now to our verification server to unblock your account."
            }
        },
        "expected": {
            "score_range": "85–94",
            "level": "CRITICAL",
            "action": "STRONG_WARN_CONFIRM"
        }
    },
    {
        "id": "scenario_4_mule_entity",
        "title": "Scenario 4 — Money Mule Receiver Ring",
        "badge": "HIGH ENTITY RISK",
        "badge_color": "purple",
        "description": "Payment directed to a 14-day old UPI entity that has received bursts of money from 85 distinct individuals.",
        "payload": {
            "transaction": {
                "sender_id": "U103",
                "receiver_upi": "quick.fast.cash@paytm",
                "amount": 18000.0,
                "device_id": "DEV_PIXEL_02",
                "location": "Bhubaneswar",
                "description": "Telegram task task refund"
            },
            "call": None
        },
        "expected": {
            "score_range": "82–92",
            "level": "CRITICAL",
            "action": "STRONG_WARN_CONFIRM"
        }
    },
    {
        "id": "scenario_5_combined_scam",
        "title": "Scenario 5 — Full Combined Phishing & Mule Attack (Flagship)",
        "badge": "CRITICAL 96+",
        "badge_color": "red",
        "description": "Digital Arrest scam call + High amount + Mule receiver + Unrecognized device + Graph syndicate links.",
        "payload": {
            "transaction": {
                "sender_id": "U101",
                "receiver_upi": "quick.fast.cash@paytm",
                "amount": 50000.0,
                "device_id": "DEV_ROG_99",
                "location": "Bhubaneswar",
                "description": "Customs clearance deposit"
            },
            "call": {
                "caller_number": "+919876500111",
                "recipient_id": "U101",
                "transcript": "This is Officer Sharma from Cyber Crime and Customs Department. A parcel with fake passports has been intercepted in your name. You are under digital arrest. Transfer 50000 rupees security deposit immediately to this RBI clearance UPI or police will arrive."
            }
        },
        "expected": {
            "score_range": "95–100",
            "level": "CRITICAL",
            "action": "STRONG_WARN_CONFIRM"
        }
    }
]


@router.get("/scenarios")
async def get_scenarios():
    return DEMO_SCENARIOS


@router.post("/run-scenario/{scenario_id}")
async def run_scenario(
    scenario_id: str,
    db: AsyncSession = Depends(get_db)
):
    scen = next((s for s in DEMO_SCENARIOS if s["id"] == scenario_id), None)
    if not scen:
        raise HTTPException(status_code=404, detail="Scenario not found")

    payload = scen["payload"]
    tx = payload["transaction"]
    call = payload.get("call")

    result = await risk_engine.analyze_combined(
        db=db,
        sender_id=tx["sender_id"],
        receiver_upi=tx["receiver_upi"],
        amount=tx["amount"],
        device_id=tx["device_id"],
        location=tx["location"],
        description=tx["description"],
        caller_number=call["caller_number"] if call else None,
        call_transcript=call["transcript"] if call else None,
        save_records=True
    )

    return {
        "scenario": scen,
        "engine_output": result
    }
