import json
import logging
import re
# import time
# from google import genai
from openai import OpenAI

from core.config import get_settings

logger = logging.getLogger(__name__)

_ANALYSIS_PROMPT = """
You are an expert communication coach. Analyze this networking conversation transcript and return a JSON object with metrics.

Transcript:
{transcript}

Return ONLY valid JSON with this exact structure:
{{
  "talk_ratio_user": <0.0-1.0, fraction of conversation the user contributed>,
  "questions_asked": <integer, number of open-ended questions the user asked>,
  "filler_words": <integer, count of filler words like um/uh/like the user used>,
  "sentiment": <"warming"/"neutral"/"cooling" — overall rapport trend>,
  "anxiety_audio": <true/false, did the user seem nervous based on their language>,
  "speech_pace": <"slow"/"normal"/"fast">,
  "voice_confidence": <0.0-1.0, how confident the user sounded>,
  "engagement_score": <0.0-1.0, how engaged the conversation was>,
  "strengths": [<up to 3 short strings describing what the user did well>],
  "focus_areas": [<up to 3 short strings describing what to improve>]
}}

Base every value on evidence from the transcript. Be honest but encouraging.
"""


class GeminiAnalysisService:
    def __init__(self):
        settings = get_settings()
        # ── LM Studio (local OpenAI-compatible server) ──────────────
        self._client = OpenAI(
            base_url=settings.lm_studio_url,
            api_key="lm-studio",  # LM Studio ignores the key but requires a non-empty value
        )
        self._model = settings.lm_studio_model

        # ── Gemini (commented out — daily quota exhausted) ──────────
        # self._client = genai.Client(api_key=settings.gemini_api_key)

    def analyze_transcript(self, transcript: str) -> dict | None:
        if not transcript or not transcript.strip():
            return None

        prompt = _ANALYSIS_PROMPT.format(transcript=transcript)

        # ── LM Studio path ───────────────────────────────────────────
        try:
            response = self._client.chat.completions.create(
                model=self._model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
            )
            text = response.choices[0].message.content.strip()
            text = re.sub(r"^```json\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
            data = json.loads(text)
            logger.info("LM Studio transcript analysis succeeded")
            return data
        except Exception as e:
            logger.error(f"LM Studio transcript analysis failed: {e}")
            return None

        # ── Gemini path (commented out — daily quota exhausted) ──────
        # for attempt in range(3):
        #     try:
        #         response = self._client.models.generate_content(
        #             model="gemini-2.0-flash",
        #             contents=prompt,
        #         )
        #         text = response.text.strip()
        #         text = re.sub(r"^```json\s*", "", text)
        #         text = re.sub(r"\s*```$", "", text)
        #         data = json.loads(text)
        #         logger.info("Gemini transcript analysis succeeded")
        #         return data
        #     except Exception as e:
        #         msg = str(e)
        #         if "429" in msg and attempt < 2:
        #             wait = 10 * (attempt + 1)
        #             logger.warning(f"Rate limited, retrying in {wait}s (attempt {attempt + 1})")
        #             time.sleep(wait)
        #         else:
        #             logger.error(f"Gemini transcript analysis failed: {e}")
        #             return None
