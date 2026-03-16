from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime


@dataclass
class MetricsSnapshot:
    timestamp: float
    talk_ratio_user: float
    questions_asked: int
    filler_words: list[str]
    sentiment: str
    anxiety_audio: bool
    speech_pace: str = "normal"
    voice_confidence: float = 0.5
    eye_contact: float = 0.5
    posture: str = "upright"
    expression: str = "neutral"
    engagement_score: float = 0.5
    tip: Optional[str] = None


@dataclass
class TranscriptEntry:
    speaker: str
    text: str
    timestamp: float
    tip_shown: Optional[str] = None


@dataclass
class SessionState:
    session_id: str
    user_id: str
    scenario_id: str
    start_time: float = field(
        default_factory=lambda: datetime.now().timestamp()
    )
    transcript: list[TranscriptEntry] = field(default_factory=list)
    metrics_snapshots: list[MetricsSnapshot] = field(default_factory=list)
    current_metrics: Optional[MetricsSnapshot] = None
    is_active: bool = True
    transcript_text: str = ""
    end_time: Optional[float] = None
    duration: Optional[float] = None
