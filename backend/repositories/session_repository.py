import logging
from core.config import get_settings
from models.coaching import Debrief

logger = logging.getLogger(__name__)


class SessionRepository:
    """
    Only class that talks to Firestore for session data.
    Uses lazy initialization — Firestore client created on first use,
    not at import time, to avoid credential errors on startup.
    """

    def __init__(self):
        self._db = None

    @property
    def db(self):
        if self._db is None:
            from google.cloud import firestore
            settings = get_settings()
            self._db = firestore.AsyncClient(
                project=settings.google_cloud_project
            )
        return self._db

    # ── Write ─────────────────────────────────────────────────

    async def save_session_report(
        self,
        session_id: str,
        user_id: str,
        scenario_id: str,
        debrief: Debrief,
    ) -> None:
        """
        Saves the full session report to Firestore after session ends.
        Written once — never updated after this.
        """
        from google.cloud import firestore as fs

        settings = get_settings()

        doc = {
            "session_id": session_id,
            "user_id": user_id,
            "scenario_id": scenario_id,
            "score": debrief.score.model_dump(),
            "strengths": debrief.strengths,
            "focus_areas": debrief.focus_areas,
            "sentiment_arc": debrief.sentiment_arc,
            "confidence_arc": debrief.confidence_arc,
            "created_at": fs.SERVER_TIMESTAMP,
        }

        await self.db \
            .collection(settings.firestore_collection_sessions) \
            .document(session_id) \
            .set(doc)

        logger.info(f"Session saved to Firestore | id: {session_id}")

    # ── Read ──────────────────────────────────────────────────

    async def get_session_report(self, session_id: str) -> dict | None:
        """
        Fetches a session report by session_id.
        Returns None if not found.
        """
        settings = get_settings()

        doc = await self.db \
            .collection(settings.firestore_collection_sessions) \
            .document(session_id) \
            .get()

        if not doc.exists:
            logger.warning(f"Session not found in Firestore | id: {session_id}")
            return None

        return doc.to_dict()