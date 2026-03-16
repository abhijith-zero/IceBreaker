from dataclasses import dataclass

@dataclass
class Scenario:
    id: str
    name: str
    difficulty: str           
    persona_name: str
    persona_description: str
    persona_backstory: str
    opening_line: str