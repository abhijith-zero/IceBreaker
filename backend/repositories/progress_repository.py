import logging
from core.config import get_settings

logger = logging.getLogger(__name__)


class ProgressRepository:
    """
    Stores and retrieves lightweight session summaries
    per user for the progress dashboard.
    Uses lazy initialization — Firestore client created on first use.
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

    async def save_session_summary(
        self,
        user_id: str,
        session_id: str,
        scenario_id: str,
        score: float,
    ) -> None:
        """
        Saves a lightweight session summary to the user's history.
        Powers the progress dashboard — not the full debrief.
        """
        from google.cloud import firestore as fs

        settings = get_settings()

        summary = {
            "session_id": session_id,
            "scenario_id": scenario_id,
            "score": score,
            "created_at": fs.SERVER_TIMESTAMP,
        }

        await self.db \
            .collection(settings.firestore_collection_users) \
            .document(user_id) \
            .collection("sessions") \
            .document(session_id) \
            .set(summary)

        logger.info(
            f"Progress summary saved | user: {user_id} "
            f"| session: {session_id} | score: {score}"
        )

    # ── Read ──────────────────────────────────────────────────

    async def get_user_progress(self, user_id: str) -> list[dict]:
        """
        Returns all session summaries for a user, newest first.
        Used to populate the progress dashboard.
        """
        from google.cloud import firestore as fs

        settings = get_settings()

        docs = await self.db \
            .collection(settings.firestore_collection_users) \
            .document(user_id) \
            .collection("sessions") \
            .order_by("created_at", direction=fs.Query.DESCENDING) \
            .get()

        summaries = [doc.to_dict() for doc in docs]

        logger.info(
            f"Progress fetched | user: {user_id} "
            f"| sessions: {len(summaries)}"
        )
        return summaries