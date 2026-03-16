import logging
from datetime import datetime
from models.session import SessionState
from models.coaching import ScoreBreakdown, Debrief
from services.gemini_analysis_service import GeminiAnalysisService

logger = logging.getLogger(__name__)


class CoachingService:

    def __init__(self):
        self._gemini = GeminiAnalysisService()

    # ── Debrief Generation ────────────────────────────────────

    def generate_debrief(self, session: SessionState, metrics: dict | None = None) -> Debrief:
        # Use tool-call metrics from the Live session if available
        if metrics:
            logger.info("Building debrief from Live session tool-call metrics")
            return self._debrief_from_analysis(metrics, session)

        # Fallback: send transcript to LM Studio for analysis
        transcript_text = getattr(session, "transcript_text", "")
        if transcript_text and transcript_text.strip():
            analysis = self._gemini.analyze_transcript(transcript_text)
            if analysis:
                logger.info("Building debrief from LM Studio analysis")
                return self._debrief_from_analysis(analysis, session)

        logger.warning("No metrics or transcript available — returning empty debrief")
        return self._empty_debrief()

    # ── Build debrief from Gemini analysis ───────────────────

    def _debrief_from_analysis(self, analysis: dict, session: SessionState) -> Debrief:
        score = self._calculate_score_from_analysis(analysis, session)

        strengths   = analysis.get("strengths") or []
        focus_areas = analysis.get("focus_areas") or []

        if not strengths:
            strengths = ["You showed up and practiced — that takes courage"]
        if not focus_areas:
            focus_areas = ["Keep practicing to build confidence"]

        sentiment  = analysis.get("sentiment", "neutral")
        confidence = round(float(analysis.get("voice_confidence", 0.5)), 2)

        return Debrief(
            score=score,
            strengths=strengths[:3],
            focus_areas=focus_areas[:3],
            sentiment_arc=[sentiment],
            confidence_arc=[confidence],
        )

    def _calculate_score_from_analysis(self, analysis: dict, session: SessionState) -> ScoreBreakdown:
        # ── Talk Ratio (20pts) ────────────────────────────────
        avg_talk = float(analysis.get("talk_ratio_user", 0.5))
        if 0.40 <= avg_talk <= 0.55:
            talk_score = 20.0
        elif 0.30 <= avg_talk < 0.40 or 0.55 < avg_talk <= 0.65:
            talk_score = 14.0
        else:
            talk_score = 7.0

        # ── Questions Asked (20pts) ───────────────────────────
        total_questions = int(analysis.get("questions_asked", 0))
        minutes         = self._minutes_elapsed(session)
        ideal           = max(1, int(minutes / 2))
        question_score  = min(20.0, (total_questions / ideal) * 20)

        # ── Filler Words (15pts) ──────────────────────────────
        total_fillers = int(analysis.get("filler_words", 0))
        total_words   = max(total_questions * 30, 30)
        filler_ratio  = total_fillers / total_words
        if filler_ratio < 0.03:
            filler_score = 15.0
        elif filler_ratio < 0.07:
            filler_score = 10.0
        else:
            filler_score = 5.0

        # ── Voice Confidence + Eye Contact / Posture (15pts) ─────
        confidence   = float(analysis.get("voice_confidence", 0.5))
        eye_contact  = float(analysis.get("eye_contact", 0.5))
        posture_map  = {"upright": 1.0, "tense": 0.6, "slouched": 0.3}
        posture_mult = posture_map.get(analysis.get("posture", "upright"), 0.7)
        posture_score = round(((confidence + eye_contact) / 2 * posture_mult) * 15, 1)

        # ── Sentiment Trend (15pts) ───────────────────────────
        sentiment_map   = {"warming": 15.0, "neutral": 10.0, "cooling": 5.0}
        sentiment_score = sentiment_map.get(analysis.get("sentiment", "neutral"), 10.0)

        # ── Recovery / Anxiety (15pts) ────────────────────────
        anxious        = bool(analysis.get("anxiety_audio", False))
        recovery_score = 10.0 if anxious else 15.0

        total = round(
            talk_score + question_score + filler_score +
            posture_score + sentiment_score + recovery_score, 1
        )

        return ScoreBreakdown(
            talk_ratio=talk_score,
            questions_asked=question_score,
            filler_words=filler_score,
            posture_confidence=posture_score,
            sentiment_trend=sentiment_score,
            recovery_moments=recovery_score,
            total=min(total, 100.0),
        )

    # ── Empty fallback ────────────────────────────────────────

    def _empty_debrief(self) -> Debrief:
        return Debrief(
            score=ScoreBreakdown(
                talk_ratio=10,
                questions_asked=10,
                filler_words=10,
                posture_confidence=7.5,
                sentiment_trend=10,
                recovery_moments=10,
                total=57.5,
            ),
            strengths=["You completed a practice session — that takes courage"],
            focus_areas=["Keep practicing to get more detailed feedback"],
            sentiment_arc=["neutral"],
            confidence_arc=[0.5],
        )

    def _minutes_elapsed(self, session: SessionState) -> float:
        return (datetime.now().timestamp() - session.start_time) / 60