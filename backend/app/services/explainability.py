from typing import List, Dict, Any


class ExplainabilityEngine:
    """
    Module K: Explainability Engine.
    Synthesizes and ranks human-interpretable reasons from rule triggers,
    statistical anomalies, NLP intent detectors, and network topological links.
    """

    def generate_explanations(
        self,
        signals: List[Dict[str, Any]],
        top_k: int = 6
    ) -> List[Dict[str, Any]]:
        # Sort signals by severity weight descending
        sorted_signals = sorted(signals, key=lambda x: x.get("weight", 1.0), reverse=True)

        explanations = []
        seen_codes = set()

        rank = 1
        for sig in sorted_signals:
            code = sig.get("code", "ANOMALY")
            if code in seen_codes:
                continue
            seen_codes.add(code)

            explanations.append({
                "code": code,
                "message": sig.get("message", "Suspicious transaction pattern detected"),
                "severity_weight": round(float(sig.get("weight", 1.0)), 1),
                "rank_order": rank
            })
            rank += 1
            if len(explanations) >= top_k:
                break

        if not explanations:
            explanations.append({
                "code": "NORMAL_TRANSACTION_PATTERN",
                "message": "Payment behavior matches user's historical baseline and recognized receiver profile.",
                "severity_weight": 0.0,
                "rank_order": 1
            })

        return explanations


explainability_engine = ExplainabilityEngine()
