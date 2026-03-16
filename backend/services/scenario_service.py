import json
from pathlib import Path
from models.scenario import Scenario
from core.exceptions import ScenarioNotFoundException


class ScenarioService:
    def __init__(self):
        self._scenarios: dict[str, Scenario] = {}
        self._load_scenarios()

    def _load_scenarios(self) -> None:
        data_path = Path(__file__).parent.parent / "data" / "scenarios.json"
        with open(data_path, "r") as f:
            raw = json.load(f)
        for key, value in raw.items():
            self._scenarios[key] = Scenario(**value)

    def get_all(self) -> list[Scenario]:
        return list(self._scenarios.values())

    def get_by_id(self, scenario_id: str) -> Scenario:
        scenario = self._scenarios.get(scenario_id)
        if not scenario:
            raise ScenarioNotFoundException(scenario_id)
        return scenario