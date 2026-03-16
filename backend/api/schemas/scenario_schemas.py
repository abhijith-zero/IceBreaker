from pydantic import BaseModel


class ScenarioOut(BaseModel):
    id: str
    name: str
    difficulty: str
    persona_name: str
    opening_line: str

    # We expose only what the frontend needs
    # persona_backstory stays server-side (it's part of the prompt)


class ScenarioListResponse(BaseModel):
    scenarios: list[ScenarioOut]