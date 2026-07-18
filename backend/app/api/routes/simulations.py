from fastapi import APIRouter
from app.schemas.simulation import SimulationRequest, SimulationResult
from app.services.simulation import run_simulation

router = APIRouter(prefix="/simulations", tags=["simulations"])


@router.post("/run", response_model=SimulationResult)
def simulate(request: SimulationRequest) -> SimulationResult:
    return run_simulation(request)
