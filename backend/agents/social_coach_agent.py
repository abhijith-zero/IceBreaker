import logging
import base64
from google.genai import types
from core.config import get_settings
from agents.prompt_builder import build_system_prompt
from agents.response_parser import parse_gemini_response, make_fallback_response
from models.scenario import Scenario
from models.coaching import CoachingOutput

logger = logging.getLogger(__name__)


class SocialCoachAgent:
    """
    Wraps the Gemini Live API session for one practice session.
    One instance = one user session.
    Uses lazy initialization — genai client created on first use,
    not at import time, to avoid credential errors on startup.
    """

    def __init__(self, scenario: Scenario):
        self.scenario = scenario
        self._client = None
        self._session = None
        self._context_manager = None

    @property
    def client(self):
        if self._client is None:
            from google import genai
            settings = get_settings()
            self._client = genai.Client(
                vertexai=True,
                project=settings.google_cloud_project,
                location=settings.vertex_ai_location,
            )
        return self._client

    async def connect(self) -> str:
        """
        Opens the Gemini Live session.
        Returns the AI persona's opening line.
        Call this once when the session starts.
        """
        settings = get_settings()
        system_prompt = build_system_prompt(self.scenario)

        config = types.LiveConnectConfig(
            response_modalities=["TEXT"],
            system_instruction=system_prompt,
        )

        # connect() returns an async context manager — enter manually
        # so the session stays open across multiple turns
        self._context_manager = self.client.aio.live.connect(
            model=settings.gemini_model,
            config=config,
        )
        self._session = await self._context_manager.__aenter__()

        logger.info(
            f"Gemini Live session opened | scenario: {self.scenario.id}"
        )

        # Trigger the opening line
        await self._session.send(
            input="[SESSION_START] Begin the conversation with your opening line.",
            end_of_turn=True,
        )

        response = await self._collect_response()
        if response:
            return response.persona_response

        return self.scenario.opening_line

    async def send_turn(
        self,
        transcript: str,
        video_frame_b64: str | None = None,
    ) -> CoachingOutput:
        """
        Sends a user turn (transcript + optional webcam frame).
        Returns fully typed CoachingOutput.
        """
        if not self._session:
            raise RuntimeError("Agent not connected — call connect() first.")

        parts = []

        if video_frame_b64:
            image_bytes = base64.b64decode(video_frame_b64)
            parts.append(
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type="image/jpeg"
                )
            )

        parts.append(types.Part.from_text(text=transcript))

        await self._session.send(input=parts, end_of_turn=True)

        response = await self._collect_response()
        return response or make_fallback_response()

    async def _collect_response(self) -> CoachingOutput | None:
        """
        Collects streamed text chunks from Gemini into a full response.
        Uses turn_complete signal to know when Gemini is done.
        """
        full_text = ""

        async for message in self._session.receive():
            if message.text:
                full_text += message.text
            if (
                hasattr(message, "server_content")
                and message.server_content
                and message.server_content.turn_complete
            ):
                break

        if not full_text.strip():
            logger.warning("Gemini returned empty response")
            return None

        try:
            return parse_gemini_response(full_text)
        except Exception as e:
            logger.error(f"Parse error: {e} | raw: {full_text}")
            return None

    async def disconnect(self) -> None:
        """Closes the Gemini Live session cleanly."""
        if self._context_manager:
            await self._context_manager.__aexit__(None, None, None)
            self._session = None
            self._context_manager = None
            logger.info(
                f"Gemini Live session closed | scenario: {self.scenario.id}"
            )