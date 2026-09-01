import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.schema import CallRecord
from app.data.scam_templates import KNOWN_SCAM_PATTERNS


class ScamPatternEngine:
    """
    Module F: Repeated Scam Pattern Engine.
    Uses TF-IDF + cosine similarity to semantically match call transcripts against
    known scam templates and identifies cross-victim serial caller campaigns.
    """

    def __init__(self):
        self.scam_templates = KNOWN_SCAM_PATTERNS
        self.template_texts = [t["narrative"] for t in self.scam_templates]
        self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        # Fit vectorizer on template corpus
        self.vectorizer.fit(self.template_texts)
        self.template_vectors = self.vectorizer.transform(self.template_texts)

    def match_known_patterns(self, transcript: str) -> List[Dict[str, Any]]:
        if not transcript.strip():
            return []

        try:
            query_vec = self.vectorizer.transform([transcript])
            sim_scores = cosine_similarity(query_vec, self.template_vectors)[0]

            matches = []
            for idx, score in enumerate(sim_scores):
                if score >= 0.20:  # Threshold for semantic relevance
                    template = self.scam_templates[idx]
                    matches.append({
                        "pattern_id": template["id"],
                        "category": template["category"],
                        "similarity_score": round(float(score), 3),
                        "matched_narrative_sample": template["narrative"][:120] + "...",
                        "severity": template["severity"]
                    })

            matches.sort(key=lambda x: x["similarity_score"], reverse=True)
            return matches
        except Exception:
            return []

    async def analyze_caller_history(
        self,
        db: AsyncSession,
        caller_number: str,
        current_transcript: str
    ) -> Dict[str, Any]:
        # 1. Match against known scam database
        matched_patterns = self.match_known_patterns(current_transcript)
        top_pattern = matched_patterns[0] if matched_patterns else None
        pattern_confidence = (top_pattern["similarity_score"] * 100.0) if top_pattern else 0.0

        # 2. Query historical calls from this caller number
        calls_res = await db.execute(
            select(CallRecord)
            .where(CallRecord.caller_number == caller_number)
            .order_by(CallRecord.timestamp.desc())
        )
        caller_history = calls_res.scalars().all()

        total_calls = len(caller_history)
        distinct_recipients = len(set(c.recipient_id for c in caller_history if c.recipient_id))
        high_risk_calls = sum(1 for c in caller_history if c.voice_risk_score and c.voice_risk_score >= 60.0)

        # 3. Check for repeated scam narrative across historical calls
        has_repeated_narrative = False
        repeated_confidence = 0.0

        if total_calls >= 2 and current_transcript:
            hist_transcripts = [c.transcript for c in caller_history if c.transcript]
            if hist_transcripts:
                try:
                    all_texts = [current_transcript] + hist_transcripts
                    tfidf_matrix = self.vectorizer.transform(all_texts)
                    sim_matrix = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])[0]
                    max_hist_sim = float(np.max(sim_matrix)) if len(sim_matrix) > 0 else 0.0
                    if max_hist_sim >= 0.40:
                        has_repeated_narrative = True
                        repeated_confidence = max_hist_sim * 100.0
                except Exception:
                    pass

        is_serial_scam_caller = (total_calls >= 3 and distinct_recipients >= 2 and high_risk_calls >= 2)

        return {
            "caller_number": caller_number,
            "total_calls_recorded": total_calls,
            "distinct_victims_targeted": distinct_recipients,
            "high_risk_call_count": high_risk_calls,
            "is_serial_scam_caller": is_serial_scam_caller,
            "matched_patterns": matched_patterns,
            "top_pattern_category": top_pattern["category"] if top_pattern else None,
            "pattern_confidence": round(pattern_confidence, 1),
            "has_repeated_narrative": has_repeated_narrative,
            "repeated_confidence": round(repeated_confidence, 1)
        }


scam_pattern_engine = ScamPatternEngine()
