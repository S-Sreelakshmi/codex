from pydantic import BaseModel, Field

from app.schemas.road_closure import AccessibilityMetrics


class FacilityPlacementRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius: int = Field(default=800, ge=100, le=10000)


class FacilityCandidate(BaseModel):
    node_id: str
    latitude: float
    longitude: float
    average_travel_time_seconds: float | None
    accessibility_score: float


class FacilityPlacementResponse(BaseModel):
    baseline: AccessibilityMetrics
    recommended_location: FacilityCandidate
    top_candidates: list[FacilityCandidate]
    accessibility_improvement: float
    travel_time_improvement_seconds: float | None
    candidates_evaluated: int
