from fastapi import APIRouter
from pydantic import BaseModel
from repositories.progress_repository import ProgressRepository
from repositories.session_repository import SessionRepository
from services.session_service import SessionService
from api.schemas.session_schemas import (
    StartSessionRequest,
    StartSessionResponse,
    RecordTurnRequest,
    RecordTurnResponse,
    EndSessionResponse,
)
from core.exceptions import SessionNotFoundException

router = APIRouter(prefix="/sessions")

session_service = SessionService()
session_repo    = SessionRepository()
progress_repo   = ProgressRepository()


class EndSessionRequest(BaseModel):
    transcript: str = ""


@router.post("/start", response_model=StartSessionResponse)
async def start_session(body: StartSessionRequest):
    session = session_service.create_session(
        scenario_id=body.scenario_id,
        user_id=body.user_id,
    )
    return StartSessionResponse(
        session_id=session.session_id,
        scenario_id=session.scenario_id,
        user_id=session.user_id,
    )


@router.post("/{session_id}/turn", response_model=RecordTurnResponse)
async def record_turn(session_id: str, body: RecordTurnRequest):
    session_service.record_turn(
        session_id=session_id,
        user_text=body.user_text,
        ai_text=body.ai_text,
        metrics=body.metrics.model_dump(),
        tip_shown=body.tip_shown,
    )
    session    = session_service.get_session(session_id)
    turn_count = len(session.transcript) // 2 if session else 0
    return RecordTurnResponse(recorded=True, turn_count=turn_count)


@router.post("/{session_id}/end", response_model=EndSessionResponse)
async def end_session(session_id: str, body: EndSessionRequest = None):
    session = session_service.get_session(session_id)
    if not session:
        raise SessionNotFoundException(session_id)

    user_id     = session.user_id
    scenario_id = session.scenario_id

    # Attach transcript to session so coaching service can use it
    transcript = body.transcript if body else ""
    if transcript:
        session.transcript_text = transcript

    debrief = session_service.end_session(session_id)

    await session_repo.save_session_report(
        session_id=session_id,
        user_id=user_id,
        scenario_id=scenario_id,
        debrief=debrief,
    )

    await progress_repo.save_session_summary(
        user_id=user_id,
        session_id=session_id,
        scenario_id=scenario_id,
        score=debrief.score.total,
    )

    return EndSessionResponse(
        session_id=session_id,
        debrief=debrief,
    )


@router.get("/{session_id}/report")
async def get_session_report(session_id: str):
    report = await session_repo.get_session_report(session_id)
    if not report:
        raise SessionNotFoundException(session_id)
    return report