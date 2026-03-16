from pydantic import BaseModel
from typing import Optional

class Metrics(BaseModel):
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

class CoachingOutput(BaseModel):
    metrics: Metrics

class ScoreBreakdown(BaseModel):
    talk_ratio: float            # 0-20
    questions_asked: float       # 0-20
    filler_words: float          # 0-15
    posture_confidence: float    # 0-15
    sentiment_trend: float       # 0-15
    recovery_moments: float      # 0-15
    total: float                 # 0-100

class Debrief(BaseModel):
    score: ScoreBreakdown
    strengths: list[str]
    focus_areas: list[str]
    sentiment_arc: list[str]
    confidence_arc: list[float]