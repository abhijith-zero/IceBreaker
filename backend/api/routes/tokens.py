from fastapi import APIRouter
from core.config import get_settings
from agents.prompt_builder import build_system_prompt
from services.scenario_service import ScenarioService

router = APIRouter()
settings = get_settings()
scenario_service = ScenarioService()


@router.get("/session-config")
async def get_session_config(scenario_id: str):
    scenario = scenario_service.get_by_id(scenario_id)
    system_prompt = build_system_prompt(scenario)
    return {"system_prompt": system_prompt}
