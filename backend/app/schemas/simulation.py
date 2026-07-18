from pydantic import BaseModel, Field


class SimulationRequest(BaseModel):
    vehicles: int = Field(default=100, ge=1, le=100000)
    congestion_factor: float = Field(default=1.0, gt=0)


class SimulationResult(BaseModel):
    vehicles: int
    congestion_factor: float
    estimated_delay_minutes: float
    network_status: str
