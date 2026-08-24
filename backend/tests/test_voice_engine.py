from app.services.voice_engine import voice_engine


def test_voice_phishing_detection():
    transcript = "Sir I am calling from bank headquarters. Your KYC has expired today. Transfer 20000 immediately or account will be blocked."
    result = voice_engine.analyze_transcript(transcript)

    assert result["voice_risk_score"] >= 70.0
    assert result["has_voice_phishing"] is True
    assert "AUTHORITY_IMPERSONATION" in result["detected_intents"]
    assert "URGENCY_AND_THREAT" in result["detected_intents"]
    assert "FINANCIAL_EXTRACTION_DEMAND" in result["detected_intents"]


def test_safe_call_transcript():
    safe_transcript = "Hello, I am calling to confirm your food delivery at Flat 402."
    result = voice_engine.analyze_transcript(safe_transcript)

    assert result["voice_risk_score"] < 30.0
    assert result["has_voice_phishing"] is False
