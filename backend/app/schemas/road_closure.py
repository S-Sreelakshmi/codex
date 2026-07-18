from pydantic import BaseModel, Field

from app.schemas.digital_twin import RoadFeature


class RoadClosureRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius: int = Field(default=800, ge=100, le=10000)
    edge_id: str = Field(..., min_length=3)


class AccessibilityMetrics(BaseModel):
    average_travel_time_seconds: float | None
    reachable_nodes: int
    connected_components: int
    accessibility_score: float


class ClosureDelta(BaseModel):
    travel_time_change_percent: float | None
    reachable_node_change: int


class RoadClosureResponse(BaseModel):
    before: AccessibilityMetrics
    after: AccessibilityMetrics
    delta: ClosureDelta
    closed_edge: RoadFeature
