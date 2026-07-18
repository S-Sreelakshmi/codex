from pydantic import BaseModel, Field


class GraphLoadRequest(BaseModel):
    place_name: str = Field(..., examples=["Indiranagar, Bengaluru, India"])
    network_type: str = "drive"


class GraphSummary(BaseModel):
    nodes: int
    edges: int
    place_name: str | None = None


class RouteRequest(BaseModel):
    source_node: int
    target_node: int


class RouteResponse(BaseModel):
    nodes: list[int]
    distance_meters: float
