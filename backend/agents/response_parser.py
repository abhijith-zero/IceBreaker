from pydantic import ValidationError
from models.coaching import CoachingOutput, Metrics
import logging

logger = logging.getLogger(__name__)

def parse_gemini_response(raw: str) -> CoachingOutput:
    # Strip markdown code blocks if Gemini adds them
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        cleaned = "\n".join(lines[1:-1])

    return CoachingOutput.model_validate_json(cleaned)


def make_fallback_response() -> CoachingOutput:
    return CoachingOutput(
        metrics=Metrics(
            talk_ratio_user=0.5,
            questions_asked=0,
            filler_words=[],
            sentiment="neutral",
            anxiety_audio=False,
        )
    )