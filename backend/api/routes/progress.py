from fastapi import APIRouter
from repositories.progress_repository import ProgressRepository

router = APIRouter(prefix="/users")

progress_repo = ProgressRepository()


@router.get("/{user_id}/progress")
async def get_user_progress(user_id: str):
    """
    Returns all session summaries for a user, newest first.
    Powers the progress dashboard on the frontend.
    """
    summaries = await progress_repo.get_user_progress(user_id)
    return {
        "user_id": user_id,
        "sessions": summaries,
        "total_sessions": len(summaries),
        "average_score": (
            round(sum(s["score"] for s in summaries) / len(summaries), 1)
            if summaries else 0
        ),
    }
