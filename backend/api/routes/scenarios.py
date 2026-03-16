from fastapi import APIRouter
from api.schemas.scenario_schemas import ScenarioOut, ScenarioListResponse
from services.scenario_service import ScenarioService

router = APIRouter()
scenario_service = ScenarioService()


@router.get("/scenarios", response_model=ScenarioListResponse)
async def get_scenarios():
    scenarios = scenario_service.get_all()
    return ScenarioListResponse(
        scenarios=[ScenarioOut(**vars(s)) for s in scenarios]
    )


@router.get("/scenarios/{scenario_id}", response_model=ScenarioOut)
async def get_scenario(scenario_id: str):
    scenario = scenario_service.get_by_id(scenario_id)
    return ScenarioOut(**vars(scenario))