from pydantic import BaseModel


class ScenarioOut(BaseModel):
    id: str
    name: str
    difficulty: str
    persona_name: str
    persona_role: str = ""
    description: str = ""
    opening_line: str

    # persona_backstory stays server-side (it's part of the prompt)


class ScenarioListResponse(BaseModel):
    scenarios: list[ScenarioOut]