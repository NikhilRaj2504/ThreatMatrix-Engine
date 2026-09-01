from typing import Dict, Any
from app.config import settings


class DecisionPolicyEngine:
    """
    Module L: Decision / Policy Engine.
    Converts fused continuous risk scores into actionable governance decisions
    and determines client-side friction (Allow, Monitor, Warn+Confirm).
    """

    def evaluate_policy(self, final_risk_score: float) -> Dict[str, Any]:
        score = float(final_risk_score)

        if score < settings.THRESHOLD_LOW:
            risk_level = "LOW"
            action = "ALLOW"
            requires_user_confirmation = False
            user_warning_title = "Safe Payment"
            guidance = "No elevated risk factors detected. Transaction processed immediately."
        elif score < settings.THRESHOLD_MEDIUM:
            risk_level = "MEDIUM"
            action = "MONITOR"
            requires_user_confirmation = False
            user_warning_title = "Payment Monitored"
            guidance = "Minor anomaly noted. Proceeding with silent backend monitoring."
        elif score < settings.THRESHOLD_HIGH:
            risk_level = "HIGH"
            action = "WARN_CONFIRM"
            requires_user_confirmation = True
            user_warning_title = "⚠️ High Risk Payment Warning"
            guidance = "Unusual payment pattern or unverified receiver detected. Please confirm this payment before proceeding."
        else:
            risk_level = "CRITICAL"
            action = "STRONG_WARN_CONFIRM"
            requires_user_confirmation = True
            user_warning_title = "🚨 CRITICAL FRAUD ALERT — High Probability Scam"
            guidance = "Strong indicators of social engineering, voice phishing, or money mule syndicate detected. Extreme caution advised."

        return {
            "risk_level": risk_level,
            "recommended_action": action,
            "requires_user_confirmation": requires_user_confirmation,
            "user_warning_title": user_warning_title,
            "guidance": guidance
        }


decision_engine = DecisionPolicyEngine()
