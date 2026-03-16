from pydantic import BaseModel
from typing import Optional
from models.coaching import Debrief, Metrics


# ── POST /sessions/start ──────────────────────────────────────

class StartSessionRequest(BaseModel):
    scenario_id: str
    user_id: str = "anonymous"


class StartSessionResponse(BaseModel):
    session_id: str
    scenario_id: str
    user_id: str


# ── POST /sessions/{id}/turn ──────────────────────────────────

class RecordTurnRequest(BaseModel):
    user_text: str
    ai_text: str
    metrics: Metrics
    tip_shown: Optional[str] = None


class RecordTurnResponse(BaseModel):
    recorded: bool
    turn_count: int


# ── POST /sessions/{id}/end ───────────────────────────────────

class EndSessionResponse(BaseModel):
    session_id: str
    debrief: Debrief


# ── GET /sessions/{id}/report ─────────────────────────────────

class SessionReportResponse(BaseModel):
    session_id: str
    debrief: Debrief