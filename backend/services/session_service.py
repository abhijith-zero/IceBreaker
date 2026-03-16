import logging
import uuid
from datetime import datetime
from models.session import SessionState, MetricsSnapshot, TranscriptEntry
from models.coaching import Debrief
from services.coaching_service import CoachingService

logger = logging.getLogger(__name__)


class SessionService:
    """
    Manages session state lifecycle.
    No longer owns the Gemini connection — browser does that directly.
    Receives lightweight turn summaries via REST and tracks metrics.
    """

    def __init__(self):
        self.coaching_service = CoachingService()
        # Active sessions held in memory keyed by session_id
        self._sessions: dict[str, SessionState] = {}

    # ── Session Lifecycle ─────────────────────────────────────

    def create_session(
        self,
        scenario_id: str,
        user_id: str,
    ) -> SessionState:
        """
        Creates and stores a new session in memory.
        Called when browser calls POST /sessions/start.
        """
        session_id = str(uuid.uuid4())
        session = SessionState(
            session_id=session_id,
            user_id=user_id,
            scenario_id=scenario_id,
        )
        self._sessions[session_id] = session
        logger.info(
            f"Session created | id: {session_id} | scenario: {scenario_id}"
        )
        return session

    def record_turn(
        self,
        session_id: str,
        user_text: str,
        ai_text: str,
        metrics: dict,
        tip_shown: str | None = None,
    ) -> None:
        """
        Records a completed turn into session state.
        Called after each browser <-> Gemini exchange.
        Receives a lightweight summary — NOT raw audio.
        """
        session = self._get_session(session_id)
        now = datetime.now().timestamp()

        # Append transcript entries
        session.transcript.append(
            TranscriptEntry(
                speaker="user",
                text=user_text,
                timestamp=now,
                tip_shown=tip_shown,
            )
        )
        session.transcript.append(
            TranscriptEntry(
                speaker="ai",
                text=ai_text,
                timestamp=now,
            )
        )

        # Snapshot metrics for this turn
        snapshot = MetricsSnapshot(
            timestamp=now,
            talk_ratio_user=float(metrics.get("talk_ratio_user", 0.5)),
            questions_asked=int(metrics.get("questions_asked", 0)),
            filler_words=metrics.get("filler_words", []),
            sentiment=metrics.get("sentiment", "neutral"),
            anxiety_audio=bool(metrics.get("anxiety_audio", False)),
            speech_pace=metrics.get("speech_pace", "normal"),
            voice_confidence=float(metrics.get("voice_confidence", 0.5)),
            eye_contact=float(metrics.get("eye_contact", 0.5)),
            posture=metrics.get("posture", "upright"),
            expression=metrics.get("expression", "neutral"),
            engagement_score=float(metrics.get("engagement_score", 0.5)),
            tip=metrics.get("tip"),
        )
        session.metrics_snapshots.append(snapshot)
        session.current_metrics = snapshot

        logger.debug(
            f"Turn recorded | session: {session_id} "
            f"| questions: {snapshot.questions_asked} "
            f"| talk_ratio: {snapshot.talk_ratio_user:.2f}"
        )

    def end_session(self, session_id: str) -> Debrief:
        """
        Ends the session and generates the full debrief.
        Cleans up from memory after generating report.
        """
        session = self._get_session(session_id)
        session.is_active = False
        session.end_time = datetime.now().timestamp()
        session.duration = session.end_time - session.start_time

        debrief = self.coaching_service.generate_debrief(session)

        # Remove from active memory
        self._sessions.pop(session_id, None)

        logger.info(
            f"Session ended | id: {session_id} "
            f"| score: {debrief.score.total} "
            f"| turns: {len(session.transcript) // 2}"
        )
        return debrief

    # ── Getters ───────────────────────────────────────────────

    def get_session(self, session_id: str) -> SessionState | None:
        return self._sessions.get(session_id)

    def _get_session(self, session_id: str) -> SessionState:
        session = self._sessions.get(session_id)
        if not session:
            from core.exceptions import SessionNotFoundException
            raise SessionNotFoundException(session_id)
        return session