import os
from google import genai
from google.genai import types
from ..api.routes.scenarios import get_scenario, Persona

class SocialCoachAgent:
    def __init__(self, scenario_id: str):
        self.scenario: Persona = get_scenario(scenario_id)
        
        # We require project ID and location for Vertex AI
        self.project_id = os.environ.get("GOOGLE_CLOUD_PROJECT")
        self.location = os.environ.get("VERTEX_AI_LOCATION", "us-central1")
        
        if not self.project_id:
            print("Warning: GOOGLE_CLOUD_PROJECT environment variable is not set.")
            
        # Initialize the GenAI client using Vertex AI
        self.client = genai.Client(
            vertexai=True,
            project=self.project_id,
            location=self.location
        )
        
        # Gemini 2.0 Flash is currently recommended for Live API
        self.model = "gemini-2.0-flash"
        # Define the system prompt based on the scenario
        self.system_instruction = (
            f"You are {self.scenario.name}. {self.scenario.description}\n"
            f"Instructions: {self.scenario.instructions}\n\n"
            "You are participating in a real-time conversation via an audio-vision interface. "
            "Keep your responses concise, natural, and conversational. Do not use markdown, bullet points, or emojis in your spoken responses. "
            "Respond in 1 to 3 short sentences so the user has time to practice speaking."
        )

    def get_live_connection(self):
        """
        Returns a context manager for the live connection to Gemini.
        Returns the async connection object.
        """
        config = types.LiveConnectConfig(
            system_instruction=types.Content(parts=[types.Part.from_text(text=self.system_instruction)]),
            # We want both AUDIO (for the persona's voice) and TEXT (for coaching feedback)
            response_modalities=[types.Modality.AUDIO, types.Modality.TEXT],
        )
        return self.client.aio.live.connect(model=self.model, config=config)
